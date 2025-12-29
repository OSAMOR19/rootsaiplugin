"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react"
import { motion } from "framer-motion"
import { useSamples, Sample } from "@/hooks/useSamples"
import { useAudio } from "@/contexts/AudioContext"
import { SAMPLE_IMAGES } from "@/constants/images"

const sampleImages = SAMPLE_IMAGES

interface SampleGroupSectionProps {
    title: string
    subTitle: string
    // Filter function to select relevant samples
    filterFn: (sample: Sample) => boolean
}

export default function SampleGroupSection({ title, subTitle, filterFn }: SampleGroupSectionProps) {
    const router = useRouter()
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const { playTrack, currentTrack, isPlaying, pauseTrack } = useAudio()
    const { samples, loading } = useSamples({ autoFetch: true })

    // Group samples by category
    const categoryMap = new Map<string, { sample: Sample, bestImageUrl?: string, isImageFromFeatured?: boolean, count: number }>()

    // Apply Filter First
    const filteredSamples = samples.filter(filterFn)

    filteredSamples.forEach(sample => {
        if (sample.category) {
            const existing = categoryMap.get(sample.category)
            const hasImage = sample.imageUrl && sample.imageUrl !== '/placeholder.jpg'

            let representativeSample = existing?.sample
            let bestImageUrl = existing?.bestImageUrl
            let isImageFromFeatured = existing?.isImageFromFeatured || false
            let count = (existing?.count || 0) + 1

            // 1. Determine Representative Sample (Featured > First encountered)
            if (!representativeSample || (sample.featured && !representativeSample.featured)) {
                representativeSample = sample
            }

            // 2. Determine Best Image (First Featured w/ Image > First w/ Image)
            if (hasImage) {
                // If we don't have an image yet, take this one
                if (!bestImageUrl) {
                    bestImageUrl = sample.imageUrl
                    isImageFromFeatured = sample.featured || false
                }
                // If we have an image, but it's NOT from a featured sample, and THIS one IS featured
                else if (sample.featured && !isImageFromFeatured) {
                    bestImageUrl = sample.imageUrl
                    isImageFromFeatured = true
                }
            }

            // @ts-ignore
            categoryMap.set(sample.category, { sample: representativeSample, bestImageUrl, isImageFromFeatured, count })
        }
    })

    const displayItems = Array.from(categoryMap.values())

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
                audioUrl: sample.audioUrl || sample.url,
                imageUrl: sample.imageUrl || imageUrl,
                duration: sample.duration || '0:00'
            })
        }
    }

    const handleCardClick = (category: string) => {
        router.push(`/pack/${encodeURIComponent(category)}`)
    }

    // Hide section entirely if no items found
    if (!loading && displayItems.length === 0) {
        return null
    }

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white uppercase">{title}</h2>
                    <p className="text-sm text-white/60 mt-1">{subTitle}</p>
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
                            <div key={i} className="flex-shrink-0 w-48 h-48 bg-white/5 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : displayItems.map(({ sample, bestImageUrl, count }, index) => {
                    const isCurrent = currentTrack?.id === sample.id
                    const isCurrentPlaying = isCurrent && isPlaying
                    // Fallback image using deterministic hash of category name
                    const fallbackIndex = sample.category?.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) || 0
                    const fallbackImage = sampleImages[fallbackIndex % sampleImages.length]

                    const imageUrl = bestImageUrl || fallbackImage

                    return (
                        <motion.div
                            key={sample.id}
                            className="flex-shrink-0 w-52 group cursor-pointer p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all"
                            whileHover={{ y: -4 }}
                            onClick={() => handleCardClick(sample.category || "")}
                        >
                            <div className={`w-full aspect-square rounded-lg mb-3 bg-gray-900 relative overflow-hidden border border-white/5 group-hover:border-green-500/50 transition-colors`}>
                                {/* Image */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={imageUrl}
                                    alt={sample.name}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = '/placeholder.jpg'
                                    }}
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
                            <div className="flex gap-1 mt-1.5 overflow-hidden">
                                {(sample.genres && sample.genres.length > 0 ? sample.genres.slice(0, 2) : ['Multi-Genre']).map((g: string, i: number) => (
                                    <span key={i} className="text-[10px] uppercase font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded-full text-white/60 whitespace-nowrap">
                                        {g}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
