"use client"

import { Play, Pause, SkipBack, SkipForward, Volume2, Heart, Repeat, Shuffle, X } from "lucide-react"
import { useAudio } from "@/contexts/AudioContext"
import { cn } from "@/lib/utils"

export default function PlayerBar() {
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        currentTime,
        duration,
        seekTo,
        playNext,
        playPrevious,
        toggleShuffle,
        isShuffle,
        toggleRepeat,
        repeatMode,
        closePlayer,
        volume,
        setVolume
    } = useAudio()

    const formatTime = (time: number) => {
        if (!time) return "0:00"
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value)
        seekTo(time)
    }

    if (!currentTrack) return null

    return (
        <div className="h-24 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 flex items-center justify-between px-6 fixed bottom-0 left-0 right-0 z-50 transition-colors duration-300">
            {/* Track Info */}
            <div className="flex items-center gap-4 w-[30%]">
                <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-gray-200 dark:from-gray-800 to-gray-300 dark:to-gray-700 flex-shrink-0 overflow-hidden relative group">
                    {currentTrack.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={currentTrack.imageUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-green-100 dark:from-green-900 to-emerald-200 dark:to-emerald-900" />
                    )}
                </div>
                <div className="min-w-0">
                    <h4 className="text-gray-900 dark:text-white font-medium truncate hover:underline cursor-pointer">{currentTrack.title}</h4>
                    <p className="text-xs text-gray-600 dark:text-white/60 truncate hover:text-gray-900 dark:hover:text-white cursor-pointer transition-colors">{currentTrack.artist}</p>
                </div>
                <button className="text-gray-400 dark:text-white/40 hover:text-green-500 transition-colors ml-2">
                    <Heart className="w-4 h-4" />
                </button>
            </div>

            {/* Player Controls */}
            <div className="flex flex-col items-center gap-2 w-[40%]">
                <div className="flex items-center gap-6">
                    <button
                        onClick={toggleShuffle}
                        className={`transition-colors ${isShuffle ? 'text-green-500' : 'text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <Shuffle className="w-4 h-4" />
                    </button>
                    <button
                        onClick={playPrevious}
                        className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <SkipBack className="w-5 h-5 fill-current" />
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-10 h-10 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center hover:scale-105 transition-transform"
                    >
                        {isPlaying ? (
                            <Pause className="w-5 h-5 text-white dark:text-black fill-current" />
                        ) : (
                            <Play className="w-5 h-5 text-white dark:text-black fill-current ml-1" />
                        )}
                    </button>
                    <button
                        onClick={playNext}
                        className="text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <SkipForward className="w-5 h-5 fill-current" />
                    </button>
                    <button
                        onClick={toggleRepeat}
                        className={`transition-colors ${repeatMode !== 'off' ? 'text-green-500' : 'text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white'}`}
                        title={`Repeat: ${repeatMode}`}
                    >
                        <Repeat className="w-4 h-4" />
                        {repeatMode === 'one' && <span className="text-[8px] absolute ml-2.5 mt-[-8px]">1</span>}
                    </button>
                </div>

                <div className="w-full flex items-center gap-2 text-xs text-gray-500 dark:text-white/40 font-medium font-mono">
                    <span className="w-10 text-right">{formatTime(currentTime)}</span>
                    <div className="flex-1 h-1 bg-gray-200 dark:bg-white/10 rounded-full relative group">
                        <div
                            className="absolute top-0 left-0 h-full bg-green-500 rounded-full group-hover:bg-green-400 transition-colors"
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={currentTime}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <span className="w-10">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume & Options */}
            <div className="flex items-center justify-end gap-4 w-[30%]">
                <div className="flex items-center gap-2 group">
                    <Volume2 className="w-5 h-5 text-gray-500 dark:text-white/60 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                    <div className="w-24 h-1 bg-gray-200 dark:bg-white/10 rounded-full relative group/vol">
                        <div
                            className="absolute top-0 left-0 h-full bg-gray-500 dark:bg-white/60 group-hover/vol:bg-green-500 transition-colors rounded-full"
                            style={{ width: `${volume * 100}%` }}
                        />
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={volume}
                            onChange={(e) => setVolume(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                </div>
                <button
                    onClick={closePlayer}
                    className="text-gray-400 dark:text-white/40 hover:text-gray-900 dark:hover:text-white transition-colors ml-4"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
