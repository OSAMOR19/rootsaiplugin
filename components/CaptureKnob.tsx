"use client"

import { motion } from "framer-motion"
import { Play, Square, Mic, MicOff } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { syncEngine, blobToAudioBuffer, detectBPM } from "@/lib/syncEngine"

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
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecordingProgress(0)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        setRecordedAudioBlob(audioBlob) // Store the recorded audio for playback
        
        // Convert to AudioBuffer and detect BPM
        try {
          const audioBuffer = await blobToAudioBuffer(audioBlob)
          const bpm = detectBPM(audioBuffer)
          
          setRecordedAudioBuffer(audioBuffer)
          setRecordedBPM(bpm)
          
          await processAudio(audioBlob, audioBuffer)
        } catch (error) {
          console.error('Error processing recorded audio:', error)
        }
        
        // Stop all tracks to release microphone
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
      console.error('Error accessing microphone:', error)
      alert('Could not access microphone. Please check permissions.')
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

  const processAudio = async (audioBlob: Blob, audioBuffer: AudioBuffer) => {
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('/api/recommend', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle silence detection error
        if (data.error === 'No meaningful audio detected') {
          alert(data.message)
          return
        }
        throw new Error(data.error || 'Failed to process audio')
      }
      
      if (onAnalysisComplete) {
        onAnalysisComplete({
          ...data,
          recordedAudioBuffer: audioBuffer
        })
      }
      
    } catch (error) {
      console.error('Error processing audio:', error)
      console.error('Audio blob size:', audioBlob.size)
      console.error('Audio blob type:', audioBlob.type)
      
      // More specific error message
      if (error instanceof Error) {
        if (error.message.includes('No meaningful audio detected')) {
          alert('The recording appears to be silent or too quiet. Please try recording again with some audio playing.')
        } else {
          alert(`Failed to process audio: ${error.message}`)
        }
      } else {
        alert('Failed to process audio. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const playRecordedAudio = async () => {
    if (!recordedAudioBuffer) return

    try {
      syncEngine.stopAll()
      await syncEngine.playAudioBuffer(recordedAudioBuffer, { volume: 0.8 })
      setIsPlayingRecording(true)
    } catch (error) {
      console.error('Error playing recorded audio:', error)
      alert('Error playing recorded audio')
    }
  }

  const stopRecordedAudio = () => {
    syncEngine.stopAll()
    setIsPlayingRecording(false)
  }
  return (
    <div className="relative">
      {/* Main button container */}
      <motion.button
        className="relative w-64 h-64 rounded-full group overflow-hidden"
        onClick={
          isRecording 
            ? stopRecording 
            : hasListened && recordedAudioBuffer 
              ? (isPlayingRecording ? stopRecordedAudio : playRecordedAudio)
              : startRecording
        }
        disabled={disabled || isProcessing}
        whileHover={!disabled && !isProcessing ? { scale: 1.02 } : {}}
        whileTap={!disabled && !isProcessing ? { scale: 0.98 } : {}}
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
        {/* Rotating disc pattern when recording */}
        {(isRecording || isProcessing) && (
          <motion.div
            className="absolute inset-4 rounded-full"
            animate={{ rotate: 360 }}
            transition={{
              duration: 4,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
            style={{
              background: `
                radial-gradient(circle at center, transparent 0%, rgba(57, 160, 19, 0.1) 20%, transparent 25%, rgba(34, 197, 94, 0.1) 30%, transparent 35%, rgba(57, 160, 19, 0.1) 40%, transparent 45%, rgba(34, 197, 94, 0.1) 50%, transparent 55%, rgba(57, 160, 19, 0.1) 60%, transparent 65%, rgba(34, 197, 94, 0.1) 70%, transparent 75%, rgba(57, 160, 19, 0.1) 80%, transparent 85%, rgba(34, 197, 94, 0.1) 90%, transparent 95%, rgba(57, 160, 19, 0.1) 100%)
              `,
            }}
          >
            {/* Subtle rotating grooves */}
            <div className="absolute inset-0 rounded-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-green-300 opacity-20"
                  style={{
                    width: `${65 + i * 6}%`,
                    height: `${65 + i * 6}%`,
                    top: `${17.5 - i * 2.5}%`,
                    left: `${17.5 - i * 2.5}%`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Center icon */}
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
                : isRecording
                  ? "bg-gradient-to-br from-red-500 to-red-700"
                  : isProcessing
                    ? "bg-gradient-to-br from-yellow-500 to-yellow-700"
                    : "bg-gradient-to-br from-green-500 to-green-700"
            } shadow-2xl`}
            whileHover={{ scale: 1.1 }}
            animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
          >
            {hasListened && recordedAudioBuffer ? (
              isPlayingRecording ? (
                <Square className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-10 h-10 text-white ml-1" />
              )
            ) : isRecording ? (
              <MicOff className="w-8 h-8 text-white" />
            ) : isProcessing ? (
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </motion.div>
        </motion.div>

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
                    ? "PLAYING RECORDING • LISTEN TO WHAT WAS CAPTURED • "
                    : "CLICK TO PLAY • LISTEN TO YOUR RECORDING • CLICK TO PLAY • "
                  : hasListened
                    ? "AUDIO ANALYZED • SAMPLES READY • AUDIO ANALYZED • SAMPLES READY • "
                    : isRecording
                      ? "RECORDING • LISTENING TO ENVIRONMENT • RECORDING • "
                      : isProcessing
                        ? "ANALYZING AUDIO • PROCESSING • ANALYZING AUDIO • "
                        : "CLICK TO LISTEN • ANALYZE YOUR ENVIRONMENT • CLICK TO LISTEN • "}
              </textPath>
            </text>
          </svg>
        </div>
      </motion.button>

      {/* Progress bar when recording */}
      {isRecording && (
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

      {/* Status text */}
      {(isRecording || isProcessing || (hasListened && recordedAudioBuffer)) && (
        <motion.div
          className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center w-80"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-6 py-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <p className="text-gray-800 dark:text-gray-200 font-semibold text-lg mb-1">
              {isRecording 
                ? "Recording..." 
                : isProcessing 
                  ? "Analyzing..." 
                  : hasListened && recordedAudioBuffer
                    ? (isPlayingRecording ? "Playing..." : "Ready to play")
                    : ""
              }
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {isRecording 
                ? "Click to stop recording" 
                : isProcessing 
                  ? "Finding matching samples"
                  : hasListened && recordedAudioBuffer
                    ? (isPlayingRecording ? "Click to stop playback" : "Click to hear what was recorded")
                    : ""
              }
            </p>
            {recordedBPM && (
              <p className="text-green-600 dark:text-green-400 text-xs mt-2 font-medium">
                Detected BPM: {recordedBPM}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}
