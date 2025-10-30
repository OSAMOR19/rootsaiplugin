"use client"

import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface SessionKeyButtonProps {
  value: string
  onClick: () => void
}

export default function SessionKeyButton({ value, onClick }: SessionKeyButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 text-xs sm:text-sm"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate max-w-[60px] sm:max-w-none">{value}</span>
      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
    </motion.button>
  )
}
