"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion } from "framer-motion"
import { useSamples } from "@/hooks/useSamples"

const gradients = [
    "bg-gradient-to-br from-green-900/80 to-emerald-950 border border-green-800/30",
    "bg-gradient-to-br from-emerald-900/80 to-teal-950 border border-emerald-800/30",
    "bg-gradient-to-br from-teal-900/80 to-cyan-950 border border-teal-800/30",
    "bg-gradient-to-br from-purple-900/80 to-indigo-950 border border-purple-800/30",
    "bg-gradient-to-br from-blue-900/80 to-sky-950 border border-blue-800/30",
    "bg-gradient-to-br from-rose-900/80 to-pink-950 border border-rose-800/30",
]

export default function BrowseHeader() {
    const router = useRouter()
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(true)
    const { samples, loading } = useSamples({ autoFetch: true })
    
    // Get unique categories from REAL data
    const categories = [...new Set(samples.map(s => s.category).filter(Boolean))]
        .map((category, index) => ({
            title: category as string,
            count: samples.filter(s => s.category === category).length,
            gradient: gradients[index % gradients.length]
        }))

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

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-green-100 to-green-200 bg-clip-text text-transparent">Browse</h1>
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
                            <div key={i} className="h-16 min-w-[200px] bg-white/5 rounded-xl animate-pulse" />
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-white/40 text-center py-8 w-full">
                        No categories found. Upload some samples to get started!
                    </div>
                ) : categories.map((category) => (
                    <motion.div
                        key={category.title}
                        onClick={() => router.push(`/pack/${encodeURIComponent(category.title)}`)}
                        className={`relative h-16 min-w-[200px] flex-shrink-0 rounded-xl overflow-hidden cursor-pointer group ${category.gradient} backdrop-blur-sm`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                        <div className="absolute inset-0 px-4 flex items-center justify-between">
                            <div>
                                <span className="text-base font-semibold text-white group-hover:text-green-100 transition-colors block">
                                    {category.title}
                                </span>
                                <span className="text-xs text-white/60">
                                    {category.count} {category.count === 1 ? 'sample' : 'samples'}
                                </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-white/60 group-hover:text-green-400 transition-colors" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
