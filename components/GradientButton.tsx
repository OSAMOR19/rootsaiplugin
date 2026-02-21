"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface GradientButtonProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
}

export default function GradientButton({ children, onClick, disabled, className = "" }: GradientButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 
        text-white font-bold text-lg rounded-xl shadow-lg 
        hover:shadow-xl transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed
        overflow-hidden group
        ${className}
      `}
      whileHover={!disabled ? { scale: 1.05, y: -2 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      />

      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"
        initial={false}
      />

      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
