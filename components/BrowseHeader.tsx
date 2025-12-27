"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

// Types based on User Request - Centralized for now
// In a real app these might come from a config or DB
const EXPLORE_CATEGORIES = [
    {
        id: "genres",
        label: "GENRES",
        gradient: "bg-gradient-to-br from-purple-900/80 to-indigo-950 border border-purple-800/30",
        subItems: ["Afrobeats", "Amapiano", "Afro-house", "World", "Hip Hop", "RnB", "Pop", "Jazz"]
    },
    {
        id: "drum-type",
        label: "DRUM TYPE",
        gradient: "bg-gradient-to-br from-blue-900/80 to-cyan-950 border border-blue-800/30",
        subItems: ["Full Loops", "Top Loops", "Kick Loops", "Rim Loops", "Hi-hat Loops", "Drum Fills"]
    },
    {
        id: "percussions",
        label: "PERCUSSIONS",
        gradient: "bg-gradient-to-br from-orange-900/80 to-red-950 border border-orange-800/30",
        subItems: ["Shakers", "Conga", "Djembe", "Bongo", "Woodblock"]
    },
    {
        id: "styles",
        label: "STYLES",
        gradient: "bg-gradient-to-br from-emerald-900/80 to-teal-950 border border-emerald-800/30",
        subItems: ["Acoustic", "Epic", "Energetic", "Experimental", "Bouncy", "Rhythmic", "Percussive", "Groovy", "Mellow"]
    }
]

export default function BrowseHeader() {
    const router = useRouter()

    return (
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-6">Explore</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {EXPLORE_CATEGORIES.map((cat) => (
                    <motion.div
                        key={cat.id}
                        onClick={() => router.push(`/explore/${cat.id}`)}
                        className={`relative h-20 rounded-xl overflow-hidden cursor-pointer group ${cat.gradient} backdrop-blur-sm border-opacity-50 hover:border-opacity-100 transition-all shadow-lg`}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                        {/* Content */}
                        <div className="absolute inset-0 px-6 flex items-center justify-between">
                            <span className="text-lg font-bold text-white tracking-wide group-hover:text-white/90 transition-colors">
                                {cat.label}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                                <ChevronRight className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
