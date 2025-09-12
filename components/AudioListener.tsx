"use client"

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mic, MicOff, Play, Pause, Volume2 } from 'lucide-react'

interface Recommendation {
  filename: string
  bpm: number
  key: string
  url: string
}

interface AudioListenerProps {
  onRecommendations?: (recommendations: Recommendation[]) => void
  className?: string
}

export default function AudioListener({ onRecommendations, className = "" }: AudioListenerProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordingProgress, setRecordingProgress] = useState(0)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null)
  const [detectedKey, setDetectedKey] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({})
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
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
        await processAudio(audioBlob)
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

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

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('/api/recommend', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process audio')
      }

      const data = await response.json()
      
      setDetectedBPM(data.detectedBPM)
      setDetectedKey(data.detectedKey)
      setRecommendations(data.recommendations || [])
      
      if (onRecommendations) {
        onRecommendations(data.recommendations || [])
      }
      
    } catch (error) {
      console.error('Error processing audio:', error)
      alert('Failed to process audio. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleAudio = (url: string) => {
    const audio = audioRefs.current[url]
    
    if (!audio) {
      const newAudio = new Audio(url)
      audioRefs.current[url] = newAudio
      newAudio.addEventListener('ended', () => setPlayingAudio(null))
      newAudio.play()
      setPlayingAudio(url)
    } else if (playingAudio === url) {
      audio.pause()
      setPlayingAudio(null)
    } else {
      // Stop currently playing audio
      Object.values(audioRefs.current).forEach(a => a.pause())
      audio.play()
      setPlayingAudio(url)
    }
  }

  const formatFilename = (filename: string) => {
    return filename.replace('Manifxtsounds - ', '').replace('.wav', '')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-6">
        <motion.button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-green-500 hover:bg-green-600'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileHover={!isProcessing ? { scale: 1.05 } : {}}
          whileTap={!isProcessing ? { scale: 0.95 } : {}}
          animate={isRecording ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 1, repeat: isRecording ? Infinity : 0 }}
        >
          {isRecording ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </motion.button>

        {/* Progress Bar */}
        {isRecording && (
          <div className="w-full max-w-xs">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                className="bg-green-500 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${recordingProgress}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
              {Math.round(recordingProgress / 10)}s / 10s
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isRecording 
              ? 'Listening to your environment...' 
              : isProcessing 
                ? 'Analyzing audio...' 
                : 'Click to listen to your environment'
            }
          </p>
        </div>
      </div>

      {/* Detection Results */}
      {(detectedBPM || detectedKey) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Detected Audio
          </h3>
          <div className="flex space-x-4 text-sm">
            {detectedBPM && (
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">BPM:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{detectedBPM}</span>
              </div>
            )}
            {detectedKey && (
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Key:</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">{detectedKey}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Recommended Loops
          </h3>
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <motion.div
                key={rec.filename}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
                      {formatFilename(rec.filename)}
                    </h4>
                    <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>BPM: {rec.bpm}</span>
                      <span>Key: {rec.key}</span>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => toggleAudio(rec.url)}
                    className="p-2 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors duration-200"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {playingAudio === rec.url ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
