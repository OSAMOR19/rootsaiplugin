"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, CheckSquare, Square, Trash2 } from "lucide-react"

interface EditActionsDropdownProps {
    onSelectAll: () => void
    onDeselectAll: () => void
    onDeleteSelected: () => void
    onEdit: (field: string) => void
    selectedCount: number
    totalCount: number
}

export default function EditActionsDropdown({
    onSelectAll,
    onDeselectAll,
    onDeleteSelected,
    onEdit,
    selectedCount,
    totalCount
}: EditActionsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const handleAction = (action: () => void) => {
        action()
        setIsOpen(false)
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-xs text-white flex items-center gap-2 transition-colors"
            >
                Edit
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 backdrop-blur-xl"
                    >
                        <div className="p-1">
                            <div className="px-3 py-2 text-xs font-bold text-white/40 uppercase tracking-wider">
                                Bulk Edit
                            </div>
                            {['Genre', 'Instrument', 'Keywords', 'Drum Type'].map((option) => (
                                <button
                                    key={option}
                                    onClick={() => handleAction(() => onEdit(option.toLowerCase()))}
                                    className="w-full px-3 py-2 rounded-lg text-left text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                                >
                                    {option}
                                </button>
                            ))}

                            <div className="h-[1px] bg-white/10 my-1" />

                            <button
                                onClick={() => handleAction(onDeleteSelected)}
                                disabled={selectedCount === 0}
                                className="w-full px-3 py-2 rounded-lg text-left text-sm flex items-center gap-3 text-rose-400 hover:bg-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Delete Selected
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
