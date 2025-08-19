"use client"

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Music } from 'lucide-react'
import { motion } from 'framer-motion'

interface AudioLoop {
  id: string
  filename: string
  displayName: string
  category: string
  bpm: number
  duration: string
}

export default function LoopPlayer() {
  const [loops, setLoops] = useState<AudioLoop[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [loadingAudio, setLoadingAudio] = useState<string | null>(null)
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({})

  // Your actual audio files from public/audio folder
  const audioFiles = [
    // Full Drum Loops - using your real files
    { path: "Full Drums/Manifxtsounds - Scata Drum Loop 120BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - Mood Drum Loop 102BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - Cold Riddim Drum Loop 98BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - Palazzo Drum Loop 116BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - Alcohol Drum Loop 100BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - Essence Drum Loop 104BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - PBUY Drum Loop 116BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - High Drum Loop 116BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - Champion Drum Loop 113BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - Squid Drum Loop 115BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - B Riddim Drum Loop 116BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - Bounce Drum Loop 98BPM.wav", category: "Full Drums" },
    { path: "Full Drums/Manifxtsounds - Bada Drum Loop 116BPM.wav", category: "Full Drums" }
  ]

  // Initialize loops data
  useEffect(() => {
    const loopsData: AudioLoop[] = audioFiles.map((file, index) => {
      const filename = file.path.split('/').pop() || ''
      const displayName = filename
        .replace(/Manifxtsounds - /, '')
        .replace(/\.wav$/, '')
        .replace(/\d+BPM$/, '')
        .trim()
      
      // Extract BPM from filename
      const bpmMatch = filename.match(/(\d+)BPM/)
      const bpm = bpmMatch ? parseInt(bpmMatch[1]) : 120
      
      return {
        id: `loop-${index}`,
        filename: file.path,
        displayName,
        category: file.category,
        bpm,
        duration: '0:32' // Default duration, could be extracted from audio metadata
      }
    })
    setLoops(loopsData)
  }, [])

  const handlePlayPause = async (loopId: string) => {
    const audioElement = audioRefs.current[loopId]
    
    if (!audioElement) {
      console.error('Audio element not found for:', loopId)
      return
    }

    try {
      if (currentlyPlaying === loopId) {
        // Pause current loop
        audioElement.pause()
        setCurrentlyPlaying(null)
        console.log('Paused audio:', loopId)
      } else {
        // Stop any currently playing audio
        Object.values(audioRefs.current).forEach(audio => {
          if (audio && audio !== audioElement) {
            audio.pause()
            audio.currentTime = 0
          }
        })
        
        // Simple play - no complex loading checks
        await audioElement.play()
        setCurrentlyPlaying(loopId)
        console.log('Playing audio:', loopId, audioElement.src)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
      alert(`Error playing audio: ${error}`)
    }
  }

  const handleAudioEnded = (loopId: string) => {
    setCurrentlyPlaying(null)
  }

  const handleAudioRef = (loopId: string, element: HTMLAudioElement | null) => {
    audioRefs.current[loopId] = element
    
    if (element) {
      element.loop = true
      element.addEventListener('ended', () => handleAudioEnded(loopId))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Loop Player
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Play audio loops from your local collection
          </p>
        </div>

        {/* Loops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loops.map((loop, index) => (
            <motion.div
              key={loop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <Music className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                      {loop.displayName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {loop.category}
                    </p>
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="space-y-4">
                  {/* Custom Audio Player */}
                  <div className="flex items-center space-x-3">
                                         <motion.button
                       onClick={() => handlePlayPause(loop.id)}
                       disabled={loadingAudio === loop.id}
                       className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                         currentlyPlaying === loop.id
                           ? "bg-red-500 text-white shadow-lg"
                           : loadingAudio === loop.id
                           ? "bg-yellow-500 text-white shadow-lg"
                           : "bg-green-500 text-white hover:bg-green-600 shadow-md"
                       }`}
                       whileHover={{ scale: loadingAudio === loop.id ? 1 : 1.05 }}
                       whileTap={{ scale: loadingAudio === loop.id ? 1 : 0.95 }}
                     >
                       {currentlyPlaying === loop.id ? (
                         <Pause className="w-5 h-5" />
                       ) : loadingAudio === loop.id ? (
                         <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <Play className="w-5 h-5 ml-0.5" />
                       )}
                     </motion.button>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-mono">{loop.bpm} BPM</span>
                        <span>•</span>
                        <span className="font-mono">{loop.duration}</span>
                      </div>
                    </div>
                  </div>

                                     {/* Hidden Audio Element */}
                   <audio
                     ref={(element) => handleAudioRef(loop.id, element)}
                     src={`/audio/${loop.filename}`}
                     preload="auto"
                     className="hidden"
                     onError={(e) => console.error('Audio loading error for:', loop.filename, e)}
                     onLoadStart={() => console.log('Loading audio:', loop.filename)}
                     onCanPlay={() => console.log('Audio can play:', loop.filename)}
                     onPlay={() => console.log('Audio started playing:', loop.filename)}
                   />

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ 
                        width: currentlyPlaying === loop.id ? "100%" : "0%" 
                      }}
                      transition={{
                        duration: currentlyPlaying === loop.id ? 8 : 0.3,
                        ease: "linear",
                        repeat: currentlyPlaying === loop.id ? Number.POSITIVE_INFINITY : 0
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {loop.filename}
                  </span>
                  <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                    <Volume2 className="w-4 h-4" />
                    <span>Loop</span>
                  </div>
                </div>
              </div>

              {/* Playing Indicator */}
              {currentlyPlaying === loop.id && (
                <motion.div
                  className="absolute inset-0 border-2 border-green-500 rounded-xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to Use
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
            <li>• Click the play button to start a loop</li>
            <li>• Loops will automatically repeat</li>
            <li>• Only one loop can play at a time</li>
            <li>• Audio files are loaded from /public/audio/ directory</li>
            <li>• Each loop shows BPM and duration information</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
