"use client"

import { motion } from "framer-motion"
import { Play, Pause, MoreHorizontal } from "lucide-react"
import { useState } from "react"

interface Sample {
  id: string
  name: string
  artist: string
  category?: string
  bpm: number
  duration: string
  waveform: number[]
}

interface SampleCardProps {
  sample: Sample
  isPlaying: boolean
  onPlayPause: () => void
}

export default function SampleCard({ sample, isPlaying, onPlayPause }: SampleCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
      whileHover={{ scale: 1.02, y: -2 }}
      layout
    >
      <div className="flex items-center space-x-4">
        {/* Waveform Visualization */}
        <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="flex items-end space-x-1 h-8">
            {sample.waveform.map((height, index) => (
              <motion.div
                key={index}
                className="w-1 bg-white/80 rounded-full"
                style={{ height: `${height}%` }}
                animate={
                  isPlaying
                    ? {
                        scaleY: [1, 1.5, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 0.5,
                  repeat: isPlaying ? Number.POSITIVE_INFINITY : 0,
                  delay: index * 0.1,
                }}
              />
            ))}
          </div>
        </div>

        {/* Sample Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 truncate">{sample.name}</h3>
          <p className="text-sm text-gray-600 truncate">{sample.artist}</p>
          <div className="flex items-center space-x-4 mt-1">
            <span className="text-xs text-gray-500 capitalize">{sample.category?.replace(' & ', '&') || 'Drums'}</span>
            <span className="text-xs text-gray-500">{sample.bpm} BPM</span>
            <span className="text-xs text-gray-500">{sample.duration}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={onPlayPause}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isPlaying
                ? "bg-green-500 text-white shadow-lg"
                : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </motion.button>

          <div className="relative">
            <motion.button
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </motion.button>

            {/* Dropdown Menu */}
            {showMenu && (
              <motion.div
                className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-10 min-w-[150px]"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Show Similar
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Generate Kit
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  Drag to DAW
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Drag indicator */}
      <motion.div
        className="absolute inset-0 border-2 border-green-400 rounded-xl opacity-0 pointer-events-none"
        animate={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}
