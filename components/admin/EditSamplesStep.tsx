
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Pause, CheckCircle, Circle, Music, Star, X } from "lucide-react"
import CustomDropdown from "@/components/CustomDropdown"
import EditActionsDropdown from "@/components/admin/EditActionsDropdown"
import MultiSelectDropdown from "@/components/MultiSelectDropdown"
import BulkEditModal from "@/components/admin/BulkEditModal"

interface EditSamplesStepProps {
    files: File[]
    initialData?: SampleMetadata[]
    onBack: () => void
    onSubmit: (data: any) => void
    defaultCategory?: string
    onChange?: (data: SampleMetadata[]) => void
}

interface SampleMetadata {
    id: string
    file: File
    name: string
    tempo: string
    key: string
    timeSignature?: string
    genres: string[]
    instruments: string[]
    drumType: string
    keywords: string[]
    category?: string
    isPlaying?: boolean
    selected?: boolean
    featured?: boolean
}

import { GENRE_OPTIONS, INSTRUMENT_OPTIONS, DRUM_TYPE_OPTIONS, KEYWORD_OPTIONS } from "@/lib/constants"

const keys = ['C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor', 'Eb Major', 'Eb Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'F# Major', 'F# Minor', 'G Major', 'G Minor', 'Ab Major', 'Ab Minor', 'A Major', 'A Minor', 'Bb Major', 'Bb Minor', 'B Major', 'B Minor']
const timeSignatures = ["4/4", "6/8", "3/4"]

export default function EditSamplesStep({ files, initialData, onBack, onSubmit, defaultCategory, onChange }: EditSamplesStepProps) {
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
            const mergedSamples = files.map((file, index) => {
                // Try to find existing metadata for this file
                const existing = initialData?.find(d => d.file.name === file.name || d.name === file.name)

                if (existing) {
                    return {
                        ...existing,
                        file: file, // Keep the file object reference
                        id: existing.id || `sample-${index}`,
                        selected: false
                    }
                } else {
                    // New file, create default structure
                    return {
                        id: `new-${Date.now()}-${index}`,
                        file: file,
                        name: file.name.replace(/\.[^/.]+$/, ""),
                        tempo: "",
                        key: "",
                        timeSignature: "4/4",
                        genres: [],
                        instruments: [],
                        drumType: "",
                        keywords: [],
                        // Inherit category from existing samples if available, or default
                        category: initialData?.[0]?.category || defaultCategory || "Uncategorized",
                        selected: false,
                        featured: false
                    }
                }
            })

            setSamples(mergedSamples)
            if (mergedSamples.length > 0) {
                setSelectedId(mergedSamples[0].id)
            }
        }
    }, [files, initialData])

    // Set selected ID if we loaded from initial Data
    useEffect(() => {
        if (samples.length > 0 && !selectedId) {
            setSelectedId(samples[0].id)
        }
    }, [samples])

    // Audio Playback Logic
    useEffect(() => {
        if (playingId) {
            const sample = samples.find(s => s.id === playingId)
            if (sample && sample.file) {
                if (audioRef.current) {
                    audioRef.current.pause()
                    URL.revokeObjectURL(audioRef.current.src)
                }

                // Handle existing R2 URL for editing or Create Object URL for new files
                let src = ""
                // @ts-ignore
                if (sample.file.r2_url) {
                    // @ts-ignore
                    src = sample.file.r2_url
                } else {
                    src = URL.createObjectURL(sample.file)
                }

                const audio = new Audio(src)
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
                if (audioRef.current.src.startsWith('blob:')) {
                    URL.revokeObjectURL(audioRef.current.src)
                }
            }
        }
    }, [playingId, samples])

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

    const handleBulkSave = (updates: Record<string, any>) => {
        if (!bulkEditField) return

        setSamples(prev => prev.map(s => {
            if (s.selected) {
                // Clone object
                const updatedSample = { ...s }

                // Apply all updates
                Object.keys(updates).forEach(key => {
                    // Check if it's a valid key on SampleMetadata to be safe (optional but good practice)
                    // Because of the 'bulkEditField' mapping in previous logic, we might need to map keys back if they differ
                    // But in BulkEditModal we normalized keys to match SampleMetadata properties: 'genres', 'instruments', 'drumType', etc.
                    // 'keywords' is also direct.
                    // The only potential mismatch is if old logic used 'genre' singular. But BulkEditModal now sends 'genres'.
                    // So we can directly assign.

                    // @ts-ignore - Dynamic assignment
                    updatedSample[key] = updates[key]
                })
                return updatedSample
            }
            return s
        }))
        setBulkEditField(null)
    }

    // Keyword tag removal can be handled by MultiSelectDropdown's internal logic or via handleUpdate directly
    // Removing the manual keydown handler and removeKeyword function since we use MultiSelectDropdown now

    // Sync local state changes to parent (for persistence across steps)
    useEffect(() => {
        onChange?.(samples)
    }, [samples, onChange])

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
                // @ts-ignore
                onSave={handleBulkSave}
                initialField={bulkEditField || ""}
                count={selectedCount}
            />

            {/* Left Sidebar: Sample List */}
            <div className="w-1/3 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 px-2">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                            <span className="font-bold text-white">{samples.length} samples</span>
                            <span className="text-[10px] text-white/40 uppercase tracking-widest">Select files to bulk edit</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedCount > 0 ? (
                            <button onClick={handleDeselectAll} className="text-xs text-white/40 hover:text-white bg-white/5 px-2 py-1 rounded">Unselect All</button>
                        ) : (
                            <button onClick={handleSelectAll} className="text-xs text-white/40 hover:text-white bg-white/5 px-2 py-1 rounded">Select All</button>
                        )}
                        <EditActionsDropdown
                            onSelectAll={handleSelectAll}
                            onDeselectAll={handleDeselectAll}
                            onDeleteSelected={handleDeleteSelected}
                            onEdit={handleBulkEdit}
                            selectedCount={selectedCount}
                            totalCount={samples.length}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {samples.map((sample) => (
                        <div
                            key={sample.id}
                            onClick={() => setSelectedId(sample.id)}
                            className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all border group relative overflow-hidden ${selectedId === sample.id
                                ? 'bg-white/10 border-white/20'
                                : 'bg-transparent border-transparent hover:bg-white/5'
                                } `}
                        >
                            {/* Selection Effect */}
                            {sample.selected && (
                                <div className="absolute inset-0 bg-green-500/5 pointer-events-none" />
                            )}

                            <div
                                onClick={(e) => toggleSelection(sample.id, e)}
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors z-10 ${sample.selected
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-white/20 hover:border-white/40'
                                    } `}
                            >
                                {sample.selected && <CheckCircle className="w-3 h-3 text-black" />}
                            </div>

                            <button
                                onClick={(e) => { e.stopPropagation(); togglePlay(sample.id); }}
                                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors z-10"
                            >
                                {playingId === sample.id ? <Pause className="w-3 h-3 text-white" /> : <Play className="w-3 h-3 text-white" />}
                            </button>

                            <div className="flex-1 min-w-0 z-10">
                                <p className={`text-sm font-medium truncate ${selectedId === sample.id ? 'text-white' : 'text-white/60'} `}>
                                    {sample.name}
                                </p>
                            </div>

                            {/* Featured Toggle */}
                            <button
                                onClick={(e) => toggleFeatured(sample.id, e)}
                                className={`p-1 rounded-full transition-colors z-10 ${sample.featured ? 'text-yellow-400' : 'text-white/10 hover:text-white/40'} `}
                                title="Set as featured sample"
                            >
                                <Star className="w-4 h-4 fill-current" />
                            </button>

                            {/* Category/Type Indicator */}
                            {sample.drumType && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-white/10 rounded text-white/40 max-w-[60px] truncate">
                                    {sample.drumType}
                                </span>
                            )}
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
                            <div className="min-w-0 flex-1">
                                <h2 className="text-xl font-bold text-white truncate">{currentSample.name}</h2>
                                <p className="text-xs text-white/40 mt-1">{currentSample.file.size ? (currentSample.file.size / 1024 / 1024).toFixed(2) + ' MB' : 'Existing File'}</p>
                            </div>
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

                            {/* Time Signature - Moved here replacing Key */}
                            <div>
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Time Sig</label>
                                <CustomDropdown
                                    options={timeSignatures}
                                    value={currentSample.timeSignature || "4/4"}
                                    onChange={(val) => handleUpdate('timeSignature', val)}
                                    placeholder="4/4"
                                />
                            </div>

                            {/* Replaced License with Drum Type */}
                            <div className="col-span-2">
                                <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Drum Type</label>
                                <CustomDropdown
                                    options={DRUM_TYPE_OPTIONS}
                                    value={currentSample.drumType}
                                    onChange={(val) => handleUpdate('drumType', val)}
                                    placeholder="Select drum type (e.g. Kick Loop)"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Genres</label>
                            <MultiSelectDropdown
                                options={GENRE_OPTIONS}
                                selected={currentSample.genres}
                                onChange={(val) => handleUpdate('genres', val)}
                                placeholder="Select genres"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Instruments</label>
                            <MultiSelectDropdown
                                options={INSTRUMENT_OPTIONS}
                                selected={currentSample.instruments}
                                onChange={(val) => handleUpdate('instruments', val)}
                                placeholder="Select instruments"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Keywords (Max 3)</label>
                            <MultiSelectDropdown
                                options={KEYWORD_OPTIONS}
                                selected={currentSample.keywords}
                                onChange={(val) => {
                                    if (val.length <= 3) {
                                        handleUpdate('keywords', val)
                                    }
                                }}
                                placeholder="Select keywords"
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
                    onClick={async () => {
                        const btn = document.activeElement as HTMLButtonElement
                        if (btn) btn.disabled = true;
                        btn.innerText = "Saving..."
                        await onSubmit(samples)
                        if (btn) {
                            btn.disabled = false;
                            btn.innerText = "Save Changes"
                        }
                    }}
                    className="px-8 py-3 bg-white text-black hover:bg-green-400 rounded-full font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Save Changes
                </button>
            </div>
        </motion.div >
    )
}
