"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronDown, ChevronUp } from "lucide-react"
import CustomDropdown from "@/components/CustomDropdown"
import MultiSelectDropdown from "@/components/MultiSelectDropdown"

interface BulkEditModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (updates: Record<string, any>) => void
    initialField: string
    count: number
}

// Define lists here to be self-contained
const genresList = ["Afrobeats", "Amapiano", "Afrohouse", "World"]
const instrumentsList = ["Drums", "Bass", "Piano", "Guitar", "Synth", "Strings", "Brass", "Woodwinds", "Vocals", "Percussion", "FX"]
const drumTypes = ["Kick Loop", "Snare Loop", "Hat Loop", "Percussion Loop", "Shaker Loop", "Top Loop", "Full Drum Loop", "Drum One-Shot", "Fill"]
// Pricing and License were requested to be removed from here or replaced, but usually Pricing/License are bulk editable. 
// The user updated the Dropdown in EditSamplesStep, but passing them here is useful.


// Map valid fields to their display names and logic
const AVAILABLE_FIELDS = [
    { id: 'category', label: 'Pack Name' },
    { id: 'genres', label: 'Genres' },
    { id: 'instruments', label: 'Instruments' },
    { id: 'drumType', label: 'Drum Type' },
    { id: 'keywords', label: 'Keywords' },
]

export default function BulkEditModal({ isOpen, onClose, onSave, initialField, count }: BulkEditModalProps) {
    const [activeFields, setActiveFields] = useState<string[]>([])
    const [formValues, setFormValues] = useState<Record<string, any>>({})

    // Add menu state
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false)
    const addMenuRef = useRef<HTMLDivElement>(null)

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            // Normalize initial field
            let field = initialField.toLowerCase()
            if (field === 'genre') field = 'genres'
            if (field === 'instrument') field = 'instruments'
            if (field === 'drum type') field = 'drumType'
            if (field === 'pack name') field = 'category'

            setActiveFields([field])
            setFormValues({})
            setIsAddMenuOpen(false)
        }
    }, [isOpen, initialField])

    // Close Add Menu on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setIsAddMenuOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])


    const handleSave = () => {
        // Filter out unused fields just in case, though formValues works
        const updates: Record<string, any> = {}
        activeFields.forEach(field => {
            if (formValues[field] !== undefined) {
                updates[field] = formValues[field]
            }
        })
        onSave(updates)
        onClose()
    }

    const handleUpdateValue = (field: string, value: any) => {
        setFormValues(prev => ({ ...prev, [field]: value }))
    }

    const addField = (fieldId: string) => {
        if (!activeFields.includes(fieldId)) {
            setActiveFields(prev => [...prev, fieldId])
        }
        setIsAddMenuOpen(false)
    }

    const removeField = (fieldId: string) => {
        setActiveFields(prev => prev.filter(f => f !== fieldId))
        const newValues = { ...formValues }
        delete newValues[fieldId]
        setFormValues(newValues)
    }

    // Helper to get current options
    const getOptions = (field: string) => {
        if (field === 'genres') return genresList
        if (field === 'instruments') return instrumentsList
        if (field === 'drumType') return drumTypes
        return []
    }


    const renderFieldInput = (field: string) => {
        const value = formValues[field]

        switch (field) {
            case 'category':
                return (
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Pack Name</label>
                        <input
                            type="text"
                            value={value || ""}
                            onChange={(e) => handleUpdateValue('category', e.target.value)}
                            placeholder="Enter pack name (e.g. Fills & Rolls)"
                            className="w-full bg-[#181818] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white/30 transition-colors"
                        />
                    </div>
                )
            case 'genres':
                return (
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Genres</label>
                        <MultiSelectDropdown
                            options={getOptions('genres')}
                            selected={value || []}
                            onChange={(val: string[]) => handleUpdateValue('genres', val)}
                            placeholder="Select genres"
                        />
                    </div>
                )
            case 'instruments':
                return (
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Instruments</label>
                        <MultiSelectDropdown
                            options={getOptions('instruments')}
                            selected={value || []}
                            onChange={(val: string[]) => handleUpdateValue('instruments', val)}
                            placeholder="Select instruments"
                        />
                    </div>
                )
            case 'drumType':
                return (
                    <div>
                        <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Drum Type</label>
                        <CustomDropdown
                            options={getOptions('drumType')}
                            value={value || ""}
                            onChange={(val: string) => handleUpdateValue('drumType', val)}
                            placeholder="Select drum type"
                        />
                    </div>
                )
            case 'keywords':
                return (
                    <KeywordsInput
                        value={value || []}
                        onChange={(val: string[]) => handleUpdateValue('keywords', val)}
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
                        className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 shadow-2xl flex flex-col min-h-[85vh] max-h-[95vh]"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-white">
                                    Edit {count} samples
                                </h3>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6 pt-4">
                            {activeFields.map((field) => (
                                <div key={field} className="relative group">
                                    {/* Remove Field Button */}
                                    {activeFields.length > 1 && (
                                        <button
                                            onClick={() => removeField(field)}
                                            className="absolute -right-2 -top-2 p-1 bg-rose-500/20 text-rose-400 rounded-full hover:bg-rose-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-10"
                                            title="Remove field"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                    {renderFieldInput(field)}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center justify-between mt-8 pt-4 border-t border-white/10 relative">
                            {/* Add More Edits Dropdown - Footer Left */}
                            <div className="relative inline-block" ref={addMenuRef}>
                                <button
                                    onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium text-white/80 hover:text-white transition-colors border border-white/5 hover:border-white/10"
                                >
                                    Add more edits
                                    {isAddMenuOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                <AnimatePresence>
                                    {isAddMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            className="absolute left-0 bottom-full mb-2 w-48 bg-[#181818] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                                        >
                                            <div className="p-1">
                                                {AVAILABLE_FIELDS.filter(f => !activeFields.includes(f.id)).map((field) => (
                                                    <button
                                                        key={field.id}
                                                        onClick={() => addField(field.id)}
                                                        className="w-full text-left px-3 py-2 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                                                    >
                                                        {field.label}
                                                    </button>
                                                ))}

                                                {AVAILABLE_FIELDS.filter(f => !activeFields.includes(f.id)).length === 0 && (
                                                    <div className="px-3 py-2 text-xs text-white/30 text-center">
                                                        No more fields available
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex justify-end gap-3 z-0">
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-full font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-8 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-full font-bold transition-colors shadow-lg shadow-purple-600/20"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

// Sub-components for cleaner file

function KeywordsInput({ value, onChange }: { value: string[], onChange: (val: string[]) => void }) {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault()
            const input = e.currentTarget
            const text = input.value.trim()
            if (text && !value.includes(text)) {
                onChange([...value, text])
                input.value = ''
            }
        }
    }

    const remove = (k: string) => {
        onChange(value.filter((i: string) => i !== k))
    }

    return (
        <div>
            <label className="block text-xs font-bold text-white/60 mb-2 uppercase">Keywords</label>
            <div className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus-within:border-white/30 transition-colors flex flex-wrap gap-2 items-center min-h-[50px]">
                {value.map((keyword: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-white/10 rounded text-sm flex items-center gap-1">
                        {keyword}
                        <button onClick={() => remove(keyword)} className="hover:text-red-400">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? "Add keywords (Enter)..." : ""}
                    className="bg-transparent border-none focus:outline-none flex-1 min-w-[100px] text-white placeholder-white/20 h-full"
                />
            </div>
        </div>
    )
}
