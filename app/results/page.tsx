"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Volume2, Search } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import DraggableSample from "@/components/DraggableSample"
import DragDropZone from "@/components/DragDropZone"
import SyncPlayback from "@/components/SyncPlayback"
import { mockSamples } from "@/lib/mockData"
import { blobToAudioBuffer, detectBPM, syncEngine } from "@/lib/syncEngine"

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = searchParams.get("query") || ""
  const sessionKey = searchParams.get("key") || "F MAJOR"
  const detectedBPM = searchParams.get("bpm")
  const detectedKey = searchParams.get("detectedKey")
  const recommendationsParam = searchParams.get("recommendations")

  const [samples, setSamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [volume, setVolume] = useState(75)
  const [searchFilter, setSearchFilter] = useState("")
  const [recordedAudioBuffer, setRecordedAudioBuffer] = useState<AudioBuffer | null>(null)
  const [recordedBPM, setRecordedBPM] = useState<number | null>(null)
  const [syncMode, setSyncMode] = useState(true) // Default to sync mode for audio analysis results

  const categories = ["All", "Kick & Snare", "Talking Drum", "Djembe", "Conga & Bongo", "Shekere & Cowbell", "Hi-Hat", "Bata", "Tom Fills", "Kpanlogo", "Clave", "Polyrhythms"]

  useEffect(() => {
    const loadData = async () => {
      // If we have recommendations from audio analysis, use those
      if (recommendationsParam) {
        try {
          const recommendations = JSON.parse(decodeURIComponent(recommendationsParam))
          // Convert recommendations to sample format
          const audioAnalysisSamples = recommendations.map((rec: any, index: number) => ({
            id: `audio-analysis-${index}`,
            name: rec.filename.replace('Manifxtsounds - ', '').replace('.wav', ''),
            artist: 'Audio Analysis Match',
            category: 'audio-analysis',
            bpm: rec.bpm,
            key: rec.key,
            audioUrl: rec.url,
            imageUrl: '/placeholder.jpg',
            duration: '4 bars',
            tags: ['audio-analysis', 'matching-bpm', 'matching-key'],
            waveform: Array.from({ length: 50 }, () => Math.random() * 100) // Generate random waveform data
          }))
          setSamples(audioAnalysisSamples)
          
          // Set recorded BPM from URL params
          if (detectedBPM) {
            setRecordedBPM(parseInt(detectedBPM))
          }
          
          // Load recorded audio buffer from localStorage
          try {
            const audioDataStr = localStorage.getItem('recordedAudioData')
            
            if (audioDataStr) {
              const storedData = JSON.parse(audioDataStr)
              
              if (storedData.wavData) {
                console.log('Loading stored audio data:', {
                  sampleRate: storedData.sampleRate,
                  duration: storedData.duration,
                  numberOfChannels: storedData.numberOfChannels,
                  length: storedData.length
                })
                
                // Convert base64 back to blob
                const base64Data = storedData.wavData.split(',')[1]
                const binaryString = atob(base64Data)
                const bytes = new Uint8Array(binaryString.length)
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i)
                }
                const blob = new Blob([bytes], { type: 'audio/wav' })
                
                // Convert blob back to AudioBuffer
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const arrayBuffer = await blob.arrayBuffer()
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
                
                console.log('Reconstructed audio buffer:', {
                  duration: audioBuffer.duration,
                  sampleRate: audioBuffer.sampleRate,
                  numberOfChannels: audioBuffer.numberOfChannels,
                  length: audioBuffer.length
                })
                
                setRecordedAudioBuffer(audioBuffer)
              }
            }
          } catch (error) {
            console.error('Error loading recorded audio buffer:', error)
          }
        } catch (error) {
          console.error('Error parsing recommendations:', error)
          setSamples(mockSamples)
        }
      } else {
        // Fallback to mock samples for search-based results
        setSamples(mockSamples)
      }
      setLoading(false)
    }

    const timer = setTimeout(loadData, 1500)
    return () => clearTimeout(timer)
  }, [query, recommendationsParam, detectedBPM])

  const handlePlayPause = (sampleId: string) => {
    setCurrentlyPlaying(currentlyPlaying === sampleId ? null : sampleId)
  }

  const handleBack = () => {
    router.push("/")
  }

  const filteredSamples = samples.filter((sample) => {
    // First filter by search query
    const matchesSearch = 
      sample.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      sample.artist.toLowerCase().includes(searchFilter.toLowerCase())
    
    // Then filter by selected category
    if (selectedCategory === "all") {
      return matchesSearch
    }
    
    // Check if sample category matches selected category
    const matchesCategory = sample.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <motion.div
            className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
          <p className="text-lg text-green-600 dark:text-green-400 font-medium">Analyzing your track...</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Finding perfect Afrobeat drum loops</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300">
      {/* VST-Style Header */}
      <motion.header
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
            </motion.button>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                {recommendationsParam ? "Audio Analysis Results" : (query || "Search Results")}
              </h1>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {recommendationsParam ? (
                  <>
                    {filteredSamples.length} matching Afrobeat drum loops • Detected: {detectedBPM} BPM, {detectedKey} key
                    {currentlyPlaying && (
                      <span className="ml-2 inline-flex items-center text-green-600 dark:text-green-400">
                        <motion.div
                          className="w-2 h-2 bg-green-500 rounded-full mr-2"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                        />
                        Playing
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {filteredSamples.length} Afrobeat drum loops found • Drag to your DAW
                    {currentlyPlaying && (
                      <span className="ml-2 inline-flex items-center text-green-600 dark:text-green-400">
                        <motion.div
                          className="w-2 h-2 bg-green-500 rounded-full mr-2"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                        />
                        Playing
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter samples..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-48 text-sm"
              />
            </div>

            {/* Volume Control */}
            <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
              <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={(e) => setVolume(Number.parseInt(e.target.value))}
                className="w-20 h-1 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-xs text-gray-600 dark:text-gray-400 w-8">{volume}</span>
            </div>

            {/* Session Info */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-600 dark:text-gray-400">SESSION KEY</div>
              <div className="font-semibold text-green-600 dark:text-green-400">{sessionKey}</div>
            </div>

            {/* Sync Mode Toggle - Only show for audio analysis results */}
            {recommendationsParam && recordedAudioBuffer && (
              <motion.button
                onClick={() => setSyncMode(!syncMode)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                  syncMode
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Volume2 className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {syncMode ? 'Sync ON' : 'Sync OFF'}
                </span>
              </motion.button>
            )}
          </div>
        </div>

      </motion.header>

      {/* Sample List - Row Layout */}
      <div className="p-6">
        {/* Sync Playback Section for Audio Analysis Results */}
        {recommendationsParam && recordedBPM && samples.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Sync Playback - Perfect Tempo Match
            </h3>
            <div className="space-y-4">
              {samples.slice(0, 3).map((sample, index) => (
                <SyncPlayback
                  key={sample.id}
                  recordedAudioBuffer={recordedAudioBuffer}
                  recordedBPM={recordedBPM}
                  sampleUrl={sample.audioUrl}
                  sampleBPM={sample.bpm}
                  sampleName={sample.name}
                />
              ))}
            </div>
          </motion.div>
        )}

        <div className="space-y-3">
          {filteredSamples.map((sample, index) => (
            <DraggableSample
              key={sample.id}
              sample={sample}
              isPlaying={currentlyPlaying === sample.id}
              onPlayPause={() => handlePlayPause(sample.id)}
              index={index}
              audioUrl={sample.audioUrl}
              recordedAudioBuffer={recordedAudioBuffer}
              recordedBPM={recordedBPM}
              syncMode={recommendationsParam ? syncMode : false}
            />
          ))}
        </div>

        {filteredSamples.length === 0 && !loading && (
          <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="text-gray-400 dark:text-gray-500 mb-2">
              <Search className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No samples found</h3>
            <p className="text-gray-500 dark:text-gray-500">Try adjusting your search or category filter</p>
          </motion.div>
        )}
      </div>

      {/* Drag Drop Instructions */}
      <DragDropZone />
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-green-400/30 border-t-green-400 rounded-full mx-auto mb-4 animate-spin" />
            <p className="text-lg text-green-600 dark:text-green-400">Loading...</p>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
