"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface SessionKeyDropdownProps {
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

export default function SessionKeyDropdown({ value, onChange }: SessionKeyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<"Major" | "Minor">("Major")

  const handleKeySelect = (key: string) => {
    const selectedKey = mode === "Major" ? `${key} MAJOR` : `${key} MINOR`
    onChange(selectedKey)
    setIsOpen(false)
  }

  return (
    <div className="relative z-50">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="font-semibold text-gray-800">{value}</span>
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              className="absolute top-full mt-2 right-0 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-200 p-4 z-50 min-w-[320px]"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Mode Toggle */}
              <div className="flex mb-4">
                <button
                  onClick={() => setMode("Major")}
                  className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                    mode === "Major" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Major
                </button>
                <button
                  onClick={() => setMode("Minor")}
                  className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                    mode === "Minor" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Minor
                </button>
              </div>

              {/* Key Grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {keys.map((key) => {
                  const keyValue = mode === "Major" ? key.major : key.minor
                  const isSelected = value.includes(key.note)

                  return (
                    <motion.button
                      key={key.note}
                      onClick={() => handleKeySelect(key.note)}
                      className={`p-3 rounded-lg text-center transition-all duration-200 ${
                        isSelected
                          ? "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg"
                          : "bg-gray-50 hover:bg-green-50 text-gray-700 hover:text-green-700"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="font-bold text-lg">{key.note}</div>
                      <div className="text-xs opacity-75">{mode === "Major" ? "Maj" : "Min"}</div>
                    </motion.button>
                  )
                })}
              </div>

              {/* No Key Option */}
              <motion.button
                onClick={() => {
                  onChange("NO KEY")
                  setIsOpen(false)
                }}
                className="w-full p-3 text-center bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="font-semibold">No Key</div>
                <div className="text-xs text-gray-600">Use when analyzing drums or non-tonal audio</div>
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
