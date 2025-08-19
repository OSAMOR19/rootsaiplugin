"use client"

import { motion } from "framer-motion"
import { Play, Pause, Heart, Download } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

// Import drum images
import kickDrumImage from "./images/kickdrum.jpg"
import talkingDrumImage from "./images/talkingdrum.jpg"
import tomImage from "./images/tomimage.jpg"
import shekereImage from "./images/shekere.jpg"
import hihatImage from "./images/hihat.png"

interface SampleGridProps {
  viewMode: "grid" | "list"
  samples: any[]
  currentlyPlaying: string | null
  onSamplePlay: (id: string) => void
}

export default function SampleGrid({ viewMode, samples, currentlyPlaying, onSamplePlay }: SampleGridProps) {
  const router = useRouter()
  const [likedSamples, setLikedSamples] = useState<Set<string>>(new Set())
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({})

  // Handle audio playback
  const handlePlayPause = async (sampleId: string, audioUrl?: string) => {
    const audioElement = audioRefs.current[sampleId]
    
    if (!audioElement && audioUrl) {
      // Create new audio element if it doesn't exist
      const newAudio = new Audio(audioUrl)
      newAudio.loop = true
      audioRefs.current[sampleId] = newAudio
      
      try {
        await newAudio.play()
        onSamplePlay(sampleId)
        console.log('Playing audio:', sampleId, audioUrl)
      } catch (error) {
        console.error('Error playing audio:', error)
      }
      return
    }
    
    if (!audioElement) {
      console.error('Audio element not found for:', sampleId)
      return
    }

    try {
      if (currentlyPlaying === sampleId) {
        // Pause current sample
        audioElement.pause()
        onSamplePlay('') // Clear currently playing
        console.log('Paused audio:', sampleId)
      } else {
        // Stop any currently playing audio
        Object.values(audioRefs.current).forEach(audio => {
          if (audio && audio !== audioElement) {
            audio.pause()
            audio.currentTime = 0
          }
        })
        
        // Play the selected sample
        await audioElement.play()
        onSamplePlay(sampleId)
        console.log('Playing audio:', sampleId, audioElement.src)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }

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

  const toggleLike = (sampleId: string) => {
    const newLiked = new Set(likedSamples)
    if (newLiked.has(sampleId)) {
      newLiked.delete(sampleId)
    } else {
      newLiked.add(sampleId)
    }
    setLikedSamples(newLiked)
  }

  const handleSampleClick = (sampleId: string) => {
    router.push(`/sample/${sampleId}`)
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {samples.map((sample, index) => (
          <motion.div
            key={sample.id}
            className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02, y: -4 }}
            onClick={() => handleSampleClick(sample.id)}
          >
            {/* Drum Image Header with Integrated Waveform */}
            <div className="h-32 bg-gradient-to-br from-green-400 to-green-600 relative overflow-hidden">
              <Image
                src={getDrumImage(sample.category)}
                alt={sample.category || "Drum"}
                fill
                className="object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/20" />
              
              {/* Compact Waveform Overlay */}
              <div className="absolute bottom-2 left-2 right-2 h-6 bg-black/40 backdrop-blur-sm rounded-lg">
                <div className="flex items-end justify-center p-1 h-full">
                  <div className="flex items-end space-x-0.5 h-4 w-full">
                    {sample.waveform.slice(0, 16).map((height: number, i: number) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-white/70 rounded-full relative"
                        style={{ height: `${height * 0.4}%` }}
                        animate={
                          currentlyPlaying === sample.id
                            ? {
                                scaleY: [1, 1.4, 1],
                                opacity: [0.7, 1, 0.7],
                                backgroundColor: ["#10b981", "#ffffff", "#10b981"],
                              }
                            : {}
                        }
                        transition={{
                          duration: 0.6,
                          repeat: currentlyPlaying === sample.id ? Number.POSITIVE_INFINITY : 0,
                          delay: i * 0.03,
                        }}
                      >
                        {/* Progress overlay for played portion */}
                        {currentlyPlaying === sample.id && (
                          <motion.div
                            className="absolute bottom-0 left-0 w-full bg-green-400 rounded-full"
                            initial={{ height: "0%" }}
                            animate={{ height: `${height * 0.4}%` }}
                            transition={{
                              duration: 8,
                              ease: "linear",
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Progress bar overlay */}
                {currentlyPlaying === sample.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-green-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 8,
                      ease: "linear",
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                )}
              </div>

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlayPause(sample.id, sample.audioUrl)
                  }}
                  className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {currentlyPlaying === sample.id ? (
                    <Pause className="w-5 h-5 text-gray-800" />
                  ) : (
                    <Play className="w-5 h-5 text-gray-800 ml-0.5" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-800 truncate mb-1">{sample.name}</h3>
              <p className="text-sm text-gray-600 truncate mb-3">{sample.artist}</p>

              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span className="capitalize">{sample.category?.replace(' & ', '&') || 'Drums'}</span>
                <span>{sample.bpm} BPM</span>
                <span>{sample.duration}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLike(sample.id)
                    }}
                    className={`p-1.5 rounded-full transition-colors ${
                      likedSamples.has(sample.id)
                        ? "text-red-500 bg-red-50"
                        : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Heart className={`w-4 h-4 ${likedSamples.has(sample.id) ? "fill-current" : ""}`} />
                  </motion.button>
                </div>

                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle download
                  }}
                  className="p-1.5 rounded-full text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Download className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-3">
      {samples.map((sample, index) => (
        <motion.div
          key={sample.id}
          className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group cursor-pointer"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.01, y: -1 }}
          onClick={() => handleSampleClick(sample.id)}
        >
          <div className="flex items-center p-4 space-x-4">
            {/* Drum Image with Integrated Waveform */}
            <div className="flex-shrink-0 w-20 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg relative overflow-hidden border border-gray-200">
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
                        className="w-0.5 bg-white/70 rounded-full relative"
                        style={{ height: `${height * 0.3}%` }}
                        animate={
                          currentlyPlaying === sample.id
                            ? {
                                scaleY: [1, 1.4, 1],
                                opacity: [0.7, 1, 0.7],
                                backgroundColor: ["#10b981", "#ffffff", "#10b981"],
                              }
                            : {}
                        }
                        transition={{
                          duration: 0.6,
                          repeat: currentlyPlaying === sample.id ? Number.POSITIVE_INFINITY : 0,
                          delay: i * 0.05,
                        }}
                      >
                        {/* Progress overlay for played portion */}
                        {currentlyPlaying === sample.id && (
                          <motion.div
                            className="absolute bottom-0 left-0 w-full bg-green-400 rounded-full"
                            initial={{ height: "0%" }}
                            animate={{ height: `${height * 0.3}%` }}
                            transition={{
                              duration: 8,
                              ease: "linear",
                              repeat: Number.POSITIVE_INFINITY,
                            }}
                          />
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Progress bar overlay */}
                {currentlyPlaying === sample.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-green-400"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{
                      duration: 8,
                      ease: "linear",
                      repeat: Number.POSITIVE_INFINITY,
                    }}
                  />
                )}
              </div>
            </div>

            {/* Sample Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate text-sm mb-1">{sample.name}</h3>
              <p className="text-xs text-gray-600 truncate mb-2">{sample.artist}</p>

              {/* Tags */}
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                  Afrobeat
                </span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                  Drums
                </span>
              </div>
            </div>

            {/* Parameters */}
            <div className="flex-shrink-0 grid grid-cols-3 gap-3 text-xs">
              <div className="bg-gray-100 rounded px-3 py-2 text-center border border-gray-200 min-w-[50px]">
                <div className="text-gray-600 text-xs">TYPE</div>
                <div className="text-green-600 font-mono font-semibold text-[10px] capitalize">{sample.category?.replace(' & ', '&') || 'Drums'}</div>
              </div>
              <div className="bg-gray-100 rounded px-3 py-2 text-center border border-gray-200 min-w-[50px]">
                <div className="text-gray-600 text-xs">BPM</div>
                <div className="text-green-600 font-mono font-semibold">{sample.bpm}</div>
              </div>
              <div className="bg-gray-100 rounded px-3 py-2 text-center border border-gray-200 min-w-[50px]">
                <div className="text-gray-600 text-xs">TIME</div>
                <div className="text-green-600 font-mono font-semibold">{sample.duration}</div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-shrink-0 flex items-center space-x-2">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayPause(sample.id, sample.audioUrl)
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  currentlyPlaying === sample.id
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {currentlyPlaying === sample.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </motion.button>

              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLike(sample.id)
                }}
                className={`p-2 rounded-full transition-colors ${
                  likedSamples.has(sample.id)
                    ? "text-red-500 bg-red-50"
                    : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart className={`w-4 h-4 ${likedSamples.has(sample.id) ? "fill-current" : ""}`} />
              </motion.button>

              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle download
                }}
                className="p-2 rounded-full text-gray-400 hover:text-green-500 hover:bg-green-50 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Download className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Drag Instruction */}
            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                Drag to DAW
              </div>
            </div>
          </div>

          {/* Active playing indicator */}
          {currentlyPlaying === sample.id && (
            <motion.div
              className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </motion.div>
      ))}
    </div>
  )
}
