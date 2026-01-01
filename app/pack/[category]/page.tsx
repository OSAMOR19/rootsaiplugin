"use client"

import { use, useState } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, Heart, Plus, Download, Search, ArrowLeft, MoreVertical } from "lucide-react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"
import { useSamples } from "@/hooks/useSamples"
import { usePacks } from "@/hooks/usePacks"
import { useAudio } from "@/contexts/AudioContext"
import { useFavorites } from "@/hooks/useFavorites"
import WaveformCell from "@/components/WaveformCell"

import { SAMPLE_IMAGES } from "@/constants/images"

const sampleImages = SAMPLE_IMAGES

interface PageProps {
  params: Promise<{ category: string }>
}

export default function PackDetailPage({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const categoryName = typeof resolvedParams.category === 'string' ? decodeURIComponent(resolvedParams.category) : String(resolvedParams.category)

  const { samples, loading: samplesLoading } = useSamples({ autoFetch: true })
  const { packs, loading: packsLoading, getPackByTitle } = usePacks()
  const { playTrack, currentTrack, isPlaying, pauseTrack } = useAudio()
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBPM, setSelectedBPM] = useState<string>("all")
  const [selectedKey, setSelectedKey] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("popular")

  // Find the current pack details
  const currentPack = getPackByTitle(categoryName)

  // Filter samples by category
  const categorySamples = samples.filter(s => s.category === categoryName)

  // Apply search filter
  const filteredSamples = categorySamples.filter(sample =>
    sample.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Helper to format key (handle string or object)
  const formatKey = (key: any) => {
    if (!key) return '--'
    if (typeof key === 'string') return key
    if (typeof key === 'object') {
      return `${key.tonic}${key.scale ? ' ' + key.scale : ''}`
    }
    return String(key)
  }

  // Get unique BPMs and Keys for filters
  const uniqueBPMs = [...new Set(categorySamples.map(s => s.bpm).filter(Boolean))].sort((a, b) => a! - b!)
  const uniqueKeys = [...new Set(categorySamples.map(s => formatKey(s.key)).filter(k => k !== '--'))].sort()

  const featuredSampleWithImage = categorySamples.find(s => s.featured && s.imageUrl && s.imageUrl !== '/placeholder.jpg')
  const firstSampleWithImage = categorySamples.find(s => s.imageUrl && s.imageUrl !== '/placeholder.jpg')

  // Priority: 1. Pack Cover (from metadata) 2. Featured sample 3. First sample 4. Placeholder
  const packImage = (currentPack?.coverImage && currentPack.coverImage !== '/placeholder.jpg' ? currentPack.coverImage : null) ||
    (featuredSampleWithImage?.imageUrl) ||
    (firstSampleWithImage?.imageUrl) ||
    '/placeholder.jpg'

  const handlePlayClick = (sample: any) => {
    const audioUrl = sample.audioUrl || sample.url
    if (!audioUrl) {
      console.error("No audio URL for sample:", sample)
      return
    }

    if (currentTrack?.id === sample.id && isPlaying) {
      pauseTrack()
    } else {
      playTrack({
        id: sample.id,
        title: sample.name,
        artist: sample.category,
        audioUrl: audioUrl,
        imageUrl: packImage, // Use the consistent pack image
        duration: sample.duration || '0:00'
      }, filteredSamples.map(s => ({
        id: s.id,
        title: s.name,
        artist: s.category || "Unknown Category",
        audioUrl: s.audioUrl || s.url || "",
        imageUrl: packImage,
        duration: s.duration || '0:00'
      })))
    }
  }

  const handleDownload = (e: React.MouseEvent, sample: any) => {
    e.stopPropagation()
    const audioUrl = sample.audioUrl || sample.url
    if (!audioUrl) return

    const link = document.createElement('a')
    link.href = audioUrl
    link.download = `${sample.name}.wav` // Assuming wav, or just name
    link.target = "_blank" // Fallback for cross-origin
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const toggleFavorite = (e: React.MouseEvent, sample: any) => {
    e.stopPropagation()
    if (isFavorite(sample.id)) {
      removeFavorite(sample.id)
    } else {
      addFavorite({
        id: sample.id,
        name: sample.name,
        category: sample.category,
        bpm: sample.bpm || 0,
        key: formatKey(sample.key),
        duration: sample.duration || '0:00',
        imageUrl: packImage,
        audioUrl: sample.audioUrl || sample.url
      })
    }
  }

  const loading = samplesLoading || packsLoading

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
          <div className="w-64 h-64 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 bg-gradient-to-br from-green-900/50 to-emerald-950/50 relative">
            {loading ? (
              <Skeleton className="w-full h-full bg-white/10" />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={packImage}
                  alt={categoryName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/placeholder.jpg'
                  }}
                />
              </>
            )}
          </div>

          {/* Pack Details */}
          <div className="flex-1">
            <p className="text-sm text-green-400 mb-2">Sample Pack</p>
            <h1 className="text-5xl font-bold mb-4">{currentPack?.title || categoryName}</h1>
            <p className="text-white/60 mb-6">
              {currentPack?.title || categoryName} • {currentPack?.genre ? `${currentPack.genre} • ` : ''} {categorySamples.length} Samples
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">

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
          <p className="text-white/60 leading-relaxed whitespace-pre-wrap">
            {currentPack?.description || `Dive into the vibrant world of ${categoryName} with this meticulously curated pack for enthusiasts and producers alike. This dynamic collection features ${categorySamples.length} carefully selected samples.`}
          </p>
        </div>

        {/* Samples Section */}
        <div>
          <h2 className="text-3xl font-bold mb-6">Samples</h2>

          {/* Filters */}
          {/* Filters Removed */}

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

              {/* Sort Removed */}
            </div>
          </div>

          {/* Samples Table */}
          {loading ? (
            <div className="space-y-2">
              {/* Skeleton Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-white/5">
                <div className="col-span-1 bg-white/5 h-4 rounded animate-pulse"></div>
                <div className="col-span-11 bg-white/5 h-4 rounded animate-pulse w-1/4"></div>
              </div>

              {/* Skeleton Rows */}
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="grid grid-cols-12 gap-4 px-4 py-3 rounded-lg bg-white/5 animate-pulse">
                  <div className="col-span-1">
                    <div className="w-12 h-12 bg-white/10 rounded"></div>
                  </div>
                  <div className="col-span-5 flex flex-col justify-center gap-2">
                    <div className="h-4 bg-white/10 rounded w-3/4"></div>
                    <div className="h-3 bg-white/10 rounded w-1/2"></div>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="h-4 bg-white/10 rounded w-10"></div>
                  </div>
                  <div className="col-span-1 flex items-center justify-center">
                    <div className="h-4 bg-white/10 rounded w-8"></div>
                  </div>
                  <div className="col-span-2 flex items-center justify-center">
                    <div className="h-4 bg-white/10 rounded w-8"></div>
                  </div>
                  <div className="col-span-1"></div>
                </div>
              ))}
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
                    className={`grid grid-cols-12 gap-4 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer ${isCurrent ? 'bg-white/10' : ''
                      }`}
                    onClick={() => handlePlayClick(sample)}
                  >
                    {/* Pack Image + Play Button */}
                    <div className="col-span-1 flex items-center">
                      <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-800">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={packImage}
                          alt={sample.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            const target = e.target as HTMLImageElement
                            target.src = sampleImages[index % sampleImages.length]
                          }}
                        />
                        <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                    {/* Filename & Waveform */}
                    <div className="col-span-5 flex flex-col justify-center gap-1 min-w-0">
                      <div className="flex items-baseline justify-between">
                        <p className={`text-sm font-medium truncate ${isCurrentPlaying ? 'text-green-400' : 'text-white'}`}>
                          {sample.name}
                        </p>
                        <p className="text-xs text-white/40 truncate ml-2">
                          {sample.category}
                        </p>
                      </div>
                      <div className="h-8 w-full mt-1">
                        <WaveformCell
                          audioUrl={sample.audioUrl || sample.url || ""}
                          sampleId={sample.id}
                          height={32}
                          waveColor={isCurrentPlaying ? 'rgb(74, 222, 128)' : 'rgb(107, 114, 128)'}
                          progressColor="rgb(34, 197, 94)"
                        />
                      </div>
                    </div>

                    {/* Time */}
                    <div className="col-span-2 flex items-center justify-center">
                      <p className="text-sm text-white/60">{sample.duration || '0:16'}</p>
                    </div>

                    {/* Key */}
                    <div className="col-span-1 flex items-center justify-center">
                      <p className="text-sm text-white/60">{formatKey(sample.key)}</p>
                    </div>

                    {/* BPM */}
                    <div className="col-span-2 flex items-center justify-center">
                      <p className="text-sm text-white/60">{sample.bpm || '--'}</p>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDownload(e, sample)}
                        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors text-white/60 hover:text-white"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => toggleFavorite(e, sample)}
                        className={`w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors ${isFavorite(sample.id) ? 'text-green-500' : 'text-white/60 hover:text-white'}`}
                        title="Toogle Favorite"
                      >
                        <Heart className={`w-4 h-4 ${isFavorite(sample.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white">
                        <Plus className="w-4 h-4" />
                      </button>
                      <button className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white">
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

