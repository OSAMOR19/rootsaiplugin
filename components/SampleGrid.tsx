"use client"

import { motion } from "framer-motion"
import { Play, Pause, Heart, Download } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import SampleActionsMenu from "./SampleActionsMenu"

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
        {samples.map((sample, index) => (
          <motion.div
            key={sample.id}
            className="bg-white/5 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/10 hover:border-emerald-500/50 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.03, y: -8 }}
            onClick={() => handleSampleClick(sample.id)}
          >
            {/* Premium Drum Image Header with Gradient Overlay */}
            <div className="h-44 bg-gradient-to-br from-emerald-600/20 via-teal-500/20 to-green-600/20 relative overflow-hidden">
              <Image
                src={getDrumImage(sample.category)}
                alt={sample.category || "Drum"}
                fill
                className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

              {/* Modern Waveform Overlay */}
              <div className="absolute bottom-3 left-3 right-3 h-8 bg-black/50 backdrop-blur-md rounded-xl border border-white/10">
                <div className="flex items-end justify-center px-2 h-full">
                  <div className="flex items-end space-x-0.5 h-5 w-full">
                    {sample.waveform.slice(0, 20).map((height: number, i: number) => (
                      <motion.div
                        key={i}
                        className="flex-1 bg-emerald-400/70 rounded-full relative"
                        style={{ height: `${height * 0.5}%` }}
                        animate={
                          currentlyPlaying === sample.id
                            ? {
                              scaleY: [1, 1.5, 1],
                              opacity: [0.7, 1, 0.7],
                              backgroundColor: ["#34d399", "#ffffff", "#34d399"],
                            }
                            : {}
                        }
                        transition={{
                          duration: 0.5,
                          repeat: currentlyPlaying === sample.id ? Number.POSITIVE_INFINITY : 0,
                          delay: i * 0.02,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress bar */}
                {currentlyPlaying === sample.id && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-emerald-400 rounded-full"
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

              {/* Play Button - Always visible, enhanced on hover */}
              <div className="absolute top-3 right-3 z-10">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlayPause(sample.id, sample.audioUrl)
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-300 shadow-lg ${currentlyPlaying === sample.id
                    ? "bg-emerald-500 border-emerald-400 shadow-emerald-500/50"
                    : "bg-white/10 border-white/20 hover:bg-white/20 hover:border-white/40"
                    }`}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {currentlyPlaying === sample.id ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </motion.button>
              </div>
            </div>

            {/* Glass Content Card */}
            <div className="p-5">
              <h3 className="font-bold text-white truncate mb-1.5 text-lg group-hover:text-emerald-400 transition-colors">{sample.name}</h3>
              <p className="text-sm text-white/60 truncate mb-4">{sample.artist}</p>

              {/* Stats Pills */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/10 text-white/80 text-xs rounded-full font-medium">
                  {sample.bpm} BPM
                </span>
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/10 text-white/80 text-xs rounded-full font-medium capitalize">
                  {sample.category?.replace(' & ', '&') || 'Drums'}
                </span>
                <span className="px-3 py-1.5 bg-white/10 backdrop-blur-xl border border-white/10 text-white/80 text-xs rounded-full font-medium">
                  {sample.duration}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleLike(sample.id)
                  }}
                  className={`p-2 rounded-lg transition-all duration-300 ${likedSamples.has(sample.id)
                    ? "text-rose-400 bg-rose-500/20 border border-rose-500/30"
                    : "text-white/60 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent"
                    }`}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Heart className={`w-5 h-5 ${likedSamples.has(sample.id) ? "fill-current" : ""}`} />
                </motion.button>

                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    // Handle download
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-emerald-500/30"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-4 h-4" />
                </motion.button>

                <div onClick={(e) => e.stopPropagation()}>
                  <SampleActionsMenu
                    sample={sample}
                    buttonClass="p-2 rounded-lg text-white/60 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent"
                    iconColor="text-white/60"
                  />
                </div>
              </div>
            </div>

            {/* Active Indicator */}
            {currentlyPlaying === sample.id && (
              <motion.div
                className="absolute inset-0 border-2 border-emerald-500 rounded-2xl pointer-events-none"
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

  // List view - Glassmorphism design
  return (
    <div className="space-y-4">
      {samples.map((sample, index) => (
        <motion.div
          key={sample.id}
          className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 hover:border-emerald-500/50 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300 group cursor-pointer relative"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.03 }}
          whileHover={{ scale: 1.01, x: 4 }}
          onClick={() => handleSampleClick(sample.id)}
        >
          <div className="flex items-center p-5 space-x-6">
            {/* Premium Drum Image with Waveform */}
            <div className="flex-shrink-0 w-28 h-20 bg-gradient-to-br from-emerald-600/20 via-teal-500/20 to-green-600/20 rounded-xl relative overflow-hidden border border-white/10">
              <Image
                src={getDrumImage(sample.category)}
                alt={sample.category || "Drum"}
                fill
                className="object-cover opacity-60 group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent" />

              {/* Compact Waveform */}
              <div className="absolute bottom-1 left-1 right-1 h-4 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 flex items-center px-1">
                <div className="flex items-end space-x-0.5 h-2.5 w-full">
                  {sample.waveform.slice(0, 12).map((height: number, i: number) => (
                    <motion.div
                      key={i}
                      className="flex-1 bg-emerald-400/70 rounded-full"
                      style={{ height: `${height * 0.4}%` }}
                      animate={
                        currentlyPlaying === sample.id
                          ? {
                            scaleY: [1, 1.5, 1],
                            backgroundColor: ["#34d399", "#ffffff", "#34d399"],
                          }
                          : {}
                      }
                      transition={{
                        duration: 0.5,
                        repeat: currentlyPlaying === sample.id ? Number.POSITIVE_INFINITY : 0,
                        delay: i * 0.03,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sample Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white truncate text-base mb-1 group-hover:text-emerald-400 transition-colors">{sample.name}</h3>
              <p className="text-sm text-white/60 truncate mb-3">{sample.artist}</p>

              {/* Tags */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full border border-emerald-500/30 font-medium">
                  {sample.bpm} BPM
                </span>
                <span className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-full border border-white/10 font-medium capitalize">
                  {sample.category?.replace(' & ', '&') || 'Drums'}
                </span>
                <span className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-full border border-white/10 font-medium">
                  {sample.duration}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex-shrink-0 flex items-center gap-3">
              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePlayPause(sample.id, sample.audioUrl)
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-300 shadow-lg ${currentlyPlaying === sample.id
                  ? "bg-emerald-500 border-emerald-400 text-white shadow-emerald-500/50"
                  : "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40"
                  }`}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
              >
                {currentlyPlaying === sample.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </motion.button>

              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLike(sample.id)
                }}
                className={`p-2.5 rounded-lg transition-all duration-300 ${likedSamples.has(sample.id)
                  ? "text-rose-400 bg-rose-500/20 border border-rose-500/30"
                  : "text-white/60 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent"
                  }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Heart className={`w-5 h-5 ${likedSamples.has(sample.id) ? "fill-current" : ""}`} />
              </motion.button>

              <motion.button
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle download
                }}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg shadow-emerald-500/30 flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </motion.button>

              <div onClick={(e) => e.stopPropagation()}>
                <SampleActionsMenu
                  sample={sample}
                  buttonClass="p-2.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  iconColor="text-white/60"
                />
              </div>
            </div>
          </div>

          {/* Active playing indicator */}
          {currentlyPlaying === sample.id && (
            <motion.div
              className="absolute inset-0 border-2 border-emerald-500 rounded-2xl pointer-events-none"
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
