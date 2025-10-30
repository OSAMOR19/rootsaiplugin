"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Play, Pause, Heart, MoreHorizontal, GripVertical, Volume2, Download } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { syncEngine, loadAudioBuffer } from "@/lib/syncEngine"
import WaveSurfer from "wavesurfer.js"

// Import drum images
import kickDrumImage from "./images/kickdrum.jpg"
import talkingDrumImage from "./images/talkingdrum.jpg"
import tomImage from "./images/tomimage.jpg"
import shekereImage from "./images/shekere.jpg"
import hihatImage from "./images/hihat.png"

interface DraggableSampleProps {
  sample: any
  isPlaying: boolean
  onPlayPause: () => void
  index: number
  audioUrl?: string // Add audio URL prop for real audio files
  recordedAudioBuffer?: AudioBuffer | null // Add recorded audio buffer for compatibility
  recordedBPM?: number | null // Add recorded BPM for compatibility
}

export default function DraggableSample({ 
  sample, 
  isPlaying, 
  onPlayPause, 
  index, 
  audioUrl, 
  recordedAudioBuffer, 
  recordedBPM 
}: DraggableSampleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null)
  const [audioProgress, setAudioProgress] = useState(0) // Real audio progress from 0-100
  const [audioDuration, setAudioDuration] = useState(0) // Audio duration in seconds
  const [waveSurfer, setWaveSurfer] = useState<WaveSurfer | null>(null)
  const waveformRef = useRef<HTMLDivElement>(null)
  const isInitializingRef = useRef(false)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Load audio buffer when component mounts
  useEffect(() => {
    if (audioUrl) {
      console.log('Loading audio buffer for:', audioUrl)
      loadAudioBuffer(audioUrl)
        .then(buffer => {
          console.log('Successfully loaded audio buffer:', buffer)
          setAudioBuffer(buffer)
          setAudioDuration(buffer.duration) // Set the actual audio duration
        })
        .catch(error => {
          console.error('Error loading audio buffer for', audioUrl, ':', error)
          // Try alternative path
          const altUrl = audioUrl.replace('/audio/', '/public/audio/')
          console.log('Trying alternative path:', altUrl)
          loadAudioBuffer(altUrl)
            .then(buffer => {
              console.log('Successfully loaded audio buffer with alt path:', buffer)
              setAudioBuffer(buffer)
              setAudioDuration(buffer.duration) // Set the actual audio duration
            })
            .catch(altError => {
              console.error('Error loading audio buffer with alt path:', altError)
            })
        })
    }
  }, [audioUrl])
  
  // Initialize WaveSurfer
  useEffect(() => {
    // Clear any existing timeout
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current)
    }

    if (waveformRef.current && !waveSurfer && !isInitializingRef.current) {
      // Small debounce to prevent rapid re-initialization
      initTimeoutRef.current = setTimeout(() => {
        isInitializingRef.current = true
      
      try {
        if (!waveformRef.current) return
        
        const ws = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: 'rgb(156, 163, 175)', // gray-400
          progressColor: 'rgb(34, 197, 94)', // green-500
          cursorColor: 'transparent',
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 32, // Keep consistent height, CSS will handle responsive sizing
          normalize: true,
          backend: 'WebAudio',
          mediaControls: false,
          interact: true,
          hideScrollbar: true,
          fillParent: true,
          minPxPerSec: 1,
        })

        // Set dark mode colors if needed
        if (document.documentElement.classList.contains('dark')) {
          ws.setOptions({
            waveColor: 'rgb(107, 114, 128)', // gray-500 for better contrast in dark mode
            progressColor: 'rgb(34, 197, 94)', // green-500 stays same
          })
        }

        // Load audio if URL is available or if it's the recent song with recorded buffer
        if (audioUrl) {
          ws.load(audioUrl).catch((error) => {
            console.error('Error loading audio:', error)
          })
        } else if (sample.isRecentSong && recordedAudioBuffer) {
          // For the recent song, use the recorded audio buffer
          try {
            // Convert AudioBuffer to blob for WaveSurfer
            const numberOfChannels = recordedAudioBuffer.numberOfChannels
            const sampleRate = recordedAudioBuffer.sampleRate
            const length = recordedAudioBuffer.length
            
            // Create WAV file from AudioBuffer
            const buffer = new ArrayBuffer(44 + length * numberOfChannels * 2)
            const view = new DataView(buffer)
            
            // WAV header
            const writeString = (offset: number, string: string) => {
              for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i))
              }
            }
            
            writeString(0, 'RIFF')
            view.setUint32(4, 36 + length * numberOfChannels * 2, true)
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
            view.setUint32(40, length * numberOfChannels * 2, true)
            
            // Convert audio data
            let offset = 44
            for (let i = 0; i < length; i++) {
              for (let channel = 0; channel < numberOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, recordedAudioBuffer.getChannelData(channel)[i]))
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true)
                offset += 2
              }
            }
            
            const blob = new Blob([buffer], { type: 'audio/wav' })
            ws.loadBlob(blob).catch((error) => {
              console.error('Error loading recorded audio:', error)
            })
          } catch (error) {
            console.error('Error converting recorded audio buffer:', error)
            // Fallback to mock waveform
            const mockAudioData = new Float32Array(sample.waveform.length)
            sample.waveform.forEach((val: number, i: number) => {
              mockAudioData[i] = (val / 100 - 0.5) * 2
            })
            const blob = new Blob([mockAudioData.buffer], { type: 'audio/wav' })
            ws.loadBlob(blob).catch((error) => {
              console.error('Error loading mock audio:', error)
            })
          }
        } else {
          // Generate mock waveform for samples without real audio
          const mockAudioData = new Float32Array(sample.waveform.length)
          sample.waveform.forEach((val: number, i: number) => {
            mockAudioData[i] = (val / 100 - 0.5) * 2 // Convert to -1 to 1 range
          })
          
          try {
            const blob = new Blob([mockAudioData.buffer], { type: 'audio/wav' })
            ws.loadBlob(blob).catch((error) => {
              console.error('Error loading mock audio:', error)
            })
          } catch (error) {
            console.error('Error creating mock audio blob:', error)
          }
        }

        ws.on('ready', () => {
          setAudioDuration(ws.getDuration() || 8) // Default to 8 seconds if no duration
        })

        ws.on('audioprocess', () => {
          if (ws.getDuration() > 0) {
            const progress = (ws.getCurrentTime() / ws.getDuration()) * 100
            setAudioProgress(progress)
          }
        })

        ws.on('finish', () => {
          setAudioProgress(0)
          setHasStarted(false)
        })

        ws.on('error', (error) => {
          console.error('WaveSurfer error:', error)
        })

        setWaveSurfer(ws)
        isInitializingRef.current = false
        
      } catch (error) {
        console.error('Error initializing WaveSurfer:', error)
        isInitializingRef.current = false
      }
      }, 50) // 50ms debounce
    }

    // Cleanup function for this effect
    return () => {
      // Clear timeout on cleanup
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
    }
  }, [waveformRef.current, sample.waveform, audioUrl])

  // Handle WaveSurfer play/pause 
  useEffect(() => {
    if (waveSurfer && !isInitializingRef.current) {
      try {
        if (isPlaying && !hasStarted) {
          console.log('Playing audio with WaveSurfer:', audioUrl)
          setHasStarted(true)
          waveSurfer.play().catch((error) => {
            console.error('Error playing WaveSurfer:', error)
            setHasStarted(false)
          })
        } else if (!isPlaying && hasStarted) {
          console.log('Pausing audio with WaveSurfer:', audioUrl)
          waveSurfer.pause()
          setHasStarted(false)
        }
      } catch (error) {
        console.error('Error controlling WaveSurfer playback:', error)
        setHasStarted(false)
      }
    }
  }, [isPlaying, waveSurfer, hasStarted, audioUrl])

  // Component unmount cleanup
  useEffect(() => {
    const currentWaveSurfer = waveSurfer
    
    return () => {
      // Clear any pending initialization
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
      
      if (currentWaveSurfer) {
        try {
          // Try to pause first if possible
          try {
            currentWaveSurfer.pause()
          } catch (pauseError) {
            // Ignore pause errors
          }
          
          // Then destroy
          currentWaveSurfer.destroy()
        } catch (error) {
          // Ignore cleanup errors on unmount
          console.warn('WaveSurfer cleanup warning:', error)
        }
      }
      isInitializingRef.current = false
    }
  }, [waveSurfer])
  
  // Use real audio progress
  const currentProgress = audioProgress

  // Function to get the appropriate image for each drum type
  const getDrumImage = (category: string) => {
    switch (category?.toLowerCase()) {
      case "full-drums":
      case "full drum loops":
        return kickDrumImage
      case "kick-loops":
      case "kick loops":
        return kickDrumImage
      case "top-loops":
      case "top loops":
        return hihatImage
      case "shaker-loops":
      case "shaker loops":
        return shekereImage
      case "fills-rolls":
      case "fills & rolls":
        return tomImage
      case "percussions":
        return talkingDrumImage
      default:
        return kickDrumImage // Default fallback
    }
  }

  const handleDragStart = async (e: React.DragEvent) => {
    setIsDragging(true)

    // Get the real audio URL from the sample
    const realAudioUrl = sample.url || audioUrl || `/audio/${sample.filename || sample.name}`
    
    // Create drag data for DAW integration
    const dragData = {
      type: "audio/sample",
      name: sample.name || sample.filename,
      artist: sample.artist || "Roots AI",
      category: sample.category,
      bpm: sample.bpm,
      duration: sample.duration,
      url: realAudioUrl, // Real audio URL
      metadata: {
        genre: "Afrobeat",
        tags: ["afrobeat", "percussion", "loop", sample.category],
        tempo: sample.bpm,
        category: sample.category,
      },
    }

    // Set drag data for different formats
    e.dataTransfer.setData("text/plain", sample.name || sample.filename)
    e.dataTransfer.setData("application/json", JSON.stringify(dragData))
    e.dataTransfer.setData("audio/wav", realAudioUrl)
    
    // Add file data for both DAW and desktop/folder dropping
    try {
      // Fetch the actual audio file
      const response = await fetch(realAudioUrl)
      const audioBlob = await response.blob()
      
      // Create a File object for proper drag and drop
      const audioFile = new File([audioBlob], sample.name || sample.filename, {
        type: audioBlob.type || 'audio/wav'
      })
      
      // Use DataTransferItemList for file dragging
      const dataTransferItemList = e.dataTransfer.items
      dataTransferItemList.add(audioFile)
      
      // Also set as download URL for desktop dropping
      e.dataTransfer.setData("DownloadURL", `audio/wav:${sample.name || sample.filename}:${realAudioUrl}`)
      
    } catch (error) {
      console.warn('Could not fetch audio file for drag:', error)
      // Fallback to URL-based dragging
    }

    // Create custom drag image
    const dragImage = document.createElement("div")
    dragImage.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-family: system-ui;
        font-size: 14px;
        font-weight: 600;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        white-space: nowrap;
        max-width: 250px;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        🎵 ${sample.name}
      </div>
    `
    dragImage.style.position = "absolute"
    dragImage.style.top = "-1000px"
    document.body.appendChild(dragImage)

    e.dataTransfer.setDragImage(dragImage, 0, 0)

    // Clean up drag image
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)

    e.dataTransfer.effectAllowed = "copy"
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  const handleDownload = async () => {
    try {
      // Get the real audio URL
      const realAudioUrl = sample.url || audioUrl || `/audio/${sample.filename || sample.name}`
      
      // Fetch the audio file
      const response = await fetch(realAudioUrl)
      if (!response.ok) {
        throw new Error('Failed to fetch audio file')
      }
      
      const audioBlob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(audioBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = sample.name || sample.filename || 'sample.wav'
      
      // Trigger download
      document.body.appendChild(link)
      link.click()
      
      // Cleanup
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Download failed:', error)
      // Fallback: open in new tab
      const realAudioUrl = sample.url || audioUrl || `/audio/${sample.filename || sample.name}`
      window.open(realAudioUrl, '_blank')
    }
  }

  return (
    <motion.div
      className={`backdrop-blur-sm rounded-xl border overflow-hidden transition-all duration-300 group cursor-grab active:cursor-grabbing relative ${
        sample.isRecentSong 
          ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-400/50 dark:border-blue-500/50 hover:border-blue-400 dark:hover:border-blue-400" 
          : "bg-white/60 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 hover:border-green-500/50"
      } ${
        isDragging ? "opacity-50 scale-95" : ""
      }`}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.01, y: -1 }}
      draggable
      onDragStart={(e) => handleDragStart(e as any)}
      onDragEnd={handleDragEnd}
    >
      {/* Splice-style horizontal layout - Responsive */}
      <div className="flex items-center p-2 sm:p-3 lg:p-4 space-x-2 sm:space-x-3 lg:space-x-4">
        {/* Selection checkbox on the far left */}
        <div className="flex-shrink-0">
          <input
            type="checkbox"
            className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        {/* Artwork (square) - Responsive sizing */}
        <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 relative overflow-hidden border ${
          sample.isRecentSong 
            ? "bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-blue-400/50 dark:border-blue-500/50" 
            : "bg-gradient-to-br from-green-500/20 to-green-600/20 border-gray-200 dark:border-gray-700"
        }`}>
          {sample.isRecentSong ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
          ) : (
            <>
              <Image
                src={getDrumImage(sample.category)}
                alt={sample.category || "Drum"}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black/10" />
            </>
          )}
        </div>

        {/* Play button beside the artwork - Responsive sizing */}
        <div className="flex-shrink-0">
          <motion.button
            onClick={onPlayPause}
            className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
              isPlaying
                ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 hover:shadow-md"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> : <Play className="w-3 h-3 sm:w-4 sm:h-4 ml-0.5" />}
          </motion.button>
        </div>

        {/* Filename and Tags - Responsive */}
        <div className="flex-shrink-0 min-w-0 hidden sm:block" style={{ width: '150px' }}>
          <h3 className={`font-semibold truncate text-xs sm:text-sm mb-1 ${
            sample.isRecentSong 
              ? "text-blue-700 dark:text-blue-300" 
              : "text-gray-800 dark:text-gray-200"
          }`}>
            {sample.name}
          </h3>
          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
            {sample.isRecentSong ? (
              <>
                <span className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">your recording</span>
                <span className="px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs">captured</span>
              </>
            ) : (
              <>
                <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">afrobeat</span>
                <span className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">drums</span>
              </>
            )}
          </div>
        </div>

        {/* Mobile filename - shown only on mobile */}
        <div className="flex-shrink-0 min-w-0 sm:hidden">
          <h3 className={`font-semibold truncate text-xs ${
            sample.isRecentSong 
              ? "text-blue-700 dark:text-blue-300" 
              : "text-gray-800 dark:text-gray-200"
          }`}>
            {sample.name}
          </h3>
        </div>

        {/* Waveform visualization stretched horizontally to occupy most of the row width - Responsive */}
        <div className="flex-1 min-w-0 mx-2 sm:mx-3 lg:mx-4">
          <div 
            ref={waveformRef}
            className="w-full h-6 sm:h-7 lg:h-8 rounded-lg overflow-hidden cursor-pointer transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            style={{
              background: 'transparent',
            }}
          >
            {/* WaveSurfer will render here */}
          </div>
        </div>

        {/* Time duration displayed to the right of the waveform - Hidden on mobile */}
        <div className="flex-shrink-0 text-right hidden sm:block">
          <div className="text-xs sm:text-sm font-mono text-gray-600 dark:text-gray-400">
            {audioDuration > 0 ? `${Math.round(audioDuration)}s` : sample.duration}
          </div>
        </div>

        {/* BPM value placed next to the time - Responsive sizing */}
        <div className="flex-shrink-0">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-center border border-gray-200 dark:border-gray-600 min-w-[50px] sm:min-w-[60px]">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">BPM</div>
            <div className="text-xs sm:text-sm font-mono font-semibold text-green-600 dark:text-green-400">{sample.bpm}</div>
          </div>
        </div>

        {/* Action Icons - Heart, Checkmark, Three Dots - Responsive sizing */}
        <div className="flex-shrink-0 flex items-center space-x-1 sm:space-x-2">
          {/* Heart (Favorite) */}
          <motion.button
            onClick={() => setIsLiked(!isLiked)}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              isLiked
                ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                : "text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${isLiked ? "fill-current" : ""}`} />
          </motion.button>

          {/* Checkmark (Download/Select) - Hidden on mobile */}
          <motion.button
            onClick={handleDownload}
            className="hidden sm:flex w-7 h-7 sm:w-8 sm:h-8 rounded-full text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Download audio file"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </motion.button>

          {/* Three Dots (More Options) */}
          <motion.button
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MoreHorizontal className="w-3 h-3 sm:w-4 sm:h-4" />
          </motion.button>
        </div>
      </div>

      {/* Active playing indicator */}
      {isPlaying && (
        <motion.div
          className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      )}

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-green-500/20 border-2 border-green-500 border-dashed rounded-xl pointer-events-none" />
      )}
    </motion.div>
  )
}
