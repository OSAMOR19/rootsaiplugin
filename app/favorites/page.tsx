"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Heart, Search, Volume2, Sun, Moon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import DraggableSample from "@/components/DraggableSample"
import { getFavorites, removeFavorite, type FavoriteSample } from "@/lib/favorites"
import { Skeleton } from "@/components/ui/skeleton"

function FavoritesContent() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [favorites, setFavorites] = useState<FavoriteSample[]>([])
  const [loading, setLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [volume, setVolume] = useState(75)
  const [searchFilter, setSearchFilter] = useState("")

  // Load favorites from localStorage
  useEffect(() => {
    const loadFavorites = () => {
      const favs = getFavorites()
      setFavorites(favs)
      setLoading(false)
    }

    loadFavorites()

    // Listen for favorites updates
    const handleFavoritesUpdate = () => {
      loadFavorites()
    }
    window.addEventListener('favoritesUpdated', handleFavoritesUpdate)

    return () => {
      window.removeEventListener('favoritesUpdated', handleFavoritesUpdate)
    }
  }, [])

  const handlePlayPause = (sampleId: string) => {
    setCurrentlyPlaying(currentlyPlaying === sampleId ? null : sampleId)
  }

  const handleBack = () => {
    router.push("/")
  }

  const filteredFavorites = favorites.filter((sample) => {
    const matchesSearch = 
      sample.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (sample.artist && sample.artist.toLowerCase().includes(searchFilter.toLowerCase()))
    return matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300">
        {/* Header Skeleton */}
        <motion.header
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 w-48 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
            </div>
          </div>
        </motion.header>

        {/* Content Skeleton */}
        <div className="p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* Header */}
      <motion.header
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
            </motion.button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent truncate">
                My Favorites
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {favorites.length} {favorites.length === 1 ? 'sound' : 'sounds'} saved
                {currentlyPlaying && (
                  <span className="inline-flex items-center text-green-600 dark:text-green-400 ml-2">
                    <motion.div
                      className="w-2 h-2 bg-green-500 rounded-full mr-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    />
                    Playing
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:gap-4">
            {/* Theme Toggle */}
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600" />
              )}
            </motion.button>
            
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search favorites..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-48 text-sm"
              />
            </div>

            {/* Volume Control - Hidden on mobile, visible on tablet+ */}
            <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
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
          </div>
        </div>
      </motion.header>

      {/* Favorites List */}
      <div className="p-3 sm:p-4 lg:p-6">
        {filteredFavorites.length === 0 && !loading ? (
          <motion.div 
            className="text-center py-12" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
          >
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
            </div>
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 mb-2">
              {searchFilter ? 'No favorites found' : 'No favorites yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-500 mb-4">
              {searchFilter 
                ? 'Try adjusting your search' 
                : 'Start adding sounds to your favorites by clicking the heart icon'}
            </p>
            {!searchFilter && (
              <motion.button
                onClick={handleBack}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Browse Sounds
              </motion.button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredFavorites.map((sample, index) => (
              <DraggableSample
                key={sample.id}
                sample={sample}
                isPlaying={currentlyPlaying === sample.id}
                onPlayPause={() => handlePlayPause(sample.id)}
                index={index}
                audioUrl={sample.audioUrl}
                recordedAudioBuffer={null}
                recordedBPM={sample.bpm || null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FavoritesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300">
          <div className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <FavoritesContent />
    </Suspense>
  )
}

