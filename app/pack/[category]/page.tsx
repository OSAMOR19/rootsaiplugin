"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, Heart, Plus, Download, Search, ArrowLeft, MoreVertical } from "lucide-react"
import { motion } from "framer-motion"
import { useSamples } from "@/hooks/useSamples"
import { useAudio } from "@/contexts/AudioContext"

const sampleImages = [
  "/images/afro.jpeg",
  "/images/afrobeat1.png",
  "/images/afrobeat2.jpg",
  "/images/afrobeats4.jpg",
  "/images/albumimage2.jpg",
]

interface PageProps {
  params: Promise<{ category: string }>
}

export default function PackDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const categoryName = decodeURIComponent(resolvedParams.category)
  
  const { samples, loading } = useSamples({ autoFetch: true })
  const { playTrack, currentTrack, isPlaying, pauseTrack } = useAudio()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBPM, setSelectedBPM] = useState<string>("all")
  const [selectedKey, setSelectedKey] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popular")

  // Filter samples by category
  const categorySamples = samples.filter(s => s.category === categoryName)
  
  // Apply search filter
  const filteredSamples = categorySamples.filter(sample => 
    sample.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get unique BPMs and Keys for filters
  const uniqueBPMs = [...new Set(categorySamples.map(s => s.bpm).filter(Boolean))].sort((a, b) => a! - b!)
  const uniqueKeys = [...new Set(categorySamples.map(s => s.key).filter(Boolean))].sort()

  // Pack image (use first sample's image or default fallback)
  const packImage = categorySamples[0]?.imageUrl && categorySamples[0]?.imageUrl !== '/placeholder.jpg' 
    ? categorySamples[0].imageUrl 
    : sampleImages[Math.floor(Math.random() * sampleImages.length)]
  
  // Helper to get sample image with fallback
  const getSampleImage = (sample: any, index: number) => {
    if (sample.imageUrl && sample.imageUrl !== '/placeholder.jpg') {
      return sample.imageUrl
    }
    return sampleImages[index % sampleImages.length]
  }

  const handlePlayClick = (sample: any) => {
    if (currentTrack?.id === sample.id && isPlaying) {
      pauseTrack()
    } else {
      playTrack({
        id: sample.id,
        title: sample.name,
        artist: sample.category,
        audioUrl: sample.audioUrl || sample.url,
        imageUrl: getSampleImage(sample, 0),
        duration: sample.duration || '0:00'
      })
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Pack Info Header */}
        <div className="flex items-start gap-6 mb-8">
          {/* Pack Image */}
          <div className="w-64 h-64 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-gradient-to-br from-green-900/50 to-emerald-950/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={packImage}
              alt={categoryName}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = sampleImages[0]
              }}
            />
          </div>

          {/* Pack Details */}
          <div className="flex-1">
            <p className="text-sm text-green-400 mb-2">Roots AI Sample Pack</p>
            <h1 className="text-5xl font-bold mb-4">{categoryName}</h1>
            <p className="text-white/60 mb-6">
              {categoryName} • {categorySamples.length} Samples
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              <button className="px-6 py-3 bg-green-500 hover:bg-green-600 rounded-full font-semibold flex items-center gap-2 transition-colors">
                <Plus className="w-5 h-5" />
                Get Pack
              </button>
              <button
                onClick={() => filteredSamples.length > 0 && handlePlayClick(filteredSamples[0])}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-full font-semibold flex items-center gap-2 transition-colors"
              >
                <Play className="w-5 h-5" />
                Preview
              </button>
              <button className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Heart className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-8 max-w-4xl">
          <p className="text-white/60 leading-relaxed">
            Dive into the vibrant world of {categoryName} with this meticulously
            curated pack for enthusiasts and producers alike. This dynamic collection
            features {categorySamples.length} carefully selected samples.
          </p>
        </div>

        {/* Samples Section */}
        <div>
          <h2 className="text-3xl font-bold mb-6">Samples</h2>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
            <button className="px-4 py-2 bg-white/10 rounded-full text-sm font-medium whitespace-nowrap">
              Your Library
            </button>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium whitespace-nowrap transition-colors">
              Rare Finds
            </button>
            
            {/* BPM Filter */}
            <select
              value={selectedBPM}
              onChange={(e) => setSelectedBPM(e.target.value)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium whitespace-nowrap transition-colors border-none outline-none cursor-pointer"
            >
              <option value="all">BPM</option>
              {uniqueBPMs.map(bpm => (
                <option key={bpm} value={bpm}>{bpm}</option>
              ))}
            </select>

            {/* Key Filter */}
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium whitespace-nowrap transition-colors border-none outline-none cursor-pointer"
            >
              <option value="all">Key</option>
              {uniqueKeys.map(key => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>

          {/* Search and Sort */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/60">{filteredSamples.length} results</p>
            
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search samples..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none focus:border-green-500/50 transition-colors"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm outline-none cursor-pointer"
              >
                <option value="popular">Most popular</option>
                <option value="recent">Most recent</option>
                <option value="name">Name</option>
                <option value="bpm">BPM</option>
              </select>
            </div>
          </div>

          {/* Samples Table */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/40">Loading samples...</p>
            </div>
          ) : filteredSamples.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40">No samples found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs text-white/40 font-medium border-b border-white/5">
                <div className="col-span-1"></div>
                <div className="col-span-5">Filename</div>
                <div className="col-span-2 text-center">Time</div>
                <div className="col-span-1 text-center">Key</div>
                <div className="col-span-2 text-center">BPM</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Rows */}
              {filteredSamples.map((sample, index) => {
                const isCurrent = currentTrack?.id === sample.id
                const isCurrentPlaying = isCurrent && isPlaying

                return (
                  <motion.div
                    key={sample.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer ${
                      isCurrent ? 'bg-white/10' : ''
                    }`}
                    onClick={() => handlePlayClick(sample)}
                  >
                    {/* Pack Image + Play Button */}
                    <div className="col-span-1 flex items-center">
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={getSampleImage(sample, index)}
                          alt={sample.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement
                            target.src = sampleImages[index % sampleImages.length]
                          }}
                        />
                        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${
                          isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {isCurrentPlaying ? (
                            <Pause className="w-4 h-4 text-white" />
                          ) : (
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Filename */}
                    <div className="col-span-5 flex flex-col justify-center">
                      <p className={`text-sm font-medium truncate ${isCurrentPlaying ? 'text-green-400' : 'text-white'}`}>
                        {sample.name}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        {sample.moodTag ? `${sample.moodTag} • ` : ''}{sample.category}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="col-span-2 flex items-center justify-center">
                      <p className="text-sm text-white/60">{sample.duration || '0:16'}</p>
                    </div>

                    {/* Key */}
                    <div className="col-span-1 flex items-center justify-center">
                      <p className="text-sm text-white/60">{sample.key || '--'}</p>
                    </div>

                    {/* BPM */}
                    <div className="col-span-2 flex items-center justify-center">
                      <p className="text-sm text-white/60">{sample.bpm || '--'}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                        <Heart className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

