"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Music, Lock, CheckCircle, XCircle, Trash2, Play, Pause } from "lucide-react"
import { useRouter } from "next/navigation"

interface UploadedBeat {
  id: string
  file: File
  name: string
  bpm?: number
  key?: string
  category?: string
  status: 'pending' | 'analyzing' | 'complete' | 'error'
  error?: string
}

const categories = [
  'Full Drums',
  'Top Loops',
  'Kick Loops',
  'Shaker Loops',
  'Fills & Rolls',
  'Percussions'
]

const musicalKeys = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
  'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'
]

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [uploads, setUploads] = useState<UploadedBeat[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Simple password check (In production, use proper authentication!)
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "rootsai2024"

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
    } else {
      alert("Incorrect password!")
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files).filter(file =>
      file.type.startsWith('audio/')
    )

    processFiles(files)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      processFiles(files)
    }
  }

  const processFiles = (files: File[]) => {
    const newUploads: UploadedBeat[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      status: 'pending'
    }))

    setUploads(prev => [...prev, ...newUploads])
  }

  const updateBeat = (id: string, updates: Partial<UploadedBeat>) => {
    setUploads(prev => prev.map(beat =>
      beat.id === id ? { ...beat, ...updates } : beat
    ))
  }

  const removeBeat = (id: string) => {
    setUploads(prev => prev.filter(beat => beat.id !== id))
  }

  const handleUploadAll = async () => {
    setIsUploading(true)

    for (const beat of uploads) {
      if (beat.status === 'complete') continue

      try {
        updateBeat(beat.id, { status: 'analyzing' })

        const formData = new FormData()
        formData.append('audio', beat.file)
        formData.append('name', beat.name)
        formData.append('category', beat.category || 'Full Drums')
        if (beat.bpm) formData.append('bpm', beat.bpm.toString())
        if (beat.key) formData.append('key', beat.key)

        const response = await fetch('/api/admin/upload-beat', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const result = await response.json()
        updateBeat(beat.id, {
          status: 'complete',
          bpm: result.bpm || beat.bpm,
          key: result.key || beat.key
        })

      } catch (error) {
        updateBeat(beat.id, {
          status: 'error',
          error: 'Upload failed. Please try again.'
        })
      }
    }

    setIsUploading(false)
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex items-center justify-center p-8">
        <motion.div
          className="max-w-md w-full bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-8 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-white/60">Enter password to manage samples</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-emerald-500/30"
            >
              Login
            </button>
          </form>

          <button
            onClick={() => router.push('/')}
            className="w-full mt-4 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl font-medium transition-all duration-300"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
                Sample Manager
              </h1>
              <p className="text-sm text-white/60 mt-1">
                Upload and manage your sample library
              </p>
            </div>

            <button
              onClick={() => router.push('/browse')}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-300 border border-white/10"
            >
              View Library
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Upload Zone */}
        <motion.div
          className={`mb-8 p-12 rounded-2xl border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-white/20 bg-white/5'
          } backdrop-blur-2xl`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Drop your samples here
            </h3>
            <p className="text-white/60 mb-6">
              or click to browse • WAV, MP3, M4A supported
            </p>

            <input
              type="file"
              multiple
              accept="audio/*"
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-emerald-500/30 cursor-pointer"
            >
              <Music className="w-5 h-5 inline mr-2" />
              Select Files
            </label>
          </div>
        </motion.div>

        {/* Uploads List */}
        {uploads.length > 0 && (
          <motion.div
            className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Uploaded Beats ({uploads.length})
              </h2>

              <button
                onClick={handleUploadAll}
                disabled={isUploading || uploads.every(b => b.status === 'complete')}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-white/10 disabled:text-white/40 text-white rounded-xl font-medium transition-all duration-300 shadow-lg shadow-emerald-500/30"
              >
                {isUploading ? 'Uploading...' : 'Upload All'}
              </button>
            </div>

            <div className="space-y-4">
              {uploads.map((beat) => (
                <motion.div
                  key={beat.id}
                  className="bg-white/5 rounded-xl border border-white/10 p-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="flex items-start gap-6">
                    {/* Status Indicator */}
                    <div className="flex-shrink-0">
                      {beat.status === 'complete' && (
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                      )}
                      {beat.status === 'error' && (
                        <XCircle className="w-8 h-8 text-rose-400" />
                      )}
                      {beat.status === 'analyzing' && (
                        <div className="w-8 h-8 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      {beat.status === 'pending' && (
                        <Upload className="w-8 h-8 text-white/40" />
                      )}
                    </div>

                    {/* Beat Info */}
                    <div className="flex-1 grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-xs text-white/60 mb-1 block">Name</label>
                        <input
                          type="text"
                          value={beat.name}
                          onChange={(e) => updateBeat(beat.id, { name: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          disabled={beat.status === 'analyzing' || beat.status === 'complete'}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white/60 mb-1 block">BPM</label>
                        <input
                          type="number"
                          value={beat.bpm || ''}
                          onChange={(e) => updateBeat(beat.id, { bpm: parseInt(e.target.value) })}
                          placeholder="Auto-detect"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          disabled={beat.status === 'analyzing' || beat.status === 'complete'}
                        />
                      </div>

                      <div>
                        <label className="text-xs text-white/60 mb-1 block">Key</label>
                        <select
                          value={beat.key || ''}
                          onChange={(e) => updateBeat(beat.id, { key: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          disabled={beat.status === 'analyzing' || beat.status === 'complete'}
                        >
                          <option value="">Auto-detect</option>
                          {musicalKeys.map(key => (
                            <option key={key} value={key}>{key}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-white/60 mb-1 block">Category</label>
                        <select
                          value={beat.category || ''}
                          onChange={(e) => updateBeat(beat.id, { category: e.target.value })}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                          disabled={beat.status === 'analyzing' || beat.status === 'complete'}
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => removeBeat(beat.id)}
                        className="p-2 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                        disabled={beat.status === 'analyzing'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {beat.error && (
                    <p className="mt-3 text-sm text-rose-400">{beat.error}</p>
                  )}

                  {beat.status === 'complete' && (
                    <p className="mt-3 text-sm text-emerald-400">✓ Successfully uploaded and added to library</p>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Stats */}
        {uploads.length > 0 && (
          <motion.div
            className="mt-8 grid grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 p-6">
              <p className="text-white/60 text-sm mb-1">Total Uploads</p>
              <p className="text-3xl font-bold text-white">{uploads.length}</p>
            </div>
            <div className="bg-emerald-500/10 backdrop-blur-2xl rounded-2xl border border-emerald-500/30 p-6">
              <p className="text-emerald-300 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-emerald-400">
                {uploads.filter(b => b.status === 'complete').length}
              </p>
            </div>
            <div className="bg-blue-500/10 backdrop-blur-2xl rounded-2xl border border-blue-500/30 p-6">
              <p className="text-blue-300 text-sm mb-1">Pending</p>
              <p className="text-3xl font-bold text-blue-400">
                {uploads.filter(b => b.status === 'pending' || b.status === 'analyzing').length}
              </p>
            </div>
            <div className="bg-rose-500/10 backdrop-blur-2xl rounded-2xl border border-rose-500/30 p-6">
              <p className="text-rose-300 text-sm mb-1">Errors</p>
              <p className="text-3xl font-bold text-rose-400">
                {uploads.filter(b => b.status === 'error').length}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
