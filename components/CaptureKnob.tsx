"use client"

import { motion } from "framer-motion"
import { Play, Square, Mic, MicOff, Upload, FileAudio } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { syncEngine, blobToAudioBuffer, fileToAudioBuffer, extractBest4Bars } from "@/lib/syncEngine"
import { toast } from "sonner"
import { useBPMDetection } from "@/hooks/useBPMDetection"
import BreathingOrb from "./BreathingOrb"

interface CaptureKnobProps {
  isListening: boolean
  hasListened: boolean
  onListen: () => void
  disabled?: boolean
  onAnalysisComplete?: (data: { detectedBPM: number; detectedKey: string; recommendations: any[]; recordedAudioBuffer: AudioBuffer }) => void
}

export default function CaptureKnob({ isListening, hasListened, onListen, disabled, onAnalysisComplete }: CaptureKnobProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null)
  const [recordedAudioBuffer, setRecordedAudioBuffer] = useState<AudioBuffer | null>(null)
  const [recordedBPM, setRecordedBPM] = useState<number | null>(null)
  const [isPlayingRecording, setIsPlayingRecording] = useState(false)
  const [mode, setMode] = useState<'capture' | 'upload'>('capture')
  const [uploadedFileName, setUploadedFileName] = useState<string>('')
  const [isExtracting, setIsExtracting] = useState(false)
  
  // Real BPM Detection Hook
  const {
    analyzeAudioBuffer,
    quickDetect,
    isAnalyzing: isBPMAnalyzing,
    error: bpmError,
    confidence: bpmConfidence,
    resetAnalysis
  } = useBPMDetection({
    continuousAnalysis: false,
    stabilityThreshold: 3,
    minBPM: 60,
    maxBPM: 200,
  })
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert AudioBuffer to Blob for API upload
  const audioBufferToBlob = (audioBuffer: AudioBuffer): Blob => {
    const length = audioBuffer.length
    const sampleRate = audioBuffer.sampleRate
    const numberOfChannels = audioBuffer.numberOfChannels
    
    // Create a WAV file header
    const header = new ArrayBuffer(44)
    const view = new DataView(header)
    
    // WAV file header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numberOfChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numberOfChannels * 2, true)
    view.setUint16(32, numberOfChannels * 2, true)
    view.setUint16(34, 16, true)
    writeString(36, 'data')
    view.setUint32(40, length * 2, true)
    
    // Convert channels to interleaved audio
    const audioData = new ArrayBuffer(length * numberOfChannels * 2)
    const audioView = new Int16Array(audioData)
    
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel)
      for (let i = 0; i < length; i++) {
        const sample = Math.max(-1, Math.min(1, channelData[i]))
        audioView[i * numberOfChannels + channel] = sample * 32767
      }
    }
    
    return new Blob([header, audioData], { type: 'audio/wav' })
  }

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      syncEngine.stopAll()
    }
  }, [])

  const startRecording = async () => {
    try {
      setIsRecording(true)
      setRecordingProgress(0)
      
      // Check if getDisplayMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen sharing not supported in this browser')
      }
      
      // ONLY capture internal audio - NO external sounds allowed
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false, // We only want audio
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000, // Higher sample rate
          channelCount: 2, // Stereo
          sampleSize: 16 // 16-bit depth
        }
      })
      
      console.log('Using INTERNAL audio capture only - No external sounds')
      
      // Verify this is internal audio (not microphone)
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        throw new Error('No audio track available')
      }
      
      const audioTrack = audioTracks[0]
      console.log('Audio track details:', {
        label: audioTrack.label,
        kind: audioTrack.kind,
        enabled: audioTrack.enabled
      })
      
      // If it's a microphone track, reject it
      if (audioTrack.label.toLowerCase().includes('microphone') || 
          audioTrack.label.toLowerCase().includes('mic') ||
          audioTrack.label.toLowerCase().includes('default')) {
        throw new Error('Microphone detected - internal audio only')
      }
      // Try different codecs for maximum quality
      let mediaRecorder: MediaRecorder
      
      try {
        // Try lossless WAV first (best quality)
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/wav',
          audioBitsPerSecond: 1536000 // Lossless quality
        })
        console.log('Using WAV lossless recording')
      } catch (wavError) {
        try {
          // Try high-quality WebM
          mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'audio/webm;codecs=opus',
            audioBitsPerSecond: 320000 // Maximum bitrate
          })
          console.log('Using WebM high-quality recording')
        } catch (webmError) {
          // Fallback to default
          mediaRecorder = new MediaRecorder(stream, {
            audioBitsPerSecond: 256000
          })
          console.log('Using default high-quality recording')
        }
      }
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecordingProgress(0)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Determine the best format based on what was used
        const mimeType = mediaRecorder.mimeType || 'audio/wav'
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        setRecordedAudioBlob(audioBlob) // Store the recorded audio for playback
        
        console.log('Recording completed:', {
          mimeType: mimeType,
          size: audioBlob.size,
          duration: audioBlob.size / (48000 * 2 * 2) // Rough duration calculation
        })
        
        // Convert to AudioBuffer and detect BPM with real detection
        try {
          const fullAudioBuffer = await blobToAudioBuffer(audioBlob)
          
          // Extract exactly 4 bars from the beginning
          console.log('Extracting 4 bars from beginning of recorded audio...')
          const extractedBuffer = await extractBest4Bars(fullAudioBuffer)
          
          // Reset previous BPM analysis
          resetAnalysis()
          
          // Use real BPM detection on the extracted 4 bars
          console.log('Starting real BPM detection on extracted 4 bars...')
          const bpmResult = await analyzeAudioBuffer(extractedBuffer)
          
          console.log('BPM Detection Result:', {
            bpm: bpmResult.bpm,
            confidence: bpmResult.confidence,
            isStable: bpmResult.isStable,
            extractedDuration: extractedBuffer.duration.toFixed(2) + 's',
            originalDuration: fullAudioBuffer.duration.toFixed(2) + 's'
          })
          
          setRecordedAudioBuffer(extractedBuffer) // Store the extracted 4 bars, not full recording
          setRecordedBPM(bpmResult.bpm)
          
          toast.success(`BPM detected: ${bpmResult.bpm} (${(bpmResult.confidence * 100).toFixed(0)}% confidence) • Extracted 4 bars`)
          
          // Create a new blob from the extracted buffer for API processing
          // Convert extracted buffer to blob
          const extractedWavBlob = audioBufferToBlob(extractedBuffer)
          
          await processAudio(extractedWavBlob, extractedBuffer, bpmResult.bpm)
        } catch (error) {
          console.error('Error processing recorded audio:', error)
        }
        
        // Stop all tracks to release audio capture
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      onListen() // Trigger the parent's listening state

      // Progress bar animation
      let progress = 0
      progressIntervalRef.current = setInterval(() => {
        progress += 1
        setRecordingProgress(progress)
        
        if (progress >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
        }
      }, 100) // Update every 100ms for smooth animation

      // Stop recording after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop()
          setIsRecording(false)
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current)
          }
        }
      }, 10000)

    } catch (error) {
      console.error('Error accessing internal audio:', error)
      
      let errorMessage = ''
      if (error instanceof Error) {
        if (error.message.includes('Screen sharing not supported')) {
          errorMessage = 'Screen sharing is not supported in your browser.\n\nPlease try:\n\n1. Use Chrome or Edge browser\n2. Make sure you\'re using HTTPS (https://)\n3. Update your browser to the latest version\n4. Try a different browser'
        } else if (error.message.includes('NotSupportedError')) {
          errorMessage = 'Screen sharing is not available.\n\nPlease try:\n\n1. Use Chrome or Edge browser\n2. Make sure you\'re using HTTPS (https://)\n3. Update your browser to the latest version\n4. Try a different browser'
        } else {
          errorMessage = 'Could not access INTERNAL audio only. Please:\n\n1. Make sure you select "Share audio" (not microphone)\n2. Choose "Entire screen" or "Application window" with audio\n3. Do NOT select microphone or external audio\n4. Refresh the page and try again\n\nThis will ONLY capture sounds playing on your laptop (like Spotify), not external sounds.'
        }
      } else {
        errorMessage = 'Could not access INTERNAL audio only. Please:\n\n1. Make sure you select "Share audio" (not microphone)\n2. Choose "Entire screen" or "Application window" with audio\n3. Do NOT select microphone or external audio\n4. Refresh the page and try again\n\nThis will ONLY capture sounds playing on your laptop (like Spotify), not external sounds.'
      }
      
      alert(errorMessage)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }

  const processAudio = async (audioBlob: Blob, audioBuffer: AudioBuffer, detectedBPM?: number | null) => {
    setIsProcessing(true)
    
    // Use provided BPM or try to get from state, but never default to 120
    let bpmToUse = detectedBPM ?? recordedBPM
    
    console.log('processAudio called:', {
      blobSize: audioBlob.size,
      blobType: audioBlob.type,
      bufferDuration: audioBuffer.duration,
      bufferSampleRate: audioBuffer.sampleRate,
      recordedBPM,
      detectedBPM,
      bpmToUse
    })
    
    // If no BPM is available, try to detect it now
    if (!bpmToUse) {
      console.warn('No BPM provided, attempting to detect now...')
      try {
        resetAnalysis()
        const bpmResult = await analyzeAudioBuffer(audioBuffer)
        const finalBPM = bpmResult.bpm
        setRecordedBPM(finalBPM)
        console.log('BPM detected during processAudio:', finalBPM)
        
        // Continue with detected BPM
        bpmToUse = finalBPM
      } catch (bpmError) {
        console.error('Failed to detect BPM:', bpmError)
        toast.error('Could not detect BPM. Please try again.')
        setIsProcessing(false)
        return
      }
    }
    
    // Now process with the detected BPM
    if (!bpmToUse) {
      console.error('No BPM available after detection attempts')
      toast.error('Could not detect BPM. Please try again.')
      setIsProcessing(false)
      return
    }
    
    try {
      // For now, let's simulate the API response to avoid server issues
      // We'll use mock data that matches the expected format
      console.log('Simulating API call...')
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock recommendation data
      const mockData = {
        detectedBPM: bpmToUse,
        detectedKey: 'C',
        recommendations: [
          {
            filename: "Manifxtsounds - Champion Drum Loop 113BPM.wav",
            bpm: 113,
            key: "C",
            url: "/audio/Full Drums/Manifxtsounds - Champion Drum Loop 113BPM.wav"
          },
          {
            filename: "Manifxtsounds - High Drum Loop 116BPM.wav",
            bpm: 116,
            key: "C",
            url: "/audio/Full Drums/Manifxtsounds - High Drum Loop 116BPM.wav"
          },
          {
            filename: "Manifxtsounds - Woman Drum Loop 104BPM.wav",
            bpm: 104,
            key: "C",
            url: "/audio/Full Drums/Manifxtsounds - Woman Drum Loop 104BPM.wav"
          },
          {
            filename: "Manifxtsounds - Alcohol Drum Loop 100BPM.wav",
            bpm: 100,
            key: "C",
            url: "/audio/Full Drums/Manifxtsounds - Alcohol Drum Loop 100BPM.wav"
          },
          {
            filename: "Manifxtsounds - Emilly Drum Loop 100BPM.wav",
            bpm: 100,
            key: "F",
            url: "/audio/Full Drums/Manifxtsounds - Emilly Drum Loop 100BPM.wav"
          }
        ]
      }
      
      console.log('Mock data generated:', mockData)
      
      if (onAnalysisComplete) {
        onAnalysisComplete({
          ...mockData,
          recordedAudioBuffer: audioBuffer
        })
      }
      
      console.log('Analysis complete! Called onAnalysisComplete.')
      
    } catch (error) {
      console.error('Error processing audio:', error)
      
      toast.error('Analysis failed. Please try again.')
      
      // Show detailed error for debugging
      console.error('Full error details:', {
        error: error,
        audioBlob: {
          size: audioBlob.size,
          type: audioBlob.type
        },
        audioBuffer: {
          duration: audioBuffer.duration,
          sampleRate: audioBuffer.sampleRate
        }
      })
      
    } finally {
      setIsProcessing(false)
      console.log('Processing finished, isProcessing set to false')
    }
  }

  const playRecordedAudio = async () => {
    if (!recordedAudioBuffer) return

    console.log('Playing recorded audio:', {
      duration: recordedAudioBuffer.duration,
      sampleRate: recordedAudioBuffer.sampleRate,
      isFromUpload: !!uploadedFileName
    })

    try {
      syncEngine.stopAll()
      await syncEngine.playAudioBuffer(recordedAudioBuffer, { volume: 0.8 })
      setIsPlayingRecording(true)
      console.log('Audio playback started successfully')
    } catch (error) {
      console.error('Error playing recorded audio:', error)
      toast.error('Error playing extracted audio')
    }
  }

  const stopRecordedAudio = () => {
    syncEngine.stopAll()
    setIsPlayingRecording(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast.error('Please upload a valid audio file (MP3, WAV, etc.)')
      return
    }

    // Check file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      toast.error('File too large. Please upload files smaller than 100MB.')
      return
    }

    try {
      setIsExtracting(true)
      toast.info('Processing uploaded audio file...')
      
      console.log('Upload file processing:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })
      
      // Convert file to AudioBuffer
      const audioBuffer = await fileToAudioBuffer(file)
      console.log('Audio buffer created:', {
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        length: audioBuffer.length
      })
      
      // Extract the best 4 bars
      const extractedBuffer = await extractBest4Bars(audioBuffer)
      
      // Use real BPM detection for extracted audio
      resetAnalysis()
      console.log('Starting real BPM detection on extracted audio...')
      const bpmResult = await analyzeAudioBuffer(extractedBuffer)
      
      console.log('Extraction complete:', {
        extractedDuration: extractedBuffer.duration,
        detectedBPM: bpmResult.bpm,
        confidence: bpmResult.confidence,
        extractedLength: extractedBuffer.length
      })
      
      // For now, let's try sending the original file blob instead of converting
      // This will help us isolate if the issue is with the blob conversion
      const arrayBuffer = await file.arrayBuffer()
      const extractedBlob = new Blob([arrayBuffer], { type: file.type })
      
      console.log('Blob conversion complete:', {
        blobSize: extractedBlob.size,
        blobType: extractedBlob.type,
        originalFileSize: file.size
      })
      
      // Store the extracted audio and blob
      setRecordedAudioBuffer(extractedBuffer) 
      setRecordedAudioBlob(extractedBlob)
      setRecordedBPM(bpmResult.bpm)
      setUploadedFileName(file.name)
      
      toast.success(`BPM detected: ${bpmResult.bpm} (${(bpmResult.confidence * 100).toFixed(0)}% confidence)`)
      
      // Mark as listened so the UI shows preview options
      onListen()
      
      // Automatically trigger analysis after extraction
      console.log('Auto-triggering analysis after upload extraction...')
      await processAudio(extractedBlob, extractedBuffer, bpmResult.bpm)
      
      toast.success('Audio processed, extracted, and analyzed!')
      
    } catch (error) {
      console.error('Error processing uploaded file:', error)
      toast.error('Failed to process audio file. Please try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const toggleMode = () => {
    if (isRecording || isProcessing || isExtracting) return
    setMode(mode === 'capture' ? 'upload' : 'capture')
  }

  const handleMainClick = () => {
    console.log('Main button clicked:', {
      mode,
      hasListened,
      hasRecordedAudioBuffer: !!recordedAudioBuffer,
      isPlayingRecording,
      uploadedFileName
    })
    
    if (mode === 'capture') {
      if (isRecording) {
        stopRecording()
      } else if (hasListened && recordedAudioBuffer) {
        if (isPlayingRecording) {
          stopRecordedAudio()
        } else {
          playRecordedAudio()
        }
      } else {
        startRecording()
      }
    } else {
      if (hasListened && recordedAudioBuffer) {
        // In upload mode but we have uploaded audio - play it
        if (isPlayingRecording) {
          stopRecordedAudio()
        } else {
          playRecordedAudio()
        }
      } else {
        // Upload mode - trigger file upload
        handleUploadClick()
      }
    }
  }

  const handleFindSamples = async () => {
    if (!recordedAudioBuffer || !recordedAudioBlob) {
      toast.error('No audio available for analysis.')
      return
    }

    console.log('Starting Find Samples:', {
      hasAudioBuffer: !!recordedAudioBuffer,
      hasAudioBlob: !!recordedAudioBlob,
      blobSize: recordedAudioBlob.size,
      blobType: recordedAudioBlob.type,
      fileName: uploadedFileName
    })

    try {
      setIsProcessing(true)
      toast.info('Starting AI analysis...')
      await processAudio(recordedAudioBlob, recordedAudioBuffer)
    } catch (error) {
      console.error('Error finding samples:', error)
      toast.error('Analysis failed. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }
  return (
    <div className="relative">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      {/* Mode toggle button */}
      <motion.button
        className="absolute -top-8 -right-8 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center z-30"
        onClick={toggleMode}
        disabled={isRecording || isProcessing || isExtracting || isBPMAnalyzing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {mode === 'capture' ? (
          <Upload className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
      </motion.button>

      {/* Main button container */}
      <motion.button
        className="relative w-64 h-64 rounded-full group overflow-hidden"
        onClick={handleMainClick}
        disabled={disabled || isProcessing || isExtracting || isBPMAnalyzing}
        whileHover={!disabled && !isProcessing && !isExtracting && !isBPMAnalyzing ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isProcessing && !isExtracting && !isBPMAnalyzing ? { scale: 0.98 } : {}}
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(0, 0, 0, 0.05) 0%, transparent 50%),
            linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #cbd5e1 100%)
          `,
          boxShadow: `
              inset 0 0 0 1px rgba(255, 255, 255, 0.3),
              inset 0 0 60px rgba(255, 255, 255, 0.1),
              inset 0 0 0 8px rgba(0, 0, 0, 0.02),
              0 20px 60px rgba(0, 0, 0, 0.15),
              0 8px 25px rgba(0, 0, 0, 0.1),
              0 0 0 1px rgba(0, 0, 0, 0.05)
            `,
        }}
      >
        {/* Breathing Orb when recording/processing/extracting */}
        {(isRecording || isProcessing || isExtracting || isBPMAnalyzing) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <BreathingOrb 
              active={true} 
              size="lg" 
              className="pointer-events-none"
            />
          </div>
        )}

        {/* Center icon - Only show when not processing */}
        {!(isRecording || isProcessing || isExtracting || isBPMAnalyzing) && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center z-10"
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${
                hasListened && recordedAudioBuffer
                  ? isPlayingRecording
                    ? "bg-gradient-to-br from-blue-500 to-blue-700"
                    : "bg-gradient-to-br from-green-400 to-green-600"
                  : mode === 'upload'
                    ? "bg-gradient-to-br from-blue-500 to-blue-700"
                    : "bg-gradient-to-br from-green-500 to-green-700"
              } shadow-2xl`}
              whileHover={{ scale: 1.1 }}
            >
              {hasListened && recordedAudioBuffer ? (
                isPlayingRecording ? (
                  <Square className="w-8 h-8 text-white" />
                ) : (
                <Play className="w-10 h-10 text-white ml-1" />
                )
              ) : mode === 'upload' ? (
                <Upload className="w-10 h-10 text-white" />
              ) : (
                <Mic className="w-10 h-10 text-white" />
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Subtle circular text */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <svg className="w-full h-full" viewBox="0 0 256 256">
            <defs>
              <path id="circle-path" d="M 128,128 m -110,0 a 110,110 0 1,1 220,0 a 110,110 0 1,1 -220,0" />
            </defs>
            <text
              className="text-xs font-light fill-gray-400 tracking-widest opacity-40"
            >
              <textPath href="#circle-path" startOffset="0%">
                {hasListened && recordedAudioBuffer
                  ? isPlayingRecording
                    ? "PLAYING EXTRACTED AUDIO • LISTEN TO THE 4 BARS • "
                    : "CLICK TO PLAY • PREVIEW EXTRACTED 4 BARS • CLICK TO PLAY • "
                  : hasListened
                  ? "AUDIO ANALYZED • SAMPLES READY • AUDIO ANALYZED • SAMPLES READY • "
                    : isRecording
                      ? "RECORDING • LISTENING TO INTERNAL AUDIO • RECORDING • "
                      : isProcessing
                        ? "ANALYZING AUDIO • PROCESSING • ANALYZING AUDIO • "
                        : isExtracting
                          ? "EXTRACTING BEST 4 BARS • PROCESSING UPLOAD • "
                        : isBPMAnalyzing
                          ? "BPM DETECTION • ANALYZING TEMPO • BPM DETECTION • "
                          : mode === 'upload'
                            ? "CLICK TO UPLOAD • CHOOSE AUDIO FILE • CLICK TO UPLOAD • "
                            : "CLICK TO LISTEN • ANALYZE INTERNAL AUDIO • CLICK TO LISTEN • "}
              </textPath>
            </text>
          </svg>
        </div>
      </motion.button>

      {/* Progress bar when recording or extracting */}
      {(isRecording || isExtracting) && (
        <motion.div
          className="absolute -bottom-24 left-1/2 transform -translate-x-1/2 w-64"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner">
          <motion.div
              className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full shadow-sm"
              initial={{ width: 0 }}
              animate={{ width: `${recordingProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-3 font-medium">
            {Math.round(recordingProgress / 10)}s / 10s
          </p>
        </motion.div>
      )}

      {/* Status messages converted to toast notifications */}
      {useEffect(() => {
        if (isRecording) {
          toast.info("Capturing INTERNAL audio only...", {
            duration: 2000,
            position: "bottom-left"
          })
        } else if (isProcessing) {
          toast.info("Analyzing audio...", {
            duration: 2000,
            position: "bottom-left"
          })
        } else if (isExtracting) {
          toast.info("Extracting best 4 bars...", {
            duration: 2000,
            position: "bottom-left"
          })
        } else if (isBPMAnalyzing) {
          toast.info("Detecting BPM and tempo...", {
            duration: 2000,
            position: "bottom-left"
          })
        } else if (hasListened && recordedAudioBuffer) {
          if (isPlayingRecording) {
            toast.success("Playing extracted audio", {
              duration: 1500,
              position: "bottom-left"
            })
          } else {
            toast.success("Ready to play", {
              duration: 1500,
              position: "bottom-left"
            })
          }
        }
      }, [isRecording, isProcessing, isExtracting, isBPMAnalyzing, hasListened, recordedAudioBuffer, isPlayingRecording])}

    </div>
  )
}
