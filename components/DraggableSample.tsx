"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Play, Pause, Heart, MoreHorizontal, GripVertical, Volume2 } from "lucide-react"
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
    if (waveformRef.current && !waveSurfer) {
      const ws = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'rgb(156, 163, 175)', // gray-400
        progressColor: 'rgb(34, 197, 94)', // green-500
        cursorColor: 'transparent',
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 24,
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
          waveColor: 'rgb(75, 85, 99)', // gray-600 for dark mode
          progressColor: 'rgb(34, 197, 94)', // green-500 stays same
        })
      }

      // Load audio if URL is available
      if (audioUrl) {
        ws.load(audioUrl)
      } else {
        // Generate mock waveform for samples without real audio
        const mockAudioData = new Float32Array(sample.waveform.length)
        sample.waveform.forEach((val: number, i: number) => {
          mockAudioData[i] = (val / 100 - 0.5) * 2 // Convert to -1 to 1 range
        })
        ws.loadBlob(new Blob([mockAudioData.buffer], { type: 'audio/wav' }))
      }

      ws.on('ready', () => {
        setAudioDuration(ws.getDuration())
      })

      ws.on('audioprocess', () => {
        const progress = (ws.getCurrentTime() / ws.getDuration()) * 100
        setAudioProgress(progress)
      })

      ws.on('finish', () => {
        setAudioProgress(0)
        setHasStarted(false)
      })

      setWaveSurfer(ws)

      // Cleanup
      return () => {
        if (ws) {
          ws.destroy()
        }
      }
    }
  }, [waveformRef.current, sample.waveform, audioUrl])

  // Handle WaveSurfer play/pause 
  useEffect(() => {
    if (waveSurfer) {
      if (isPlaying && !hasStarted) {
        console.log('Playing audio with WaveSurfer:', audioUrl)
        setHasStarted(true)
        waveSurfer.play()
      } else if (!isPlaying && hasStarted) {
        console.log('Pausing audio with WaveSurfer:', audioUrl)
        waveSurfer.pause()
        setHasStarted(false)
      }
    }
  }, [isPlaying, waveSurfer, hasStarted, audioUrl])

  // Cleanup effect for WaveSurfer
  useEffect(() => {
    return () => {
      if (waveSurfer) {
        waveSurfer.destroy()
      }
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

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)

    // Create drag data for DAW integration
    const dragData = {
      type: "audio/sample",
      name: sample.name,
      artist: sample.artist,
      category: sample.category,
      bpm: sample.bpm,
      duration: sample.duration,
      url: `/samples/${sample.id}.wav`, // Mock URL
      metadata: {
        genre: "Afrobeat",
        tags: ["afrobeat", "percussion", "loop", sample.category],
        tempo: sample.bpm,
        category: sample.category,
      },
    }

    // Set drag data for different formats
    e.dataTransfer.setData("text/plain", sample.name)
    e.dataTransfer.setData("application/json", JSON.stringify(dragData))
    e.dataTransfer.setData("audio/wav", `/samples/${sample.id}.wav`)

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

  return (
    <motion.div
      className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-green-500/50 transition-all duration-300 group cursor-grab active:cursor-grabbing relative ${
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

      <div className="flex items-center p-3 space-x-3">
        {/* Drag Handle */}
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-green-500 transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Drum Image with Waveform */}
        <div className="flex-shrink-0 w-16 h-10 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg relative overflow-hidden border border-gray-200 dark:border-gray-700">
          <Image
            src={getDrumImage(sample.category)}
            alt={sample.category || "Drum"}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
          
          {/* Compact Waveform Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/30 backdrop-blur-sm">
            <div className="flex items-end justify-center px-1 h-full">
              <div className="flex items-end space-x-0.5 h-full w-full">
                {sample.waveform.slice(0, 12).map((height: number, i: number) => (
                  <div
                    key={i}
                    className={`w-0.5 rounded-full ${
                      isPlaying ? 'bg-green-400' : 'bg-white/60'
                    }`}
                    style={{ height: `${Math.max(30, height * 0.6)}%` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sample Info with Always-Visible Waveform */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate text-sm mb-0.5">
                {sample.name}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{sample.artist}</p>
            </div>
          </div>

          {/* WaveSurfer.js Waveform - Clean Transparent Design */}
          <div className="w-full mb-1">
            <div 
              ref={waveformRef}
              className="w-full h-6 cursor-pointer transition-all duration-300 wavesurfer-transparent"
              style={{
                background: 'transparent',
              }}
            >
              {/* WaveSurfer will render here with transparent background */}
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center space-x-2">
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
              Afrobeat
            </span>
            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded-full">
              Drums
            </span>
          </div>
        </div>

        {/* Parameters */}
        <div className="flex-shrink-0 grid grid-cols-3 gap-2 text-xs relative z-20">
          <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1.5 text-center border border-gray-200 dark:border-gray-600 min-w-[45px]">
            <div className="text-gray-600 dark:text-gray-400 text-xs">TYPE</div>
            <div className="text-green-600 dark:text-green-400 font-mono font-semibold text-[10px] capitalize">{sample.category?.replace(' & ', '&') || 'Drums'}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1.5 text-center border border-gray-200 dark:border-gray-600 min-w-[45px]">
            <div className="text-gray-600 dark:text-gray-400 text-xs">BPM</div>
            <div className="text-green-600 dark:text-green-400 font-mono font-semibold">{sample.bpm}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded px-2 py-1.5 text-center border border-gray-200 dark:border-gray-600 min-w-[45px]">
            <div className="text-gray-600 dark:text-gray-400 text-xs">TIME</div>
            <div className="text-green-600 dark:text-green-400 font-mono font-semibold">{sample.duration}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 flex items-center space-x-1.5 relative z-20">
          <motion.button
            onClick={onPlayPause}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? "bg-green-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </motion.button>

          <motion.button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-1.5 rounded-full transition-colors ${
              isLiked
                ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                : "text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-current" : ""}`} />
          </motion.button>

          <motion.button
            className="p-1.5 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Drag Instruction */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600">
            Drag to DAW
          </div>
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
