"use client"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Volume2, Search, RefreshCw, Sun, Moon, Minus, Plus, Music } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import DraggableSample from "@/components/DraggableSample"
import { extractBPMFromString } from "@/lib/utils"
import DragDropZone from "@/components/DragDropZone"
import { Skeleton } from "@/components/ui/skeleton"
import { mockSamples } from "@/lib/mockData"
import { blobToAudioBuffer, syncEngine } from "@/lib/syncEngine"
import { quickBPMDetection } from "@/lib/bpmDetection"

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
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
  const [editedBPM, setEditedBPM] = useState<number | null>(null) // User-edited BPM
  const [bpmInputValue, setBpmInputValue] = useState<string>("") // Temporary input value for typing
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const categories = ["All", "Kick & Snare", "Talking Drum", "Djembe", "Conga & Bongo", "Shekere & Cowbell", "Hi-Hat", "Bata", "Tom Fills", "Kpanlogo", "Clave", "Polyrhythms"]

  useEffect(() => {
    const loadData = async () => {
      // If we have recommendations from audio analysis, use those
      if (recommendationsParam) {
        try {
          const recommendations = JSON.parse(decodeURIComponent(recommendationsParam))
          
          // Get the detected BPM to use for all recommendation cards
          // Use edited BPM if available, otherwise fall back to detected BPM
          const universalBPM = editedBPM ?? (detectedBPM ? parseInt(detectedBPM) : null)
          
          // Set recorded BPM from URL params (for DraggableSample to use)
          if (detectedBPM) {
            const initialBPM = parseInt(detectedBPM)
            setRecordedBPM(initialBPM)
            setEditedBPM(initialBPM) // Initialize edited BPM
            setBpmInputValue(initialBPM.toString()) // Initialize input value
          }
          
          // Convert recommendations to sample format and limit to 10 results
          // ALL recommendations should show the edited/detected BPM, not their individual BPMs
          // But we store the actual BPM in originalBpm for tempo matching calculations
          const audioAnalysisSamples = recommendations.slice(0, 10).map((rec: any, index: number) => {
            const originalBpm = rec.bpm ?? extractBPMFromString(rec.filename) ?? extractBPMFromString(rec.url)
            return {
              id: `audio-analysis-${index}`,
              name: rec.filename.replace('Manifxtsounds - ', '').replace('.wav', ''),
              artist: 'Audio Analysis Match',
              category: 'audio-analysis',
              bpm: universalBPM, // Use edited/detected BPM for display
              originalBpm: originalBpm, // Store actual BPM for tempo matching
              key: rec.key,
              audioUrl: rec.url,
              imageUrl: '/placeholder.jpg',
              duration: '4 bars',
              tags: ['audio-analysis', 'matching-bpm', 'matching-key'],
              waveform: Array.from({ length: 50 }, () => Math.random() * 100) // Generate random waveform data
            }
          })
          
          // Add the recently played song as the first card
          const recentSong = {
            id: 'recent-song',
            name: 'YOUR AUDIO',
            artist: 'Recently Played',
            category: 'recording',
            bpm: universalBPM, // Use edited/detected BPM
            key: detectedKey || 'C',
            audioUrl: null, // Will use recordedAudioBuffer
            imageUrl: '/placeholder.jpg',
            duration: '4 bars',
            tags: ['recording', 'recent', 'your-audio'],
            waveform: Array.from({ length: 50 }, () => Math.random() * 100),
            isRecentSong: true
          }
          
          setSamples([recentSong, ...audioAnalysisSamples])
          
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

  // Update sample BPMs when editedBPM changes - this applies the BPM to ALL samples
  useEffect(() => {
    if (editedBPM !== null) {
      // Update all samples immediately with the new BPM
      setSamples(prevSamples => {
        // Only update if BPM actually changed to avoid unnecessary re-renders
        const needsUpdate = prevSamples.some(s => s.bpm !== editedBPM)
        if (!needsUpdate) return prevSamples
        
        return prevSamples.map(sample => ({
          ...sample,
          bpm: editedBPM
        }))
      })
      
      // Also update recordedBPM so playback uses the new BPM
      setRecordedBPM(editedBPM)
    }
  }, [editedBPM])

  // Helper function to apply BPM change (used when user types/edits)
  const applyBPMChange = (newBPM: number) => {
    // Clamp to valid range
    const clampedBPM = Math.max(50, Math.min(300, newBPM))
    setEditedBPM(clampedBPM)
    setBpmInputValue(clampedBPM.toString())
    // The useEffect above will handle updating all samples
  }

  const handlePlayPause = (sampleId: string) => {
    setCurrentlyPlaying(currentlyPlaying === sampleId ? null : sampleId)
  }

  const handleViewMore = async () => {
    const bpmToUse = editedBPM ?? recordedBPM
    if (!recordedAudioBuffer || isLoadingMore || !bpmToUse || !detectedKey) return
    
    setIsLoadingMore(true)
    
    try {
      // Load real metadata from local library
      const metadataResponse = await fetch('/audio/metadata.json')
      if (!metadataResponse.ok) {
        throw new Error('Failed to load audio metadata')
      }
      
      const allLoops: any[] = await metadataResponse.json()
      
      // Get already displayed sample URLs to exclude them
      const existingUrls = new Set(samples.map((s: any) => s.audioUrl).filter(Boolean))
      
      // Calculate compatibility scores for all loops (same algorithm as API)
      const calculateCompatibilityScore = (
        detectedBPM: number,
        detectedKey: string,
        loopBPM: number,
        loopKey: string,
        loopFilename: string
      ): number => {
        let totalScore = 0
        
        // 1. Musical Compatibility
        let musicalScore = 0
        if (detectedKey === loopKey) {
          musicalScore += 25
        } else {
          const harmonicRelationships: { [key: string]: { [relatedKey: string]: number } } = {
            'C': { 'Am': 35, 'F': 30, 'G': 32, 'Dm': 25, 'Em': 20 },
            'Am': { 'C': 35, 'F': 32, 'G': 28, 'Dm': 30, 'Em': 25 },
            'F': { 'C': 30, 'Am': 32, 'Dm': 35, 'Bb': 25, 'G': 20 },
            'G': { 'C': 32, 'Am': 28, 'Em': 35, 'D': 30, 'F': 20 },
            'Dm': { 'F': 35, 'Am': 30, 'Bb': 32, 'C': 25, 'G': 18 },
            'F#m': { 'A': 35, 'D': 32, 'E': 30, 'Bm': 25, 'C#m': 20 }
          }
          musicalScore += harmonicRelationships[detectedKey]?.[loopKey] || 10
        }
        
        const bpmRatio = loopBPM / detectedBPM
        if (bpmRatio >= 0.98 && bpmRatio <= 1.02) {
          musicalScore += 15
        } else if (bpmRatio >= 0.5 && bpmRatio <= 0.52 || bpmRatio >= 1.98 && bpmRatio <= 2.02) {
          musicalScore += 25
        } else if (Math.abs(detectedBPM - loopBPM) <= 5) {
          musicalScore += 18
        } else if (Math.abs(detectedBPM - loopBPM) <= 10) {
          musicalScore += 12
        } else {
          musicalScore += Math.max(0, 15 - Math.abs(detectedBPM - loopBPM) / 2)
        }
        
        totalScore += musicalScore
        
        // 2. Rhythmic Complexity
        const filename = loopFilename.toLowerCase()
        let rhythmScore = 0
        if (filename.includes('fill') || filename.includes('roll')) {
          rhythmScore += 20
        } else if (filename.includes('kick') || filename.includes('bass')) {
          rhythmScore += 25
        } else if (filename.includes('shaker') || filename.includes('hi') || filename.includes('perc')) {
          rhythmScore += 30
        } else if (filename.includes('full') || filename.includes('complete')) {
          rhythmScore += 15
        } else if (filename.includes('top') || filename.includes('melody')) {
          rhythmScore += 22
        }
        totalScore += rhythmScore
        
        // 3. Timbral Compatibility
        let timbreScore = 0
        if (filename.includes('manifxtsounds') || filename.includes('afrobeat')) {
          timbreScore += 15
        }
        if (filename.includes('kick') || filename.includes('bass') || filename.includes('low')) {
          timbreScore += 10
        } else if (filename.includes('hi') || filename.includes('cymbal') || filename.includes('shaker')) {
          timbreScore += 12
        } else if (filename.includes('mid') || filename.includes('tom') || filename.includes('snare')) {
          timbreScore += 8
        }
        totalScore += timbreScore
        
        // 4. Cultural/Stylistic Coherence
        let styleScore = 15
        if ((filename.includes('talking') && (detectedKey === 'Am' || detectedKey === 'Dm')) ||
            (filename.includes('djembe') && (detectedKey === 'F' || detectedKey === 'C')) ||
            (filename.includes('shekere') && filename.includes('perc'))) {
          styleScore += 10
        }
        totalScore += styleScore
        
        const finalScore = Math.min(100, totalScore)
        return finalScore >= 75 ? finalScore : 0
      }
      
      // Score all loops and filter out already shown ones
      const scoredLoops = allLoops
        .filter(loop => !existingUrls.has(loop.url)) // Exclude already shown
        .map(loop => ({
          ...loop,
          score: calculateCompatibilityScore(
            bpmToUse,
            detectedKey,
            loop.bpm,
            loop.key,
            loop.filename
          )
        }))
        .filter(loop => loop.score > 0) // Only compatible matches
        .sort((a, b) => b.score - a.score) // Sort by compatibility
      
      // Get top 5-10 additional matches
      const topMatches = scoredLoops.slice(0, 10)
      
      // Convert to sample format
      const universalBPMForAdditional = bpmToUse
      const additionalSamples = topMatches.map((loop, index) => {
        const originalBpm = loop.bpm
        return {
          id: `additional-${Date.now()}-${index}`,
          name: loop.filename.replace('Manifxtsounds - ', '').replace('.wav', ''),
          artist: 'Audio Library Match',
          category: loop.category?.toLowerCase() || 'matching',
          bpm: universalBPMForAdditional, // Use detected BPM for display
          originalBpm: originalBpm, // Store actual BPM for tempo matching
          key: loop.key,
          audioUrl: loop.url,
          imageUrl: '/placeholder.jpg',
          duration: '4 bars',
          tags: ['audio-library', 'matching-bpm', 'matching-key', loop.category?.toLowerCase() || ''],
          waveform: Array.from({ length: 50 }, () => Math.random() * 100)
        }
      })
      
      if (additionalSamples.length === 0) {
        console.warn('No additional compatible samples found')
        // Could show a message to user here
      }
      
      // Add new samples to existing ones
      setSamples(prevSamples => [...prevSamples, ...additionalSamples])
      
      console.log(`Loaded ${additionalSamples.length} additional compatible samples from local library`)
      
    } catch (error) {
      console.error('Error loading more samples from local library:', error)
    } finally {
      setIsLoadingMore(false)
    }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300">
        {/* VST-Style Header Skeleton */}
        <motion.header
          className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="w-9 h-9 rounded-lg" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 w-48 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        </motion.header>

        {/* Content Skeleton */}
        <div className="p-6">
          {/* Sync Playback Section Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-6 w-64 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <div>
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-9 w-24 rounded-lg" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-40" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Cards Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-8 h-8 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
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
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-green-600 dark:text-green-400" />
            </motion.button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent truncate">
                {recommendationsParam ? "Compatible Sounds" : (query || "Search Results")}
              </h1>
              {currentlyPlaying && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="inline-flex items-center text-green-600 dark:text-green-400">
                    <motion.div
                      className="w-2 h-2 bg-green-500 rounded-full mr-2"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                    />
                    Playing
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:gap-4">
            {/* Theme Toggle */}
            <motion.button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-blue-600" />
              )}
            </motion.button>
            
            {/* Search Filter */}
            <div className="relative order-1 lg:order-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter samples..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-48 text-sm"
              />
            </div>

            {/* Volume Control - Hidden on mobile, visible on tablet+ */}
            <div className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
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

            {/* Tempo Editor - FL Studio Style */}
            {editedBPM !== null && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-2 border border-gray-200 dark:border-gray-600 flex items-center space-x-2">
                <Music className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      const newBPM = Math.max(50, editedBPM - 1)
                      applyBPMChange(newBPM)
                    }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Decrease BPM"
                  >
                    <Minus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={bpmInputValue}
                    onChange={(e) => {
                      const input = e.target.value
                      // Allow empty string, numbers, and partial input
                      if (input === "" || /^\d*$/.test(input)) {
                        setBpmInputValue(input)
                        // If it's a valid number in range, apply it immediately
                        const numValue = parseInt(input)
                        if (!isNaN(numValue) && numValue >= 50 && numValue <= 300) {
                          applyBPMChange(numValue)
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value)
                      if (isNaN(value) || value < 50) {
                        applyBPMChange(50)
                      } else if (value > 300) {
                        applyBPMChange(300)
                      } else {
                        applyBPMChange(value)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur() // Trigger onBlur validation
                      }
                    }}
                    className="w-16 text-center bg-transparent border-none outline-none font-semibold text-green-600 dark:text-green-400 text-sm focus:ring-1 focus:ring-green-500 focus:bg-gray-50 dark:focus:bg-gray-700 rounded px-1"
                    title="Edit Tempo (50-300 BPM) - Type and press Enter"
                  />
                  <button
                    onClick={() => {
                      const newBPM = Math.min(300, editedBPM + 1)
                      applyBPMChange(newBPM)
                    }}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title="Increase BPM"
                  >
                    <Plus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 ml-1">BPM</div>
              </div>
            )}

            {/* Session Info - Responsive sizing */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-2 border border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-600 dark:text-gray-400">SESSION KEY</div>
              <div className="font-semibold text-green-600 dark:text-green-400 text-sm">{sessionKey}</div>
            </div>

          </div>
        </div>

      </motion.header>

      {/* Sample List - Row Layout */}
      <div className="p-3 sm:p-4 lg:p-6">

        <div className="space-y-2 sm:space-y-3">
          {filteredSamples.map((sample, index) => (
            <DraggableSample
              key={sample.id}
              sample={sample}
              isPlaying={currentlyPlaying === sample.id}
              onPlayPause={() => handlePlayPause(sample.id)}
              index={index}
              audioUrl={sample.audioUrl}
              recordedAudioBuffer={recordedAudioBuffer}
              recordedBPM={editedBPM ?? recordedBPM}
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

        {/* View More Button - Only show for AI-matched results */}
        {recommendationsParam && filteredSamples.length > 0 && (
          <motion.div 
            className="flex justify-center mt-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={handleViewMore}
              disabled={isLoadingMore || !recordedAudioBuffer}
              className={`px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                isLoadingMore || !recordedAudioBuffer
                  ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
              }`}
              whileHover={!isLoadingMore && recordedAudioBuffer ? { scale: 1.05 } : {}}
              whileTap={!isLoadingMore && recordedAudioBuffer ? { scale: 0.95 } : {}}
            >
              {isLoadingMore ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Finding More Sounds...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>View More Compatible Sounds</span>
                </>
              )}
            </motion.button>
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300">
          {/* Quick Loading Skeleton */}
          <div className="p-6">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-16 h-16 rounded-lg flex-shrink-0" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-48 mb-2" />
                      <Skeleton className="h-4 w-32 mb-2" />
                      <div className="flex items-center space-x-4">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  )
}
