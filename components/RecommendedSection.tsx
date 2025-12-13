"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { motion } from "framer-motion"
import { useSamples } from "@/hooks/useSamples"
import { useAudio } from "@/contexts/AudioContext"

const sampleImages = [
    "/images/afro.jpeg",
    "/images/afro.png",
    "/images/afro5.jpg",
    "/images/afrobeat.jpeg",
    "/images/afrobeat1.png",
    "/images/afrobeat2.jpg",
    "/images/afrobeats4.jpg",
    "/images/afrooo.jpg",
    "/images/albumimage2.jpg",
    "/images/albumimage3.webp",
    "/images/albumimage4.webp",
    "/images/albumimage5.jpg",
    "/images/alnumimag1.jpg",
    "/images/hihat.png",
    "/images/kickdrum.jpg",
    "/images/shekere.jpg",
    "/images/talkingdrum.jpg",
    "/images/tomimage.jpg",
    "/images/womanafrobeat.jpeg"
]

export default function RecommendedSection() {
    const router = useRouter()
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const { playTrack, currentTrack, isPlaying, pauseTrack } = useAudio()
    const { samples, loading } = useSamples({ autoFetch: true })

    // Group samples by category and get featured or first from each
    const categoryMap = new Map<string, any>()
    samples.forEach(sample => {
        if (sample.category) {
            const existing = categoryMap.get(sample.category)
            // If no existing sample for this category, or if current sample is featured and existing is not
            if (!existing || (sample.featured && !existing.featured)) {
                categoryMap.set(sample.category, sample)
            }
        }
    })
    const recommendedSamples = Array.from(categoryMap.values()).slice(0, 10)

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

    const handlePlayClick = (e: React.MouseEvent, sample: any, imageUrl: string) => {
        e.stopPropagation() // Prevent card click
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

    const handleCardClick = (category: string) => {
        router.push(`/pack/${encodeURIComponent(category)}`)
    }

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white">Recommended for You</h2>
                    <p className="text-sm text-white/60 mt-1">Packs selected just for you, based on your recent purchases. Updated daily.</p>
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
                    <div className="text-white/40">Loading samples...</div>
                ) : recommendedSamples.length === 0 ? (
                    <div className="text-white/40">No samples available</div>
                ) : recommendedSamples.map((sample, index) => {
                    const isCurrent = currentTrack?.id === sample.id
                    const isCurrentPlaying = isCurrent && isPlaying
                    const fallbackIndex = sample.category.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0)
                    const fallbackImage = sampleImages[fallbackIndex % sampleImages.length]

                    const imageUrl = sample.imageUrl && sample.imageUrl !== '/placeholder.jpg'
                        ? sample.imageUrl
                        : fallbackImage

                    return (
                        <motion.div
                            key={sample.id}
                            className="flex-shrink-0 w-48 group cursor-pointer"
                            whileHover={{ y: -4 }}
                            onClick={() => handleCardClick(sample.category)}
                        >
                            <div className={`w-full aspect-square rounded-lg mb-3 bg-gray-900 relative overflow-hidden border border-white/5 group-hover:border-green-500/50 transition-colors`}>
                                {/* Image */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt={sample.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />

                                {/* Hover overlay / Play Button */}
                                <div
                                    className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center z-20 ${isCurrentPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                    onClick={(e) => handlePlayClick(e, sample, imageUrl)}
                                >
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 ${isCurrentPlaying ? 'bg-green-500 text-white' : 'bg-white/20 text-white hover:scale-110 transition-transform'}`}>
                                        {isCurrentPlaying ? (
                                            <Pause className="w-5 h-5 fill-current" />
                                        ) : (
                                            <Play className="w-5 h-5 fill-current ml-1" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <h3 className={`text-sm font-medium truncate transition-colors ${isCurrentPlaying ? 'text-green-400' : 'text-white group-hover:text-white'}`}>{sample.category}</h3>
                            <p className="text-xs text-white/60 truncate">
                                {samples.filter(s => s.category === sample.category).length} Samples
                            </p>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
