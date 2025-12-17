"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { motion } from "framer-motion"
import { useSamples } from "@/hooks/useSamples"
import { useAudio } from "@/contexts/AudioContext"

// Reusing images for consistency, or we could have a separate set
import { SAMPLE_IMAGES } from "@/constants/images"

// Reusing images for consistency
const sampleImages = SAMPLE_IMAGES

export default function WhatsNewSection() {
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const { playTrack, currentTrack, isPlaying, pauseTrack } = useAudio()
    const { samples, loading } = useSamples({ autoFetch: true })

    // Get recently uploaded samples
    // First try to get samples with uploadedAt field (new uploads)
    // If none exist, show the last 10 samples from the array
    const samplesWithDate = samples.filter(s => s.uploadedAt)
    const newSamples = samplesWithDate.length > 0
        ? samplesWithDate
            .sort((a, b) => new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime())
            .slice(0, 10)
        : samples.slice(-10).reverse() // Get last 10 samples (most recent)

    // Helper to get sample image with fallback
    const getSampleImage = (sample: any) => {
        if (sample.imageUrl && sample.imageUrl !== '/placeholder.jpg') {
            return sample.imageUrl
        }
        const category = sample.category || sample.name || 'default'
        const hash = category.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
        return sampleImages[hash % sampleImages.length]
    }

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
        }
    }

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    const handlePlayClick = (sample: any, imageUrl: string) => {
        if (currentTrack?.id === sample.id && isPlaying) {
            pauseTrack()
        } else {
            playTrack({
                id: sample.id,
                title: sample.name,
                artist: sample.artist || sample.category,
                audioUrl: sample.audioUrl || sample.url, // Support both R2 and local URLs
                imageUrl: sample.imageUrl || imageUrl, // Use uploaded image or fallback
                duration: sample.duration || '0:00'
            })
        }
    }

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white">What's New This Week</h2>
                    <p className="text-sm text-white/60 mt-1">Check out brand-new loops and one-shots from newly released sample packs.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className={`p-2 rounded-full border border-white/10 transition-colors ${canScrollLeft ? 'text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className={`p-2 rounded-full border border-white/10 transition-colors ${canScrollRight ? 'text-white hover:bg-white/10' : 'text-white/20 cursor-not-allowed'}`}
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {loading ? (
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex-shrink-0 w-64 h-48 bg-white/5 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : newSamples.length === 0 ? (
                    <div className="text-white/40 text-center py-12 w-full">
                        No samples yet. Upload some samples to see them here!
                    </div>
                ) : newSamples.map((sample, index) => {
                    const isCurrent = currentTrack?.id === sample.id
                    const isCurrentPlaying = isCurrent && isPlaying
                    const imageUrl = getSampleImage(sample)

                    return (
                        <motion.div
                            key={sample.id}
                            className="flex-shrink-0 w-64 group cursor-pointer"
                            whileHover={{ y: -4 }}
                            onClick={() => handlePlayClick(sample, imageUrl)}
                        >
                            <div className={`w-full aspect-video rounded-lg mb-3 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden border border-white/5 group-hover:border-green-500/50 transition-colors`}>
                                {/* Image */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt={sample.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = sampleImages[index % sampleImages.length]
                                    }}
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                                    <span className="font-bold text-white text-shadow-sm line-clamp-1 text-lg">{sample.name}</span>
                                    <p className="text-xs text-white/60 mt-1">{sample.artist}</p>
                                </div>

                                {/* Hover overlay / Play Button */}
                                <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center z-20 ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 ${isCurrentPlaying ? 'bg-green-500 text-white' : 'bg-white/20 text-white hover:scale-110 transition-transform'}`}>
                                        {isCurrentPlaying ? (
                                            <Pause className="w-6 h-6 fill-current" />
                                        ) : (
                                            <Play className="w-6 h-6 fill-current ml-1" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
