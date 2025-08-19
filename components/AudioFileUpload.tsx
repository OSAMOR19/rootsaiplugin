"use client"

import { useState, useRef } from 'react'
import { Upload, Music, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface AudioFileUploadProps {
  onAudioFileSelect: (audioUrl: string, fileName: string) => void
  className?: string
}

export default function AudioFileUpload({ onAudioFileSelect, className = '' }: AudioFileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; url: string }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    Array.from(files).forEach(file => {
      if (file.type.startsWith('audio/')) {
        const audioUrl = URL.createObjectURL(file)
        const fileName = file.name.replace(/\.[^/.]+$/, '') // Remove extension
        
        setUploadedFiles(prev => [...prev, { name: fileName, url: audioUrl }])
        onAudioFileSelect(audioUrl, fileName)
      }
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeFile = (index: number) => {
    const file = uploadedFiles[index]
    URL.revokeObjectURL(file.url) // Clean up the object URL
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* File Upload Area */}
      <motion.div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-green-400 dark:hover:border-green-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
        
        <div className="space-y-2">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Drag and drop audio files here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-green-600 dark:text-green-400 hover:underline font-medium"
              >
                browse
              </button>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Supports MP3, WAV, FLAC, and other audio formats
            </p>
          </div>
        </div>
      </motion.div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Uploaded Audio Files
          </h3>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={file.url}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <Music className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {file.name}
                  </span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
