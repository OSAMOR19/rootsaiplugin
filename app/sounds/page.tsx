"use client"

import { useState, useMemo } from "react"
import { useSamples } from "@/hooks/useSamples"
import { useFavorites } from "@/hooks/useFavorites"
import { useAudio } from "@/contexts/AudioContext"
import { Play, Pause, Heart, MoreVertical, Filter, Search, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"
import { useSearchParams, useRouter } from "next/navigation"

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

    // Fetch Data
    const { samples, loading } = useSamples({ autoFetch: true })
    const { isFavorite, addFavorite, removeFavorite } = useFavorites()
    const { playTrack, currentTrack, isPlaying, pauseTrack } = useAudio()

    // Derived Filters Options
    const genres = [...new Set(samples.flatMap(s => s.genres || []))].filter(Boolean) as string[]
    const instruments = [...new Set(samples.flatMap(s => s.instruments || []))].filter(Boolean) as string[]
    const keys = [...new Set(samples.map(s => s.key).filter(Boolean))] as string[]
    const drumTypes = [...new Set(samples.map(s => s.drumType).filter(Boolean))] as string[]
    // Keywords often stored as array in s.keywords or s.tags
    // Assuming keywords is string[]
    const keywords = [...new Set(samples.flatMap(s => s.keywords || []))].filter(Boolean) as string[]
    const timeSignatures = [...new Set(samples.map(s => s.timeSignature).filter(Boolean))] as string[]

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
            if (selectedDrumType && sample.drumType !== selectedDrumType) return false

            // Keyword/Style Filter
            if (selectedKeyword && !sample.keywords?.includes(selectedKeyword)) return false

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
            })
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

    return (
        <div className="w-full h-full p-6 text-white">
            {/* Header */}
            <div className="flex items-end justify-between mb-8">
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-white/50 hover:text-white mb-4 transition-colors group"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-2">Sounds</h1>
                    <p className="text-white/60">
                        {filteredSamples.length} results
                        {loading && <span className="ml-2 animate-pulse">Loading...</span>}
                    </p>
                </div>
            </div>

            {/* Sticky Filter Bar */}
            <div className="sticky top-0 z-30 bg-black/90 backdrop-blur-md pb-4 pt-2 -mx-2 px-2 border-b border-white/10 mb-6 space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                        type="text"
                        placeholder="Search sounds..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors"
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
                        options={drumTypes}
                    />
                    <FilterSelect
                        label="Keywords"
                        value={selectedKeyword}
                        onChange={setSelectedKeyword}
                        options={keywords}
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
            <div className="bg-black/20 rounded-xl overflow-hidden border border-white/5">
                {/* Table Header */}
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-medium text-white/40 uppercase tracking-wider relative z-20">
                    <div className="col-span-1"></div>
                    <div className="col-span-1">Pack</div>
                    <div className="col-span-4">Filename</div>
                    <div className="col-span-1">Time</div>
                    <div className="col-span-2">Key</div>
                    <div className="col-span-2">BPM</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="divide-y divide-white/5">
                    {loading && filteredSamples.length === 0 ? (
                        <div className="p-8 text-center text-white/40">Loading sounds...</div>
                    ) : filteredSamples.length === 0 ? (
                        <div className="p-12 text-center">
                            <Filter className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p className="text-white/40">No sounds found matching your filters.</p>
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
                                    className={`grid grid-cols-12 gap-4 p-3 items-center hover:bg-white/5 transition-colors group ${isCurrent ? 'bg-white/5' : ''}`}
                                >
                                    {/* Play Button */}
                                    <div className="col-span-1 flex justify-center">
                                        <button
                                            onClick={() => handlePlay(sample)}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCurrentPlaying ? 'bg-green-500 text-black' : 'bg-white/10 hover:bg-white/20 text-white'}`}
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
                                        <div className="w-8 h-8 rounded bg-white/10 overflow-hidden relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={sample.imageUrl || '/placeholder.jpg'}
                                                alt=""
                                                className="absolute inset-0 w-full h-full object-cover opacity-80"
                                            />
                                        </div>
                                    </div>

                                    {/* Filename & Tags */}
                                    <div className="col-span-4 min-w-0">
                                        <div className={`font-medium text-sm truncate ${isCurrent ? 'text-green-400' : 'text-white'}`}>
                                            {sample.name}
                                        </div>
                                        <div className="flex gap-1 overflow-hidden mt-1 opacity-60 text-xs text-white/60">
                                            {sample.genres?.slice(0, 2).map((g: string) => (
                                                <span key={g} className="truncate hover:text-white/80">{g}</span>
                                            ))}
                                            {(sample.genres?.length || 0) > 2 && <span>+</span>}
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="col-span-1 text-xs text-white/60 font-mono">
                                        {sample.duration || '0:00'}
                                    </div>

                                    {/* Key */}
                                    <div className="col-span-2 text-sm text-white/80 font-medium">
                                        {sample.key || '-'}
                                    </div>

                                    {/* BPM */}
                                    <div className="col-span-2 text-sm text-white/80 font-mono">
                                        {sample.bpm || '-'}
                                    </div>

                                    {/* Actions */}
                                    <div className="col-span-1 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => toggleFav(e, sample)}
                                            className={`p-1.5 rounded-full transition-colors ${isFavorite(sample.id) ? 'text-red-500 bg-red-500/10' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                                        >
                                            <Heart className={`w-4 h-4 ${isFavorite(sample.id) ? 'fill-current' : ''}`} />
                                        </button>
                                        <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
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
            className={`appearance-none bg-white/5 border px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors focus:outline-none 
                ${value ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-white/10 text-white/70 hover:border-white/30 hover:text-white'}`}
        >
            <option value="">{label}</option>
            {options.map((opt) => (
                <option key={opt} value={opt} className="bg-gray-900 text-white">{opt}</option>
            ))}
        </select>
    )
}
