"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Volume2, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import DraggableSample from "@/components/DraggableSample"
import DragDropZone from "@/components/DragDropZone"
import { mockSamples } from "@/lib/mockData"

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("query") || ""
  const sessionKey = searchParams.get("key") || "F MAJOR"

  const [samples, setSamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [volume, setVolume] = useState(75)
  const [searchFilter, setSearchFilter] = useState("")

  const categories = ["All", "Kick & Snare", "Talking Drum", "Djembe", "Conga & Bongo", "Shekere & Cowbell", "Hi-Hat", "Bata", "Tom Fills", "Kpanlogo", "Clave", "Polyrhythms"]

  useEffect(() => {
    const timer = setTimeout(() => {
      setSamples(mockSamples)
      setLoading(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [query])

  const handlePlayPause = (sampleId: string) => {
    setCurrentlyPlaying(currentlyPlaying === sampleId ? null : sampleId)
  }

  const handleBack = () => {
    router.push("/")
  }

  const filteredSamples = samples.filter((sample) => {
    // First filter by search query
    const matchesSearch = 
      sample.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sample.artist.toLowerCase().includes(searchFilter.toLowerCase())
    
    // Then filter by selected category
    if (selectedCategory === "all") {
      return matchesSearch
    }
    
    // Check if sample category matches selected category
    const matchesCategory = sample.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <p className="text-lg text-green-600 dark:text-green-400 font-medium">Analyzing your track...</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Finding perfect Afrobeat drum loops</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* VST-Style Header */}
      <motion.header
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                {query || "Audio Analysis"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredSamples.length} Afrobeat drum loops found • Drag to your DAW
                {currentlyPlaying && (
                  <span className="ml-2 inline-flex items-center text-green-600 dark:text-green-400">
                    <motion.div
                      className="w-2 h-2 bg-green-500 rounded-full mr-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    />
                    Playing
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter samples..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-48 text-sm"
              />
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
              <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number.parseInt(e.target.value))}
                className="w-20 h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 w-8">{volume}</span>
            </div>

            {/* Session Info */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-600 dark:text-gray-400">SESSION KEY</div>
              <div className="font-semibold text-green-600 dark:text-green-400">{sessionKey}</div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pb-4">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 overflow-x-auto">
            {categories.map((category) => {
              const categoryKey = category.toLowerCase()
              const sampleCount = samples.filter(sample => 
                categoryKey === "all" ? true : sample.category === categoryKey
              ).length
              
              return (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(categoryKey)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
                    selectedCategory === categoryKey
                      ? "bg-green-500 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-1">
                    <span>{category}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      selectedCategory === categoryKey
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                    }`}>
                      {sampleCount}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>
      </motion.header>

      {/* Sample List - Row Layout */}
      <div className="p-6">
        <div className="space-y-3">
          {filteredSamples.map((sample, index) => (
            <DraggableSample
              key={sample.id}
              sample={sample}
              isPlaying={currentlyPlaying === sample.id}
              onPlayPause={() => handlePlayPause(sample.id)}
              index={index}
            />
          ))}
        </div>

        {filteredSamples.length === 0 && !loading && (
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Search className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No samples found</h3>
            <p className="text-gray-500 dark:text-gray-500">Try adjusting your search or category filter</p>
          </motion.div>
        )}
      </div>

      {/* Drag Drop Instructions */}
      <DragDropZone />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full mx-auto mb-4 animate-spin" />
            <p className="text-lg text-green-600 dark:text-green-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
