"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import CustomDropdown from "@/components/CustomDropdown"
import MultiSelectDropdown from "@/components/MultiSelectDropdown"

interface BulkEditModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (value: any) => void
    field: string
    count: number
}

const keys = ['C Major', 'C Minor', 'C# Major', 'C# Minor', 'D Major', 'D Minor', 'Eb Major', 'Eb Minor', 'E Major', 'E Minor', 'F Major', 'F Minor', 'F# Major', 'F# Minor', 'G Major', 'G Minor', 'Ab Major', 'Ab Minor', 'A Major', 'A Minor', 'Bb Major', 'Bb Minor', 'B Major', 'B Minor']
const licenses = ['Royalty Free', 'Exclusive', 'Lease']
const pricings = ['1 Credit', '2 Credits', '3 Credits', 'Free']
const genresList = ["Hip Hop", "Electronic", "Rock", "Jazz", "Classical", "Ambient", "Trap", "R&B", "Pop", "Soul", "Funk", "Lo-Fi"]
const instrumentsList = ["Drums", "Bass", "Piano", "Guitar", "Synth", "Strings", "Brass", "Woodwinds", "Vocals", "Percussion", "FX"]

export default function BulkEditModal({ isOpen, onClose, onSave, field, count }: BulkEditModalProps) {
    const [value, setValue] = useState<any>(field === 'genres' || field === 'instruments' ? [] : "")

    const handleSave = () => {
        onSave(value)
        onClose()
        setValue(field === 'genres' || field === 'instruments' ? [] : "")
    }

    const renderInput = () => {
        switch (field) {
            case 'genre': // Mapped from 'genre' option to 'genres' field logic if needed, but let's stick to field names
            case 'genres':
                return (
                    <MultiSelectDropdown
                        options={genresList}
                        selected={value}
                        onChange={setValue}
                        placeholder="Select genres"
                    />
                )
            case 'instrument':
            case 'instruments':
                return (
                    <MultiSelectDropdown
                        options={instrumentsList}
                        selected={value}
                        onChange={setValue}
                        placeholder="Select instruments"
                    />
                )
            case 'pricing':
                return (
                    <CustomDropdown
                        options={pricings}
                        value={value}
                        onChange={setValue}
                        placeholder="Select pricing"
                    />
                )
            case 'license':
                return (
                    <CustomDropdown
                        options={licenses}
                        value={value}
                        onChange={setValue}
                        placeholder="Select license"
                    />
                )
            case 'keywords':
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder="Add keywords (comma separated)"
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                    />
                )
            default:
                return null
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                Edit {field}
                                <span className="ml-2 text-sm font-normal text-white/40">
                                    ({count} samples)
                                </span>
                            </h3>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        <div className="mb-8">
                            {renderInput()}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-white text-black hover:bg-green-400 rounded-lg font-bold transition-colors"
                            >
                                Apply to all
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
