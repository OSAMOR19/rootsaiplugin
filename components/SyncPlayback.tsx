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
  const [recordedVolume, setRecordedVolume] = useState(0.5) // Volume for recorded audio
  const [sampleVolume, setSampleVolume] = useState(0.5) // Volume for sample audio
  const [uploadedOnlyPlaying, setUploadedOnlyPlaying] = useState(false) // For uploaded-only toggle
  const [activeSources, setActiveSources] = useState<{recorded: any, sample: any} | null>(null)

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

  // Real-time volume updates for active playback
  useEffect(() => {
    if (activeSources && activeSources.recordedGainNode && activeSources.sampleGainNode) {
      console.log('Updating volumes in real-time:', {
        recorded: recordedVolume * 0.8,
        sample: sampleVolume * 0.8
      })
      
      // Update recorded audio gain in real-time
      activeSources.recordedGainNode.gain.value = recordedVolume * 0.8
      
      // Update sample audio gain in real-time
      activeSources.sampleGainNode.gain.value = sampleVolume * 0.8
    }
  }, [recordedVolume, sampleVolume, activeSources])

  const handleSyncPlay = async () => {
    if (!recordedAudioBuffer || !sampleBuffer) return

    console.log('Starting sync playback:', {
      recordedAudioDuration: recordedAudioBuffer.duration,
      recordedAudioSampleRate: recordedAudioBuffer.sampleRate,
      recordedAudioChannels: recordedAudioBuffer.numberOfChannels,
      sampleAudioDuration: sampleBuffer.duration,
      sampleAudioSampleRate: sampleBuffer.sampleRate,
      sampleAudioChannels: sampleBuffer.numberOfChannels,
      recordedBPM,
      sampleBPM,
      playbackRate: recordedBPM ? recordedBPM / sampleBPM : 1
    })

    try {
      setIsPlaying(true)
      
      // Calculate playback rate for tempo matching
      const playbackRate = recordedBPM ? recordedBPM / sampleBPM : 1
      
      console.log('Setting volumes for sync playback:', {
        recordedVolume: recordedVolume.toFixed(2),
        sampleVolume: sampleVolume.toFixed(2)
      })
      
      // Sync play both audio sources with precise BPM matching and individual volumes
      const sources = await syncEngine.syncPlay(
        recordedAudioBuffer,
        sampleBuffer,
        sampleBPM,
        { 
          recordedBPM: recordedBPM, // Pass the accurate BPM for perfect sync
          recordedVolume: recordedVolume * 0.8, // Individual volume for recorded audio (master volume)
          sampleVolume: sampleVolume * 0.8 // Individual volume for sample audio (master volume)
        }
      )
      
      setActiveSources(sources)
      
      console.log(`Sync playing: ${sampleName} at ${playbackRate.toFixed(2)}x speed`)
    } catch (error) {
      console.error('Error in sync playback:', error)
      console.error('Detailed error:', {
        recordedAudioBufferExists: !!recordedAudioBuffer,
        sampleBufferExists: !!sampleBuffer,
        recordedBPM,
        sampleBPM
      })
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
                Sample adjusted to: {recordedBPM} BPM
              </span>
            )}
            {recordedBPM && (
              <span className="text-blue-600 dark:text-blue-400">
                Sample rate: {(recordedBPM / sampleBPM).toFixed(2)}x {(recordedBPM / sampleBPM) > 1 ? 'slower' : 'faster'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hide Volume Controls for Now - Too Much Space */}
      {false && (
      <div className="mb-4 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg backdrop-blur-sm">
        <div className="space-y-3">
          {/* Volume Controls */}
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploaded Audio
            </span>
            <div className="flex items-center space-x-2 w-40">
              <Volume2 className="w-4 h-4 text-gray-500" />
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(recordedVolume * 100)}
                  onChange={(e) => setRecordedVolume(parseInt(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider"
                  style={{
                    background: `linear-gradient(to right, #10b981 0%, #10b981 ${recordedVolume * 100}%, #e5e7eb ${recordedVolume * 100}%, #e5e7eb 100%)`,
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">
                {Math.round(recordedVolume * 100)}%
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sample Audio
            </span>
            <div className="flex items-center space-x-2 w-40">
              <Volume2 className="w-4 h-4 text-gray-500" />
              <div className="flex-1 relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(sampleVolume * 100)}
                  onChange={(e) => setSampleVolume(parseInt(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer volume-slider"
                  style={{
                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sampleVolume * 100}%, #e5e7eb ${sampleVolume * 100}%, #e5e7eb 100%)`,
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-8 text-right">
                {Math.round(sampleVolume * 100)}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Info Text */}
        <div className="mt-3 text-xs text-center text-gray-500 dark:text-gray-400">
          Adjust volumes to isolate each audio and verify sync timing
        </div>
      </div>
      )}

      {/* Micro Volume Controls */}
      <div className="mb-2 flex justify-between items-center text-xs px-2 py-1 bg-gray-50/50 dark:bg-gray-800/30 rounded">
        <div className="flex items-center space-x-2">
          <span className="text-green-600 dark:text-green-400">🎵</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(recordedVolume * 100)}
            onChange={(e) => setRecordedVolume(parseInt(e.target.value) / 100)}
            className="w-12 h-1 accent-green-500 cursor-pointer"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-blue-600 dark:text-blue-400">🔊</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(sampleVolume * 100)}
            onChange={(e) => setSampleVolume(parseInt(e.target.value) / 100)}
            className="w-12 h-1 accent-blue-500 cursor-pointer"
          />
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
              <span>Tempo Match</span>
            </>
          )}
        </motion.button>

        {/* Tempo indicator */}
        {recordedBPM && (
          <div className="flex items-center space-x-2 text-xs">
            <motion.div
              className="w-2 h-2 bg-green-500 rounded-full"
              animate={isPlaying ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 60 / recordedBPM, repeat: isPlaying ? Infinity : 0 }}
            />
            <span className="text-gray-500 dark:text-gray-400">
              {isPlaying ? `Synced at ${recordedBPM} BPM` : `Ready to sync at ${recordedBPM} BPM`}
            </span>
            <span className="text-orange-500 font-medium">
              Sample adjusted to: {(sampleBPM / recordedBPM).toFixed(2)}x speed ({(sampleBPM / recordedBPM) < 1 ? 'slower' : 'faster'})
            </span>
            {isPlaying && (
              <span className="text-green-600 font-bold">
                🎵 Perfect Sync at {recordedBPM} BPM! 🎵
              </span>
            )}
          </div>
        )}

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

        {/* Quick Solo Test Button */}
        <motion.button
          onClick={async () => {
            if (uploadedOnlyPlaying) {
              // Stop and reset
              setUploadedOnlyPlaying(false)
              setIsPlaying(false)
              await syncEngine.stopAll()
            } else {
              // Play uploaded audio only
              if (recordedAudioBuffer) {
                setIsPlaying(false)
                await syncEngine.stopAll()
                setUploadedOnlyPlaying(true)
                await syncEngine.playAudioBuffer(recordedAudioBuffer, { 
                  volume: recordedVolume,
                  recordedBPM: recordedBPM 
                })
              }
            }
          }}
          disabled={!recordedAudioBuffer || isLoading}
          className={`flex items-center space-x-1 px-2 py-1 rounded text-xs disabled:opacity-50 ${
            uploadedOnlyPlaying 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {uploadedOnlyPlaying ? (
            <>
              <Square className="w-3 h-3" />
              <span>Stop Uploaded</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3 h-3" />
              <span>Uploaded Only</span>
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
