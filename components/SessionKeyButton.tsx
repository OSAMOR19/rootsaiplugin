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
      className="flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="font-semibold text-gray-800">{value}</span>
      <ChevronDown className="w-4 h-4 text-gray-600" />
    </motion.button>
  )
}
