"use client"

import { motion } from "framer-motion"
import { Search } from "lucide-react"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  onEnter?: () => void
}

export default function SearchInput({ value, onChange, placeholder, disabled, onEnter }: SearchInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Trigger search on Ctrl/Cmd + Enter
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onEnter?.();
    }
  };
  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <motion.textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-12 pr-4 py-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 resize-none h-32 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100"
          whileFocus={{ scale: 1.02 }}
        />
      </div>

      {/* Animated border */}
      <motion.div
        className="absolute inset-0 rounded-xl border-2 border-green-400 opacity-0 pointer-events-none"
        animate={value ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Keyboard shortcut hint */}
      {value && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -bottom-6 right-0 text-xs text-gray-400 dark:text-gray-500"
        >
          Press Ctrl+Enter to search
        </motion.div>
      )}
    </motion.div>
  )
}
