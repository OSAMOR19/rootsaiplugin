"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Play, Pause, TrendingUp } from "lucide-react"
import { useSamples } from "@/hooks/useSamples"
import { useAudio } from "@/contexts/AudioContext"

import SampleActionsMenu from "./SampleActionsMenu"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

const sampleImages = [
  "/images/afro.jpeg",
  "/images/afrobeat1.png",
  "/images/afrobeat2.jpg",
  "/images/afrobeats4.jpg",
  "/images/albumimage2.jpg",
]

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const { samples, loading } = useSamples({ autoFetch: true })
  const { playTrack, currentTrack, isPlaying, pauseTrack } = useAudio()
  const inputRef = useRef<HTMLInputElement>(null)

  // Filter samples based on search query
  const searchResults = query.trim() === ""
    ? []
    : samples.filter(sample =>
      sample.name.toLowerCase().includes(query.toLowerCase()) ||
      sample.category?.toLowerCase().includes(query.toLowerCase()) ||
      sample.key?.toLowerCase().includes(query.toLowerCase()) ||
      sample.moodTag?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 20) // Limit to 20 results

  // Get trending/popular samples (samples with highest BPM or recent uploads)
  const trendingSamples = samples
    .filter(s => s.uploadedAt)
    .sort((a, b) => new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime())
    .slice(0, 5)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  const handleSampleClick = (sample: any) => {
    // Navigate to pack page for this sample's category
    if (sample.category) {
      onClose() // Close modal first
      router.push(`/pack/${encodeURIComponent(sample.category)}`)
    }
  }

  const handlePlayClick = (sample: any, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent navigation when clicking play button
    if (currentTrack?.id === sample.id && isPlaying) {
      pauseTrack()
    } else {
      const imageUrl = sample.imageUrl && sample.imageUrl !== '/placeholder.jpg'
        ? sample.imageUrl
        : sampleImages[0]

      playTrack({
        id: sample.id,
        title: sample.name,
        artist: sample.category || 'Unknown',
        audioUrl: sample.audioUrl || sample.url,
        imageUrl,
        duration: sample.duration || '0:00'
      })
    }
  }

  const getSampleImage = (sample: any, index: number) => {
    if (sample.imageUrl && sample.imageUrl !== '/placeholder.jpg') {
      return sample.imageUrl
    }
    return sampleImages[index % sampleImages.length]
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="pointer-events-auto w-full max-w-3xl bg-gradient-to-b from-gray-50 dark:from-gray-900 to-white dark:to-black border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Search Header */}
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-4">
                  <Search className="w-6 h-6 text-gray-400 dark:text-white/40" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for samples, categories, moods, keys..."
                    className="flex-1 bg-transparent text-gray-900 dark:text-white text-lg placeholder-gray-400 dark:placeholder-white/40 outline-none"
                  />
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-white/60" />
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="overflow-y-auto max-h-[calc(80vh-100px)] p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-white/40">Loading samples...</p>
                  </div>
                ) : query.trim() === "" ? (
                  // Show trending when no search
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-green-500 dark:text-green-400" />
                      <h3 className="text-gray-900 dark:text-white font-semibold">Trending Samples</h3>
                    </div>

                    {trendingSamples.length === 0 ? (
                      <p className="text-gray-500 dark:text-white/40 text-center py-8">
                        No samples available. Upload some to get started!
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {trendingSamples.map((sample, index) => {
                          const isCurrent = currentTrack?.id === sample.id
                          const isCurrentPlaying = isCurrent && isPlaying

                          return (
                            <div
                              key={sample.id}
                              className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors group cursor-pointer"
                              onClick={() => handleSampleClick(sample)}
                            >
                              {/* Image */}
                              <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={getSampleImage(sample, index)}
                                  alt={sample.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.src = sampleImages[index % sampleImages.length]
                                  }}
                                />
                                <div
                                  className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity cursor-pointer ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                    }`}
                                  onClick={(e) => handlePlayClick(sample, e)}
                                >
                                  {isCurrentPlaying ? (
                                    <Pause className="w-4 h-4 text-white" />
                                  ) : (
                                    <Play className="w-4 h-4 text-white ml-0.5" />
                                  )}
                                </div>
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium truncate ${isCurrentPlaying ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                  {sample.name}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-white/60 truncate">
                                  {sample.category} • {sample.bpm} BPM
                                </p>
                              </div>

                              {/* Tags */}
                              <div className="flex items-center gap-2">
                                {sample.key && (
                                  <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-xs text-gray-600 dark:text-white/60">
                                    {sample.key}
                                  </span>
                                )}
                                {sample.moodTag && (
                                  <span className="px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded text-xs">
                                    {sample.moodTag}
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : searchResults.length === 0 ? (
                  // No results
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-white/60 mb-2">No samples found for "{query}"</p>
                    <p className="text-gray-500 dark:text-white/40 text-sm">Try searching for categories, keys, or moods</p>
                  </div>
                ) : (
                  // Search results
                  <div>
                    <p className="text-gray-600 dark:text-white/60 mb-4 text-sm">
                      Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </p>

                    <div className="space-y-2">
                      {searchResults.map((sample, index) => {
                        const isCurrent = currentTrack?.id === sample.id
                        const isCurrentPlaying = isCurrent && isPlaying

                        return (
                          <div
                            key={sample.id}
                            className="flex items-center gap-4 p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors group cursor-pointer"
                            onClick={() => handleSampleClick(sample)}
                          >
                            {/* Image */}
                            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getSampleImage(sample, index)}
                                alt={sample.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = sampleImages[index % sampleImages.length]
                                }}
                              />
                              <div
                                className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity cursor-pointer ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  }`}
                                onClick={(e) => handlePlayClick(sample, e)}
                              >
                                {isCurrentPlaying ? (
                                  <Pause className="w-4 h-4 text-white" />
                                ) : (
                                  <Play className="w-4 h-4 text-white ml-0.5" />
                                )}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className={`font-medium truncate ${isCurrentPlaying ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                {sample.name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-white/60 truncate">
                                {sample.category} • {sample.bpm} BPM
                              </p>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-2 mr-2">
                              {sample.key && (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-white/5 rounded text-xs text-gray-600 dark:text-white/60 hidden sm:inline-block">
                                  {sample.key}
                                </span>
                              )}
                              {sample.moodTag && (
                                <span className="px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded text-xs hidden sm:inline-block">
                                  {sample.moodTag}
                                </span>
                              )}
                            </div>

                            {/* Stems Menu */}
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <SampleActionsMenu
                                sample={sample}
                                iconColor="text-gray-400 dark:text-white/40"
                                buttonClass="p-1.5 rounded-full text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}


