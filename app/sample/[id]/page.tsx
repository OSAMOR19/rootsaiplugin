"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Play, Pause, Heart, Download, Share, MoreHorizontal } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import WaveformVisualizer from "@/components/WaveformVisualizer"
import RelatedSamples from "@/components/RelatedSamples"
import { mockFeaturedSamples } from "@/lib/mockData"

export default function SampleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [sample, setSample] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    // Find sample by ID
    const foundSample = mockFeaturedSamples.find((s) => s.id === params.id)
    setSample(foundSample)
  }, [params.id])

  const handleBack = () => {
    router.back()
  }

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying)
  }

  if (!sample) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-lg text-gray-600">Loading sample...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{sample.name}</h1>
              <p className="text-sm text-gray-600">{sample.artist}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setIsLiked(!isLiked)}
              className={`p-2 rounded-lg transition-colors ${
                isLiked ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            </motion.button>
            <motion.button
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Share className="w-5 h-5" />
            </motion.button>
            <motion.button
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <MoreHorizontal className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Waveform Player */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={handlePlayPause}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isPlaying
                        ? "bg-green-500 text-white shadow-lg scale-110"
                        : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600"
                    }`}
                    whileHover={{ scale: isPlaying ? 1.15 : 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
                  </motion.button>
                  <div>
                    <h2 className="text-lg font-semibold">{sample.name}</h2>
                    <p className="text-sm text-gray-600">
                      {sample.duration} • {sample.key} • {sample.bpm} BPM
                    </p>
                  </div>
                </div>
                <motion.button
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download className="w-4 h-4 mr-2 inline" />
                  Download
                </motion.button>
              </div>

              <WaveformVisualizer
                waveform={sample.waveform}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={sample.duration}
              />
            </motion.div>

            {/* Sample Info */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3 className="text-lg font-semibold mb-4">Sample Information</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Key</p>
                  <p className="font-semibold">{sample.key}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">BPM</p>
                  <p className="font-semibold">{sample.bpm}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold">{sample.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Genre</p>
                  <p className="font-semibold">{sample.genre}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                  Generate Similar Samples
                </button>
                <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  Create Sample Pack
                </button>
                <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                  Add to Project
                </button>
              </div>
            </motion.div>

            {/* Related Samples */}
            <RelatedSamples currentSample={sample} />
          </div>
        </div>
      </div>
    </div>
  )
}
