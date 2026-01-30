"use client"

import { useState, useMemo } from "react"
import { useSamples } from "@/hooks/useSamples"
import { useFavorites } from "@/hooks/useFavorites"
import { useAudio } from "@/contexts/AudioContext"
import { Play, Pause, Heart, MoreVertical, Filter, Search, ArrowLeft, Download } from "lucide-react"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"
import { DRUM_TYPE_OPTIONS, KEYWORD_OPTIONS } from "@/lib/constants"
import WaveformCell from "@/components/WaveformCell"
import SampleActionsMenu from "@/components/SampleActionsMenu"
import { formatTimeSeconds } from "@/lib/utils"

export default function SoundsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    // Filters State
    const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || "")
    const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || "")
    const [selectedInstrument, setSelectedInstrument] = useState(searchParams.get('instrument') || "")
    const [selectedKey, setSelectedKey] = useState(searchParams.get('key') || "")
    const [selectedDrumType, setSelectedDrumType] = useState(searchParams.get('drumType') || "")
    const [selectedKeyword, setSelectedKeyword] = useState(searchParams.get('keyword') || "")
    const [selectedTimeSignature, setSelectedTimeSignature] = useState(searchParams.get('timeSignature') || "")

    const [loadedDurations, setLoadedDurations] = useState<Record<string, number>>({})

    // Fetch Data
    const { samples, loading } = useSamples({ autoFetch: true })
    const { isFavorite, addFavorite, removeFavorite } = useFavorites()
    const { playTrack, currentTrack, isPlaying, pauseTrack, duration } = useAudio()

    // Derived Filters Options
    const genres = [...new Set(samples.flatMap(s => s.genres || []))].filter(Boolean) as string[]
    const instruments = [...new Set(samples.flatMap(s => s.instruments || []))].filter(Boolean) as string[]
    const keys = [...new Set(samples.map(s => s.key).filter(Boolean))] as string[]
    const drumTypes = [...new Set(samples.map(s => s.drumType).filter(Boolean))] as string[]
    // Keywords often stored as array in s.keywords or s.tags
    // Assuming keywords is string[]
    const keywords = [...new Set(samples.flatMap(s => s.keywords || []))].filter(Boolean) as string[]
    const timeSignatures = [...new Set([...samples.map(s => s.timeSignature).filter(Boolean), "4/4", "3/4"])].sort() as string[]

    // Filter Logic
    const filteredSamples = useMemo(() => {
        return samples.filter(sample => {
            // Search Query
            if (searchQuery) {
                const q = searchQuery.toLowerCase()
                const matchName = sample.name?.toLowerCase().includes(q)
                const matchCategory = sample.category?.toLowerCase().includes(q)
                if (!matchName && !matchCategory) return false
            }

            // Genre Filter
            if (selectedGenre && !sample.genres?.includes(selectedGenre)) return false

            // Instrument Filter
            if (selectedInstrument && !sample.instruments?.includes(selectedInstrument)) return false

            // Key Filter
            if (selectedKey && sample.key !== selectedKey) return false

            // Drum Type Filter
            if (selectedDrumType && sample.drumType?.toLowerCase() !== selectedDrumType.toLowerCase()) return false

            // Keyword/Style Filter
            if (selectedKeyword && !sample.keywords?.some((k: string) => k.toLowerCase() === selectedKeyword.toLowerCase())) return false

            // Time Signature Filter
            if (selectedTimeSignature && sample.timeSignature !== selectedTimeSignature) return false

            return true
        })
    }, [samples, searchQuery, selectedGenre, selectedInstrument, selectedKey, selectedDrumType, selectedKeyword, selectedTimeSignature])

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
            }, filteredSamples.map(s => ({
                id: s.id,
                title: s.name,
                artist: s.category || "Unknown Artist",
                audioUrl: s.audioUrl || "",
                imageUrl: s.imageUrl,
                duration: s.duration
            })))
        }
    }

    const toggleFav = (e: React.MouseEvent, sample: any) => {
        e.stopPropagation()
        if (isFavorite(sample.id)) {
            removeFavorite(sample.id)
        } else {
            addFavorite(sample)
        }
    }

    const handleDownload = async (e: React.MouseEvent, sample: any) => {
        e.stopPropagation()
        try {
            const audioUrl = sample.audioUrl || sample.url
            if (!audioUrl) return

            const response = await fetch(audioUrl)
            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${sample.name || 'sample'}.wav`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (error) {
            console.error('Download failed:', error)
            // Fallback
            window.open(sample.audioUrl || sample.url, '_blank')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300 p-6">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white mb-4 transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Sounds</h1>
                    <p className="text-gray-600 dark:text-white/60">
                        {filteredSamples.length} results
                        {loading && <span className="ml-2 animate-pulse">Loading...</span>}
                    </p>
                </div>
            </div>

            {/* Sticky Filter Bar */}
            <div className="sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md pb-4 pt-2 -mx-2 px-2 border-b border-gray-200 dark:border-white/10 mb-6 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                    <input
                        type="text"
                        placeholder="Search sounds..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-green-500 dark:focus:border-white/30 transition-colors"
                    />
                </div>

                {/* Dropdowns Row */}
                <div className="flex flex-wrap gap-2">
                    <FilterSelect
                        label="Instruments"
                        value={selectedInstrument}
                        onChange={setSelectedInstrument}
                        options={instruments}
                    />
                    <FilterSelect
                        label="Genres"
                        value={selectedGenre}
                        onChange={setSelectedGenre}
                        options={genres}
                    />
                    <FilterSelect
                        label="Key"
                        value={selectedKey}
                        onChange={setSelectedKey}
                        options={keys}
                    />
                    <FilterSelect
                        label="Drum Type"
                        value={selectedDrumType}
                        onChange={setSelectedDrumType}
                        options={DRUM_TYPE_OPTIONS}
                    />
                    <FilterSelect
                        label="Styles"
                        value={selectedKeyword}
                        onChange={setSelectedKeyword}
                        options={KEYWORD_OPTIONS}
                    />
                    <FilterSelect
                        label="Time Sig"
                        value={selectedTimeSignature}
                        onChange={setSelectedTimeSignature}
                        options={timeSignatures}
                    />

                    {/* Reset Button */}
                    {(selectedGenre || selectedInstrument || selectedKey || selectedDrumType || selectedKeyword || selectedTimeSignature || searchQuery) && (
                        <button
                            onClick={() => {
                                setSearchQuery("")
                                setSelectedGenre("")
                                setSelectedInstrument("")
                                setSelectedKey("")
                                setSelectedDrumType("")
                                setSelectedKeyword("")
                                setSelectedTimeSignature("")
                            }}
                            className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                            Reset
                        </button>
                    )}
                </div>

                {/* Active Tags Display (User requested specific horizontal tags) */}
                {/* For now showing selected filters as tags is good UX */}
            </div>

            {/* Sounds List */}
            <div className="bg-white/50 dark:bg-black/20 rounded-xl overflow-hidden border border-gray-200 dark:border-white/5">
                {/* Table Header */}
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-200 dark:border-white/5 text-xs font-medium text-gray-500 dark:text-white/40 uppercase tracking-wider relative z-20">
                    <div className="col-span-1"></div>
                    <div className="col-span-1">Pack</div>
                    <div className="col-span-3">Filename</div>
                    <div className="col-span-3">Waveform</div>
                    <div className="col-span-1">Time</div>
                    <div className="col-span-1">Key</div>
                    <div className="col-span-1">BPM</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {loading && filteredSamples.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-white/40">Loading sounds...</div>
                    ) : filteredSamples.length === 0 ? (
                        <div className="p-12 text-center">
                            <Filter className="w-12 h-12 text-gray-300 dark:text-white/10 mx-auto mb-4" />
                            <p className="text-gray-500 dark:text-white/40">No sounds found matching your filters.</p>
                        </div>
                    ) : (
                        filteredSamples.map((sample, index) => {
                            const isCurrent = currentTrack?.id === sample.id
                            const isCurrentPlaying = isCurrent && isPlaying

                            return (
                                <motion.div
                                    key={sample.id}
                                    initial={{ opacity: 0 }}
                                    whileInView={{ opacity: 1 }}
                                    viewport={{ once: true }}
                                    className={`grid grid-cols-12 gap-4 p-3 items-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group ${isCurrent ? 'bg-green-50 dark:bg-white/5' : ''}`}
                                >
                                    {/* Play Button */}
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            onClick={() => handlePlay(sample)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCurrentPlaying ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-700 dark:text-white'}`}
                                        >
                                            {isCurrentPlaying ? (
                                                <Pause className="w-4 h-4 fill-current" />
                                            ) : (
                                                <Play className="w-4 h-4 fill-current ml-0.5" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Pack Image */}
                                    <div className="col-span-1">
                                        <div className="w-8 h-8 rounded bg-gray-200 dark:bg-white/10 overflow-hidden relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={sample.imageUrl || '/placeholder.jpg'}
                                                alt=""
                                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                                            />
                                        </div>
                                    </div>

                                    {/* Filename & Tags */}
                                    <div className="col-span-3 min-w-0">
                                        <div className={`font-medium text-sm truncate ${isCurrent ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                                            {sample.name}
                                        </div>
                                        <div className="flex gap-1 overflow-hidden mt-1 opacity-60 text-xs text-gray-600 dark:text-white/60">
                                            {sample.genres?.slice(0, 2).map((g: string) => (
                                                <span key={g} className="truncate hover:text-gray-800 dark:hover:text-white/80">{g}</span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Waveform Status Bar */}
                                    <div className="col-span-3 flex items-center h-8">
                                        <div className="w-full h-full cursor-pointer group/wave rounded-lg overflow-hidden relative">
                                            {/* Pass audioUrl. If unavailable, maybe show placeholder or nothing */}
                                            {sample.audioUrl || sample.url ? (
                                                <WaveformCell
                                                    audioUrl={sample.audioUrl || sample.url || ""}
                                                    sampleId={sample.id}
                                                    height={32}
                                                    onDurationLoaded={(d) => setLoadedDurations(prev => ({ ...prev, [sample.id]: d }))}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 dark:text-white/20">
                                                    No Audio
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="col-span-1 text-xs text-gray-600 dark:text-white/60 font-mono">
                                        {isCurrent && duration > 0
                                            ? formatTimeSeconds(duration)
                                            : loadedDurations[sample.id]
                                                ? formatTimeSeconds(loadedDurations[sample.id])
                                                : (sample.duration || '0:00')
                                        }
                                    </div>

                                    {/* Key */}
                                    <div className="col-span-1 text-sm text-gray-700 dark:text-white/80 font-medium">
                                        {sample.key || '-'}
                                    </div>

                                    {/* BPM */}
                                    <div className="col-span-1 text-sm text-gray-700 dark:text-white/80 font-mono">
                                        {sample.bpm || '-'}
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex justify-end gap-2 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => toggleFav(e, sample)}
                                            className={`p-1.5 rounded-full transition-colors ${isFavorite(sample.id) ? 'text-red-500 bg-red-500/10' : 'text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'}`}
                                            title={isFavorite(sample.id) ? "Remove from favorite" : "Add to favorite"}
                                        >
                                            <Heart className={`w-4 h-4 ${isFavorite(sample.id) ? 'fill-current' : ''}`} />
                                        </button>
                                        <button
                                            onClick={(e) => handleDownload(e, sample)}
                                            className="p-1.5 text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
                                            title="Download"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                        <SampleActionsMenu sample={sample} />
                                    </div>
                                </motion.div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

function FilterSelect({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) {
    if (options.length === 0) return null

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`appearance-none bg-gray-100 dark:bg-white/5 border px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors focus:outline-none 
                ${value ? 'border-green-500/50 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-500/10' : 'border-gray-300 dark:border-white/10 text-gray-700 dark:text-white/70 hover:border-gray-400 dark:hover:border-white/30 hover:text-gray-900 dark:hover:text-white'}`}
        >
            <option value="">{label}</option>
            {options.map((opt) => (
                <option key={opt} value={opt} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">{opt}</option>
            ))}
        </select>
    )
}
