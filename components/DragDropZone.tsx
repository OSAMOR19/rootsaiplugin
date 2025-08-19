"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { Upload, Music } from "lucide-react"
import { useState } from "react"

export default function DragDropZone() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    setShowInstructions(false)

    // Handle the dropped sample
    const sampleData = e.dataTransfer.getData("application/json")
    if (sampleData) {
      const sample = JSON.parse(sampleData)
      console.log("Sample dropped:", sample)
      // Here you would integrate with DAW APIs
    }
  }

  return (
    <AnimatePresence>
      {showInstructions && (
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ delay: 2 }}
        >
          <div
            className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-xl p-4 border-2 transition-all duration-300 ${
              isDragOver
                ? "border-green-500 bg-green-50/90 dark:bg-green-900/20 shadow-2xl scale-105"
                : "border-gray-200 dark:border-gray-700 shadow-lg"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-lg transition-colors ${
                  isDragOver
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {isDragOver ? <Upload className="w-5 h-5" /> : <Music className="w-5 h-5" />}
              </div>
              <div>
                <p
                  className={`font-medium transition-colors ${
                    isDragOver ? "text-green-700 dark:text-green-300" : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {isDragOver ? "Drop sample here!" : "Drag samples to your DAW"}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {isDragOver ? "Release to add to project" : "Click and drag any sample"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 rounded-full flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 transition-colors"
            >
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
