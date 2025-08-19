"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

interface SessionKeyModalProps {
  isOpen: boolean
  onClose: () => void
  value: string
  onChange: (value: string) => void
}

const keys = [
  { note: "C", major: "C Maj", minor: "A Min" },
  { note: "Db", major: "Db Maj", minor: "Bb Min" },
  { note: "D", major: "D Maj", minor: "B Min" },
  { note: "Eb", major: "Eb Maj", minor: "C Min" },
  { note: "E", major: "E Maj", minor: "Db Min" },
  { note: "F", major: "F Maj", minor: "D Min" },
  { note: "Gb", major: "Gb Maj", minor: "Eb Min" },
  { note: "G", major: "G Maj", minor: "E Min" },
  { note: "Ab", major: "Ab Maj", minor: "F Min" },
  { note: "A", major: "A Maj", minor: "Gb Min" },
  { note: "Bb", major: "Bb Maj", minor: "G Min" },
  { note: "B", major: "B Maj", minor: "Ab Min" },
]

export default function SessionKeyModal({ isOpen, onClose, value, onChange }: SessionKeyModalProps) {
  const [mode, setMode] = useState<"Major" | "Minor">("Major")

  const handleKeySelect = (key: string) => {
    const selectedKey = mode === "Major" ? `${key} MAJOR` : `${key} MINOR`
    onChange(selectedKey)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Session Key</h2>
              <motion.button
                onClick={onClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Current Selection */}
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-xs text-green-600 dark:text-green-400 mb-1">Current</p>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">{value}</p>
            </div>

            {/* Mode Toggle */}
            <div className="flex mb-4">
              <button
                onClick={() => setMode("Major")}
                className={`flex-1 py-2 px-3 rounded-l-lg text-sm font-medium transition-colors ${
                  mode === "Major"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Major
              </button>
              <button
                onClick={() => setMode("Minor")}
                className={`flex-1 py-2 px-3 rounded-r-lg text-sm font-medium transition-colors ${
                  mode === "Minor"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Minor
              </button>
            </div>

            {/* Key Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {keys.map((key) => {
                const isSelected = value.includes(key.note)

                return (
                  <motion.button
                    key={key.note}
                    onClick={() => handleKeySelect(key.note)}
                    className={`p-2 rounded-lg text-center transition-all duration-200 ${
                      isSelected
                        ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg"
                        : "bg-gray-50 dark:bg-gray-800 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-700 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-400 border border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-700"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="font-bold text-sm">{key.note}</div>
                    <div className="text-xs opacity-75">{mode === "Major" ? "Maj" : "Min"}</div>
                  </motion.button>
                )
              })}
            </div>

            {/* No Key Option */}
            <motion.button
              onClick={() => {
                onChange("NO KEY")
                onClose()
              }}
              className="w-full p-3 text-center bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">No Key</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">For drums or non-tonal audio</div>
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
