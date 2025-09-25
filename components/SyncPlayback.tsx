"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Volume2 } from 'lucide-react'
import { syncEngine, loadAudioBuffer, detectBPM } from '@/lib/syncEngine'

interface SyncPlaybackProps {
  recordedAudioBuffer: AudioBuffer | null
  recordedBPM: number | null
  sampleUrl: string
  sampleBPM: number
  sampleName: string
}

export default function SyncPlayback({ 
  recordedAudioBuffer, 
  recordedBPM, 
  sampleUrl, 
  sampleBPM, 
  sampleName 
}: SyncPlaybackProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [sampleBuffer, setSampleBuffer] = useState<AudioBuffer | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load sample buffer
  useEffect(() => {
    if (sampleUrl) {
      setIsLoading(true)
      loadAudioBuffer(sampleUrl)
        .then(buffer => {
          setSampleBuffer(buffer)
          setIsLoading(false)
        })
        .catch(error => {
          console.error('Error loading sample:', error)
          setIsLoading(false)
        })
    }
  }, [sampleUrl])

  const handleSyncPlay = async () => {
    if (!recordedAudioBuffer || !sampleBuffer) return

    try {
      setIsPlaying(true)
      
      // Calculate playback rate for tempo matching
      const playbackRate = recordedBPM ? recordedBPM / sampleBPM : 1
      
      // Sync play both audio sources
      await syncEngine.syncPlay(
        recordedAudioBuffer,
        sampleBuffer,
        sampleBPM,
        { volume: 0.8 }
      )
      
      console.log(`Sync playing: ${sampleName} at ${playbackRate.toFixed(2)}x speed`)
    } catch (error) {
      console.error('Error in sync playback:', error)
      setIsPlaying(false)
    }
  }

  const handleStop = () => {
    syncEngine.stopAll()
    setIsPlaying(false)
  }

  const handlePlaySampleOnly = async () => {
    if (!sampleBuffer) return

    try {
      setIsPlaying(true)
      await syncEngine.playAudioBuffer(sampleBuffer, { volume: 0.8 })
    } catch (error) {
      console.error('Error playing sample:', error)
      setIsPlaying(false)
    }
  }

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">
            {sampleName}
          </h4>
          <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Sample BPM: {sampleBPM}</span>
            {recordedBPM && (
              <span>Recorded BPM: {recordedBPM}</span>
            )}
            {recordedBPM && (
              <span className="text-green-600 dark:text-green-400">
                Rate: {(recordedBPM / sampleBPM).toFixed(2)}x
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex space-x-2">
        <motion.button
          onClick={isPlaying ? handleStop : handleSyncPlay}
          disabled={!recordedAudioBuffer || !sampleBuffer || isLoading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isPlaying
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } ${(!recordedAudioBuffer || !sampleBuffer || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isPlaying ? (
            <>
              <Square className="w-4 h-4" />
              <span>Stop Sync</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Sync Play</span>
            </>
          )}
        </motion.button>

        <motion.button
          onClick={isPlaying ? handleStop : handlePlaySampleOnly}
          disabled={!sampleBuffer || isLoading}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isPlaying
              ? 'bg-gray-500 hover:bg-gray-600 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } ${(!sampleBuffer || isLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4" />
              <span>Sample Only</span>
            </>
          )}
        </motion.button>
      </div>

      {isLoading && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span>Loading sample...</span>
          </div>
        </div>
      )}
    </div>
  )
}
