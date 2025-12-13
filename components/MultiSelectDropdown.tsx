"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check, Search, X } from "lucide-react"

interface MultiSelectDropdownProps {
    options: string[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export default function MultiSelectDropdown({
    options,
    selected,
    onChange,
    placeholder = "Select...",
    disabled = false,
    className = ""
}: MultiSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
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

    const toggleOption = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter(item => item !== option))
        } else {
            onChange([...selected, option])
        }
    }

    const removeOption = (option: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(selected.filter(item => item !== option))
    }

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-left flex items-center justify-between transition-all duration-200 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/5 hover:border-white/20"
                    } ${isOpen ? "border-green-500/50 bg-white/5" : ""}`}
            >
                <div className="flex flex-wrap gap-2 flex-1 min-w-0">
                    {selected.length > 0 ? (
                        selected.map(item => (
                            <span
                                key={item}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/10 rounded text-xs text-white"
                            >
                                {item}
                                <button
                                    onClick={(e) => removeOption(item, e)}
                                    className="hover:text-rose-400 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))
                    ) : (
                        <span className="text-white/40">{placeholder}</span>
                    )}
                </div>
                <ChevronDown
                    className={`w-4 h-4 text-white/40 transition-transform duration-200 ml-2 flex-shrink-0 ${isOpen ? "transform rotate-180" : ""
                        }`}
                />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-80 flex flex-col backdrop-blur-xl"
                    >
                        <div className="p-2 border-b border-white/10">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search..."
                                    className="w-full pl-9 pr-4 py-2 bg-white/5 rounded-lg text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/10 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>

                        <div className="overflow-y-auto p-1 flex-1 custom-scrollbar">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => toggleOption(option)}
                                        className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between transition-colors ${selected.includes(option)
                                            ? "bg-green-500/20 text-green-400"
                                            : "text-white/80 hover:bg-white/10 hover:text-white"
                                            }`}
                                    >
                                        <span className="truncate">{option}</span>
                                        {selected.includes(option) && <Check className="w-4 h-4" />}
                                    </button>
                                ))
                            ) : (
                                <div className="p-4 text-center text-white/40 text-sm">
                                    No options found
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
