"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Play, Pause, Heart, MoreHorizontal, GripVertical } from "lucide-react"
import { useState, useEffect } from "react"
import Image from "next/image"
import { useAudioPlayer } from "../hooks/useAudioPlayer"

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
}

export default function DraggableSample({ sample, isPlaying, onPlayPause, index, audioUrl }: DraggableSampleProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  
  // Use the audio player hook for real audio playback
  const { audioState, play, pause, stop } = useAudioPlayer()
  
  // Sync the audio player state with the component state
  useEffect(() => {
    if (audioUrl && isPlaying && !audioState.isPlaying) {
      console.log('Attempting to play audio:', audioUrl)
      setHasStarted(true)
      play(audioUrl).catch(error => {
        console.error('Error playing audio:', error)
        alert('Error playing audio. Please check if the file exists and try again.')
      })
    } else if (!isPlaying && audioState.isPlaying) {
      pause()
    }
  }, [isPlaying, audioUrl, audioState.isPlaying, play, pause])

  // Reset hasStarted when audio ends
  useEffect(() => {
    if (audioState.duration > 0 && audioState.currentTime >= audioState.duration) {
      setHasStarted(false)
    }
  }, [audioState.duration, audioState.currentTime])
  
  // Use real audio progress if available, otherwise use mock progress
  const currentProgress = audioUrl ? audioState.progress : (isPlaying ? 50 : 0)

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
      {/* Waveform progress bar in center of card */}
      {hasStarted && (
        <motion.div
          className="absolute w-64 h-8 bg-gray-300/20 dark:bg-gray-600/20 rounded-lg overflow-hidden"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            left: '30%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10
          }}
        >
          {/* Background waveform */}
          <div className="absolute inset-0 flex items-center justify-center px-2">
            <div className="flex items-end space-x-1 h-6 w-full">
              {sample.waveform.slice(0, 40).map((height: number, i: number) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-gray-400 dark:bg-gray-500 rounded-full"
                  style={{ height: `${Math.max(2, height * 0.3)}px` }}
                  animate={
                    isPlaying
                      ? {
                          scaleY: [1, 1.2, 1],
                          opacity: [0.6, 1, 0.6],
                        }
                      : {}
                  }
                  transition={{
                    duration: 0.8,
                    repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                    delay: i * 0.02,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Progress fill with waveform */}
          <motion.div
            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-lg relative overflow-hidden"
            initial={{ width: "0%" }}
            animate={{ width: `${currentProgress}%` }}
            transition={{
              duration: audioUrl ? 0.1 : 8,
              ease: "linear",
              repeat: audioUrl ? 0 : Number.POSITIVE_INFINITY,
            }}
          >
            {/* Active waveform */}
            <div className="absolute inset-0 flex items-center justify-center px-2">
              <div className="flex items-end space-x-1 h-6 w-full">
                {sample.waveform.slice(0, 40).map((height: number, i: number) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-white rounded-full"
                    style={{ height: `${Math.max(2, height * 0.3)}px` }}
                    animate={
                      isPlaying
                        ? {
                            scaleY: [1, 1.3, 1],
                            opacity: [0.8, 1, 0.8],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.6,
                      repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                      delay: i * 0.02,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      <div className="flex items-center p-4 space-x-4">
        {/* Drag Handle */}
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-green-500 transition-colors">
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Drum Image with Waveform */}
        <div className="flex-shrink-0 w-20 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg relative overflow-hidden border border-gray-200 dark:border-gray-700">
          <Image
            src={getDrumImage(sample.category)}
            alt={sample.category || "Drum"}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
          
          {/* Compact Waveform Overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-3 bg-black/40 backdrop-blur-sm">
            <div className="flex items-end justify-center px-1 h-full">
              <div className="flex items-end space-x-0.5 h-2 w-full">
                {sample.waveform.slice(0, 12).map((height: number, i: number) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-white/70 rounded-full"
                    style={{ height: `${height * 0.3}%` }}
                    animate={
                      isPlaying
                        ? {
                            scaleY: [1, 1.4, 1],
                            opacity: [0.7, 1, 0.7],
                            backgroundColor: ["#10b981", "#ffffff", "#10b981"],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.6,
                      repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sample Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate text-sm mb-1">{sample.name}</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mb-2">{sample.artist}</p>

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
        <div className="flex-shrink-0 grid grid-cols-3 gap-3 text-xs relative z-20">
          <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-center border border-gray-200 dark:border-gray-600 min-w-[50px]">
            <div className="text-gray-600 dark:text-gray-400 text-xs">TYPE</div>
            <div className="text-green-600 dark:text-green-400 font-mono font-semibold text-[10px] capitalize">{sample.category?.replace(' & ', '&') || 'Drums'}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-center border border-gray-200 dark:border-gray-600 min-w-[50px]">
            <div className="text-gray-600 dark:text-gray-400 text-xs">BPM</div>
            <div className="text-green-600 dark:text-green-400 font-mono font-semibold">{sample.bpm}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded px-3 py-2 text-center border border-gray-200 dark:border-gray-600 min-w-[50px]">
            <div className="text-gray-600 dark:text-gray-400 text-xs">TIME</div>
            <div className="text-green-600 dark:text-green-400 font-mono font-semibold">{sample.duration}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-shrink-0 flex items-center space-x-2 relative z-20">
          <motion.button
            onClick={onPlayPause}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isPlaying
                ? "bg-green-500 text-white shadow-lg"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </motion.button>

          <motion.button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-full transition-colors ${
              isLiked
                ? "text-red-500 bg-red-50 dark:bg-red-900/20"
                : "text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
          </motion.button>

          <motion.button
            className="p-2 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MoreHorizontal className="w-4 h-4" />
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
