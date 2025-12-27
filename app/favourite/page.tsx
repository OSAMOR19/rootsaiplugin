"use client"

import { useFavorites } from "@/hooks/useFavorites"
import { useAudio } from "@/contexts/AudioContext"
import { Play, Pause, Heart, Clock, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export default function FavoritesPage() {
    const router = useRouter()
    const { favorites, removeFavorite } = useFavorites()
    const { playTrack, currentTrack, isPlaying, pauseTrack } = useAudio()

    const handlePlay = (sample: any) => {
        if (currentTrack?.id === sample.id && isPlaying) {
            pauseTrack()
        } else {
            playTrack({
                id: sample.id,
                title: sample.name,
                artist: sample.artist || sample.category,
                audioUrl: sample.audioUrl,
                imageUrl: sample.imageUrl,
                duration: sample.duration
            })
        }
    }

    return (
        <div className="w-full h-full p-6 text-white">
            <button
                onClick={() => router.back()}
                className="flex items-center text-white/50 hover:text-white mb-8 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back
            </button>
            <h1 className="text-3xl font-bold text-white mb-2">Favorites</h1>
            <p className="text-white/60 mb-8">{favorites.length} sounds</p>

            {favorites.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <Heart className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">No favorites yet</h3>
                    <p className="text-white/50">Heart sounds to add them to your collection.</p>
                </div>
            ) : (
                <div className="bg-black/40 border border-white/5 rounded-xl overflow-hidden backdrop-blur-sm">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-medium text-white/40 uppercase tracking-wider">
                        <div className="col-span-1"></div> {/* Play */}
                        <div className="col-span-5">Name</div>
                        <div className="col-span-2">BPM</div>
                        <div className="col-span-2">Key</div>
                        <div className="col-span-1 text-right">Time</div>
                        <div className="col-span-1"></div> {/* Actions */}
                    </div>

                    {/* List */}
                    <div className="divide-y divide-white/5">
                        {favorites.map((sample) => {
                            const isCurrent = currentTrack?.id === sample.id
                            const isCurrentPlaying = isCurrent && isPlaying

                            return (
                                <motion.div
                                    key={sample.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group ${isCurrent ? 'bg-white/5' : ''}`}
                                >
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            onClick={() => handlePlay(sample)}
                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 hover:scale-105 transition-all text-white"
                                        >
                                            {isCurrentPlaying ? (
                                                <Pause className="w-4 h-4 fill-current" />
                                            ) : (
                                                <Play className="w-4 h-4 fill-current ml-0.5" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="col-span-5">
                                        <div className="font-medium text-white text-sm truncate">{sample.name}</div>
                                        <div className="text-xs text-white/40 truncate">{sample.category}</div>
                                    </div>

                                    <div className="col-span-2 text-sm text-white/60">
                                        {sample.bpm || '-'}
                                    </div>

                                    <div className="col-span-2 text-sm text-white/60">
                                        {sample.key || '-'}
                                    </div>

                                    <div className="col-span-1 text-sm text-white/60 text-right font-mono">
                                        {sample.duration || '0:00'}
                                    </div>

                                    <div className="col-span-1 flex justify-end">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                removeFavorite(sample.id)
                                            }}
                                            className="p-2 text-red-500 hover:bg-white/10 rounded-full transition-colors"
                                            title="Remove from favorites"
                                        >
                                            <Heart className="w-4 h-4 fill-current" />
                                        </button>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
