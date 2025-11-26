"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, Music, Lock, CheckCircle, XCircle, Trash2, Play, Pause, Image as ImageIcon, Plus, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import CustomDropdown from "@/components/CustomDropdown"

interface UploadedBeat {
  id: string
  file: File
  imageFile?: File
  imagePreview?: string
  name: string
  bpm?: number
  timeSignature?: string
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

const timeSignatures = [
  '4/4', '3/4', '6/8', '12/8', '2/4', '5/4', '7/8', '9/8'
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

  const handleImageUpload = (beatId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const previewUrl = URL.createObjectURL(file)

      setUploads(prev => prev.map(beat =>
        beat.id === beatId ? { ...beat, imageFile: file, imagePreview: previewUrl } : beat
      ))
    }
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
        if (beat.imageFile) {
          formData.append('image', beat.imageFile)
        }
        formData.append('name', beat.name)
        formData.append('category', beat.category || 'Full Drums')
        if (beat.bpm) formData.append('bpm', beat.bpm.toString())
        if (beat.timeSignature) formData.append('timeSignature', beat.timeSignature)

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
          timeSignature: result.timeSignature || beat.timeSignature
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
      <div className="min-h-screen bg-black flex items-center justify-center p-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-green-900/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px]" />
        </div>

        <motion.div
          className="max-w-md w-full bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 p-8 shadow-2xl relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Access</h1>
            <p className="text-white/40">Enter password to manage your library</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 bg-black/40 border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:border-green-500/50 transition-colors text-center tracking-widest"
                placeholder="••••••••"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full px-6 py-4 bg-white text-black hover:bg-green-400 transition-colors rounded-xl font-bold text-lg"
            >
              Unlock Dashboard
            </button>
          </form>

          <button
            onClick={() => router.push('/')}
            className="w-full mt-4 text-sm text-white/40 hover:text-white transition-colors"
          >
            Back to Home
          </button>
        </motion.div>
      </div>
    )
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-900/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all border border-white/10"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-green-100 to-green-200 bg-clip-text text-transparent">
                Upload sounds
              </h1>
              <p className="text-white/40 mt-2">
                Add new sounds to the Roots library
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/browse')}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-all border border-white/10"
            >
              View Library
            </button>
            <button
              onClick={handleUploadAll}
              disabled={isUploading || uploads.length === 0 || uploads.every(b => b.status === 'complete')}
              className="px-8 py-3 bg-white text-black hover:bg-green-400 disabled:bg-white/10 disabled:text-white/40 rounded-xl font-bold transition-all shadow-lg shadow-white/5"
            >
              {isUploading ? 'Uploading...' : `Publish ${uploads.length > 0 ? `(${uploads.length})` : ''}`}
            </button>
          </div>
        </header>

        {/* Upload Zone */}
        <motion.div
          className={`mb-12 p-16 rounded-3xl border-2 border-dashed transition-all duration-300 ${isDragging
            ? 'border-green-500 bg-green-500/10 scale-[1.01]'
            : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-center max-w-lg mx-auto">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/5">
              <Upload className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-3xl font-bold text-white mb-4">
              Drag & Drop Audio Files
            </h3>
            <p className="text-white/40 mb-8 text-lg">
              Support for WAV, MP3, AIFF. High quality preferred.
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
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black hover:bg-green-400 rounded-xl font-bold transition-all cursor-pointer text-lg"
            >
              <Plus className="w-5 h-5" />
              Browse Files
            </label>
          </div>
        </motion.div>

        {/* Uploads List */}
        <AnimatePresence>
          {uploads.length > 0 && (
            <div className="grid gap-4">
              {uploads.map((beat) => (
                <motion.div
                  key={beat.id}
                  className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex items-center gap-6 group hover:bg-white/10 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  {/* Image Upload / Preview */}
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      id={`image-${beat.id}`}
                      className="hidden"
                      onChange={(e) => handleImageUpload(beat.id, e)}
                      disabled={beat.status === 'analyzing' || beat.status === 'complete'}
                    />
                    <label
                      htmlFor={`image-${beat.id}`}
                      className={`w-full h-full rounded-xl flex items-center justify-center overflow-hidden cursor-pointer border border-white/10 transition-all ${beat.imagePreview ? '' : 'bg-black/40 hover:bg-white/10'}`}
                    >
                      {beat.imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={beat.imagePreview} alt="Art" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-white/20 group-hover:text-white/60">
                          <ImageIcon className="w-6 h-6" />
                          <span className="text-[10px] font-medium">Add Art</span>
                        </div>
                      )}

                      {/* Overlay for changing image */}
                      {beat.imagePreview && beat.status !== 'complete' && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ImageIcon className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Beat Info Inputs */}
                  <div className="flex-1 grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={beat.name}
                        onChange={(e) => updateBeat(beat.id, { name: e.target.value })}
                        className="w-full bg-transparent border-none text-white font-medium text-lg focus:ring-0 p-0 placeholder-white/20"
                        placeholder="Track Name"
                        disabled={beat.status === 'analyzing' || beat.status === 'complete'}
                      />
                      <p className="text-xs text-white/40 mt-1">{beat.file.name}</p>
                    </div>

                    <div className="col-span-2">
                      <CustomDropdown
                        options={categories}
                        value={beat.category}
                        onChange={(value) => updateBeat(beat.id, { category: value })}
                        placeholder="Category"
                        disabled={beat.status === 'analyzing' || beat.status === 'complete'}
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        value={beat.bpm || ''}
                        onChange={(e) => updateBeat(beat.id, { bpm: parseInt(e.target.value) })}
                        placeholder="BPM"
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-green-500/50 transition-colors"
                        disabled={beat.status === 'analyzing' || beat.status === 'complete'}
                      />
                    </div>

                    <div className="col-span-2">
                      <CustomDropdown
                        options={timeSignatures}
                        value={beat.timeSignature}
                        onChange={(value) => updateBeat(beat.id, { timeSignature: value })}
                        placeholder="Time Sig"
                        disabled={beat.status === 'analyzing' || beat.status === 'complete'}
                      />
                    </div>

                    {/* Status & Actions */}
                    <div className="col-span-2 flex items-center justify-end gap-3">
                      {beat.status === 'complete' && <CheckCircle className="w-6 h-6 text-green-400" />}
                      {beat.status === 'error' && <XCircle className="w-6 h-6 text-rose-400" />}
                      {beat.status === 'analyzing' && <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />}

                      <button
                        onClick={() => removeBeat(beat.id)}
                        className="p-2 text-white/20 hover:text-rose-400 transition-colors"
                        disabled={beat.status === 'analyzing'}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
