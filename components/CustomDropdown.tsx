"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Check } from "lucide-react"

interface CustomDropdownProps {
    options: string[]
    value?: string
    onChange: (value: string) => void
    placeholder?: string
    disabled?: boolean
    className?: string
}

export default function CustomDropdown({
    options,
    value,
    onChange,
    placeholder = "Select...",
    disabled = false,
    className = ""
}: CustomDropdownProps) {
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

    const handleSelect = (option: string) => {
        onChange(option)
        setIsOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-left flex items-center justify-between transition-all duration-200 ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/5 hover:border-white/20"
                    } ${isOpen ? "border-green-500/50 bg-white/5" : ""}`}
                disabled={disabled}
            >
                <span className={`block truncate ${value ? "text-white" : "text-white/40"}`}>
                    {value || placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""
                        }`}
                />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto backdrop-blur-xl"
                    >
                        <div className="p-1">
                            {options.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => handleSelect(option)}
                                    className={`w-full px-3 py-2 rounded-lg text-left text-sm flex items-center justify-between transition-colors ${value === option
                                            ? "bg-green-500/20 text-green-400"
                                            : "text-white/80 hover:bg-white/10 hover:text-white"
                                        }`}
                                >
                                    <span className="truncate">{option}</span>
                                    {value === option && <Check className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
