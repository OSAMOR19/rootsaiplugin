
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, CheckCircle, Circle, Music, Star } from "lucide-react"
import CustomDropdown from "@/components/CustomDropdown"
import EditActionsDropdown from "@/components/admin/EditActionsDropdown"
import MultiSelectDropdown from "@/components/MultiSelectDropdown"
import BulkEditModal from "@/components/admin/BulkEditModal"

interface EditSamplesStepProps {
    files: File[]
    onBack: () => void
    onSubmit: (data: any) => void
}

interface SampleMetadata {
    id: string
    file: File
    name: string
    tempo: string
    key: string
    license: string
    pricing: string
    genres: string[]
    instruments: string[]
    keywords: string
    isPlaying?: boolean
    selected?: boolean
    featured?: boolean
}

const keys = ['C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor', 'Eb Major', 'Eb Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'F# Major', 'F# Minor', 'G Major', 'G Minor', 'Ab Major', 'Ab Minor', 'A Major', 'A Minor', 'Bb Major', 'Bb Minor', 'B Major', 'B Minor']
const licenses = ['Royalty Free', 'Exclusive', 'Lease']
const pricings = ['1 Credit', '2 Credits', '3 Credits', 'Free']
const genresList = ["Hip Hop", "Electronic", "Rock", "Jazz", "Classical", "Ambient", "Trap", "R&B", "Pop", "Soul", "Funk", "Lo-Fi"]
const instrumentsList = ["Drums", "Bass", "Piano", "Guitar", "Synth", "Strings", "Brass", "Woodwinds", "Vocals", "Percussion", "FX"]

export default function EditSamplesStep({ files, onBack, onSubmit }: EditSamplesStepProps) {
    const [samples, setSamples] = useState<SampleMetadata[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [playingId, setPlayingId] = useState<string | null>(null)

    // Bulk Edit State
    const [bulkEditField, setBulkEditField] = useState<string | null>(null)

    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Initialize samples from files
    useEffect(() => {
        if (files.length > 0 && samples.length === 0) {
            const initialSamples = files.map((file, index) => ({
                id: `sample-${index}`,
                file,
                name: file.name.replace(/\.[^/.]+$/, ""),
                tempo: "",
                key: "",
                license: "Royalty Free",
                pricing: "1 Credit",
                genres: [],
                instruments: [],
                keywords: "",
                selected: false,
                featured: index === 0 // Default first one as featured
            }))
            setSamples(initialSamples)
            setSelectedId(initialSamples[0].id)
        }
    }, [files])

    // Audio Playback Logic
    useEffect(() => {
        if (playingId) {
            const sample = samples.find(s => s.id === playingId)
            if (sample && sample.file) {
                if (audioRef.current) {
                    audioRef.current.pause()
                    URL.revokeObjectURL(audioRef.current.src)
                }

                const url = URL.createObjectURL(sample.file)
                const audio = new Audio(url)
                audioRef.current = audio

                audio.play().catch(e => console.error("Playback failed:", e))
                audio.onended = () => setPlayingId(null)
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause()
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                URL.revokeObjectURL(audioRef.current.src)
            }
        }
    }, [playingId, samples]) // Added samples to dependency array to ensure correct sample.file is accessed

    const handleUpdate = (field: keyof SampleMetadata, value: any) => {
        if (!selectedId) return
        setSamples(prev => prev.map(s =>
            s.id === selectedId ? { ...s, [field]: value } : s
        ))
    }

    const togglePlay = (id: string) => {
        if (playingId === id) {
            setPlayingId(null)
        } else {
            setPlayingId(id)
        }
    }

    const toggleSelection = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSamples(prev => prev.map(s =>
            s.id === id ? { ...s, selected: !s.selected } : s
        ))
    }

    const toggleFeatured = (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setSamples(prev => prev.map(s => ({
            ...s,
            featured: s.id === id // Only one featured
        })))
    }

    const handleSelectAll = () => {
        setSamples(prev => prev.map(s => ({ ...s, selected: true })))
    }

    const handleDeselectAll = () => {
        setSamples(prev => prev.map(s => ({ ...s, selected: false })))
    }

    const handleDeleteSelected = () => {
        setSamples(prev => prev.filter(s => !s.selected))
        if (selectedId && samples.find(s => s.id === selectedId)?.selected) {
            setSelectedId(null)
        }
    }

    const handleBulkEdit = (field: string) => {
        setBulkEditField(field)
    }

    const handleBulkSave = (value: any) => {
        if (!bulkEditField) return

        // Map field names if necessary (e.g. 'genre' -> 'genres')
        let targetField = bulkEditField
        if (bulkEditField === 'genre') targetField = 'genres'
        if (bulkEditField === 'instrument') targetField = 'instruments'

        setSamples(prev => prev.map(s =>
            s.selected ? { ...s, [targetField]: value } : s
        ))
        setBulkEditField(null)
    }

    const currentSample = samples.find(s => s.id === selectedId)
    const selectedCount = samples.filter(s => s.selected).length

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-[calc(100vh-200px)] flex gap-8"
        >
            <BulkEditModal
                isOpen={!!bulkEditField}
                onClose={() => setBulkEditField(null)}
                onSave={handleBulkSave}
                field={bulkEditField || ""}
                count={selectedCount}
            />

            {/* Left Sidebar: Sample List */}
            <div className="w-1/3 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{samples.length} samples</span>
                        {selectedCount > 0 ? (
                            <div className="flex items-center gap-2">
                                <span className="text-green-400 text-sm">{selectedCount} selected</span>
                                <button onClick={handleDeselectAll} className="text-xs text-white/40 hover:text-white">Unselect all</button>
                            </div>
                        ) : (
                            <button onClick={handleSelectAll} className="text-xs text-white/40 hover:text-white">Select all</button>
                        )}
                    </div>
                    <EditActionsDropdown
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                        onDeleteSelected={handleDeleteSelected}
                        onEdit={handleBulkEdit}
                        selectedCount={selectedCount}
                        totalCount={samples.length}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {samples.map((sample) => (
                        <div
                            key={sample.id}
                            onClick={() => setSelectedId(sample.id)}
                            className={`p - 3 rounded - xl flex items - center gap - 3 cursor - pointer transition - all border group ${selectedId === sample.id
                                ? 'bg-white/10 border-white/20'
                                : 'bg-transparent border-transparent hover:bg-white/5'
                                } `}
                        >
                            <div
                                onClick={(e) => toggleSelection(sample.id, e)}
                                className={`w - 5 h - 5 rounded border flex items - center justify - center transition - colors ${sample.selected
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-white/20 hover:border-white/40'
                                    } `}
                            >
                                {sample.selected && <CheckCircle className="w-3 h-3 text-black" />}
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); togglePlay(sample.id); }}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                            >
                                {playingId === sample.id ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white" />}
                            </button>

                            <div className="flex-1 min-w-0">
                                <p className={`text - sm font - medium truncate ${selectedId === sample.id ? 'text-white' : 'text-white/60'} `}>
                                    {sample.name}
                                </p>
                            </div>

                            {/* Featured Toggle */}
                            <button
                                onClick={(e) => toggleFeatured(sample.id, e)}
                                className={`p - 1 rounded - full transition - colors ${sample.featured ? 'text-yellow-400' : 'text-white/10 hover:text-white/40'} `}
                                title="Set as featured sample"
                            >
                                <Star className="w-4 h-4 fill-current" />
                            </button>

                            {/* Completion Indicator - Mock logic for now */}
                            <div className={`w - 2 h - 2 rounded - full ${sample.genres.length > 0 ? 'bg-green-500' : 'bg-white/10'} `} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Panel: Editor */}
            <div className="flex-1 bg-white/5 rounded-3xl border border-white/10 p-8 h-full overflow-y-auto">
                {currentSample ? (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="flex items-center gap-4 mb-8">
                            <button
                                onClick={() => togglePlay(currentSample.id)}
                                className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-green-400 transition-colors"
                            >
                                {playingId === currentSample.id ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                            </button>
                            <h2 className="text-xl font-bold text-white truncate">{currentSample.name}</h2>
                            {currentSample.featured && (
                                <span className="px-2 py-1 bg-yellow-400/10 text-yellow-400 text-xs rounded border border-yellow-400/20">Featured</span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Tempo</label>
                                <input
                                    type="text"
                                    value={currentSample.tempo}
                                    onChange={(e) => handleUpdate('tempo', e.target.value)}
                                    placeholder="BPM"
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Key</label>
                                <CustomDropdown
                                    options={keys}
                                    value={currentSample.key}
                                    onChange={(val) => handleUpdate('key', val)}
                                    placeholder="Select key"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">License</label>
                                <CustomDropdown
                                    options={licenses}
                                    value={currentSample.license}
                                    onChange={(val) => handleUpdate('license', val)}
                                    placeholder="License"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Pricing</label>
                                <CustomDropdown
                                    options={pricings}
                                    value={currentSample.pricing}
                                    onChange={(val) => handleUpdate('pricing', val)}
                                    placeholder="Pricing"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Genres</label>
                            <MultiSelectDropdown
                                options={genresList}
                                selected={currentSample.genres}
                                onChange={(val) => handleUpdate('genres', val)}
                                placeholder="Select genres"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Instruments</label>
                            <MultiSelectDropdown
                                options={instrumentsList}
                                selected={currentSample.instruments}
                                onChange={(val) => handleUpdate('instruments', val)}
                                placeholder="Select instruments"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Keywords</label>
                            <input
                                type="text"
                                value={currentSample.keywords}
                                onChange={(e) => handleUpdate('keywords', e.target.value)}
                                placeholder="Comma separated"
                                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-white/20">
                        Select a sample to edit
                    </div>
                )}
            </div>

            {/* Footer Action */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-black/80 backdrop-blur-xl border-t border-white/10 flex justify-between z-50 px-12">
                <button
                    onClick={onBack}
                    className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-all"
                >
                    Back
                </button>

                <button
                    onClick={() => onSubmit(samples)}
                    className="px-8 py-3 bg-white text-black hover:bg-green-400 rounded-full font-bold transition-all"
                >
                    Submit for review
                </button>
            </div>
        </motion.div>
    )
}
