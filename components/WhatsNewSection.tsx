"use client"

import { useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Disc } from "lucide-react"
import { motion } from "framer-motion"
import { usePacks } from "@/hooks/usePacks"
import { useRouter } from "next/navigation"

export default function WhatsNewSection() {
    const router = useRouter()
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const { packs, loading } = usePacks()

    // Get recently uploaded packs
    const newPacks = [...packs]
        .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
            return dateB - dateA
        })
        .slice(0, 10)

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

    const handlePackClick = (packTitle: string) => {
        router.push(`/pack/${encodeURIComponent(packTitle)}`)
    }

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold text-white">What's New This Week</h2>
                    <p className="text-sm text-white/60 mt-1">Check out brand-new sample packs newly added to the library.</p>
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
                            <div key={i} className="flex-shrink-0 w-64 h-64 bg-white/5 rounded-lg animate-pulse" />
                        ))}
                    </div>
                ) : newPacks.length === 0 ? (
                    <div className="text-white/40 text-center py-12 w-full">
                        No packs yet.
                    </div>
                ) : newPacks.map((pack) => {
                    return (
                        <motion.div
                            key={pack.id}
                            className="flex-shrink-0 w-64 group cursor-pointer"
                            whileHover={{ y: -4 }}
                            onClick={() => handlePackClick(pack.title)}
                        >
                            <div className={`w-full aspect-square rounded-xl mb-3 bg-gradient-to-br from-gray-900 to-gray-800 relative overflow-hidden border border-white/5 group-hover:border-green-500/50 transition-colors`}>
                                {/* Image */}
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={pack.coverImage || '/placeholder.jpg'}
                                    alt={pack.title}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = '/placeholder.jpg'
                                    }}
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                                    <span className="font-bold text-white text-shadow-sm line-clamp-1 text-lg">{pack.title}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/90">
                                            {pack.genre || 'Multi-Genre'}
                                        </span>
                                        {/* <span className="text-xs text-white/60">{pack.sampleCount || 0} samples</span> */}
                                    </div>
                                </div>

                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-black shadow-lg">
                                        <Disc className="w-4 h-4" />
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
