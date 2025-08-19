"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

interface WaveformVisualizerProps {
  waveform: number[]
  isPlaying: boolean
  currentTime: number
  duration: string
}

export default function WaveformVisualizer({ waveform, isPlaying, currentTime, duration }: WaveformVisualizerProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5))
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isPlaying])

  return (
    <div className="relative">
      {/* Waveform */}
      <div className="flex items-end justify-center space-x-1 h-32 bg-gray-50 rounded-lg p-4 overflow-hidden">
        {waveform.map((height, index) => {
          const isActive = (index / waveform.length) * 100 <= progress
          return (
            <motion.div
              key={index}
              className={`w-1 rounded-full transition-all duration-200 ${isActive ? "bg-green-500" : "bg-gray-300"}`}
              style={{ height: `${height}%` }}
              animate={
                isPlaying && isActive
                  ? {
                      scaleY: [1, 1.2, 1],
                    }
                  : {}
              }
              transition={{
                duration: 0.3,
                repeat: isPlaying && isActive ? Number.POSITIVE_INFINITY : 0,
              }}
            />
          )
        })}
      </div>

      {/* Progress indicator */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500/20 to-transparent"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>

      {/* Time indicators */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>0:00</span>
        <span>{duration}</span>
      </div>
    </div>
  )
}
