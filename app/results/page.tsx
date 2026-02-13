"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Volume2, Search, RefreshCw, Sun, Moon, Minus, Plus, Music, Heart, Filter } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTheme } from "next-themes"
import DraggableSample from "@/components/DraggableSample"
import { extractBPMFromString } from "@/lib/utils"
import DragDropZone from "@/components/DragDropZone"
import { Skeleton } from "@/components/ui/skeleton"
import { mockSamples } from "@/lib/mockData"
import { blobToAudioBuffer, syncEngine, loadAudioBuffer, setRecordedVolume as updateRecordedVolume, setSampleVolume as updateSampleVolume } from "@/lib/syncEngine"
import { quickBPMDetection } from "@/lib/bpmDetection"
import { shuffleArray } from "@/lib/searchUtils"
import { getFavoritesCount } from "@/lib/favorites"
import { useAudio } from "@/contexts/AudioContext"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { supabase } from "@/lib/supabase"
import PlayerBar from "@/components/PlayerBar"
import FilterSelect from "@/components/FilterSelect"
import { DRUM_TYPE_OPTIONS, INSTRUMENT_OPTIONS, GENRE_OPTIONS, KEYWORD_OPTIONS, KEY_OPTIONS } from "@/lib/constants"

function ResultsContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { theme, setTheme } = useTheme()
  const { analysisData } = useAudio()
  const query = searchParams.get("query") || ""
  const sessionKey = searchParams.get("key") || "F MAJOR"
  const detectedBPM = searchParams.get("bpm")
  const detectedKey = searchParams.get("detectedKey")
  const recommendationsParam = searchParams.get("recommendations")

  // Filter params from URL
  const urlLoopType = searchParams.get("loopType") || ""
  const urlInstrument = searchParams.get("instrument") || ""
  const urlGenre = searchParams.get("genre") || ""
  const urlKeyword = searchParams.get("keyword") || ""
  const urlKey = searchParams.get("filterKey") || ""
  const urlTimeSignature = searchParams.get("timeSignature") || ""

  const [samples, setSamples] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [volume, setVolume] = useState(75)
  const [recordedVolume, setRecordedVolume] = useState(50) // Volume for your recorded/uploaded audio
  const [sampleVolume, setSampleVolume] = useState(50) // Volume for the drum samples
  const [searchFilter, setSearchFilter] = useState("")
  const [recordedAudioBuffer, setRecordedAudioBuffer] = useState<AudioBuffer | null>(null)
  const [recordedBPM, setRecordedBPM] = useState<number | null>(null)
  const [originalDetectedBPM, setOriginalDetectedBPM] = useState<number | null>(null) // Store original detected BPM for tempo calculations
  const [editedBPM, setEditedBPM] = useState<number | null>(null) // User-edited BPM
  const [bpmInputValue, setBpmInputValue] = useState<string>("") // Temporary input value for typing
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [syncPlayingSampleId, setSyncPlayingSampleId] = useState<string | null>(null) // Track which sample is sync playing

  // Filter states
  const [selectedLoopType, setSelectedLoopType] = useState(urlLoopType)
  const [selectedInstrument, setSelectedInstrument] = useState(urlInstrument)
  const [selectedGenre, setSelectedGenre] = useState(urlGenre)
  const [selectedKeyword, setSelectedKeyword] = useState(urlKeyword)
  const [selectedFilterKey, setSelectedFilterKey] = useState(urlKey)
  const [selectedTimeSignature, setSelectedTimeSignature] = useState(urlTimeSignature)

  const categories = ["All", "Kick & Snare", "Talking Drum", "Djembe", "Conga & Bongo", "Shekere & Cowbell", "Hi-Hat", "Bata", "Tom Fills", "Kpanlogo", "Clave", "Polyrhythms"]

  // ✅ NEW: Load sounds from Supabase with Search Support
  const loadInitialCompatibleSounds = async (bpm: number | null, key: string, limit: number = 10, searchQuery: string = "") => {
    console.log('🔍 loadInitialCompatibleSounds CALLED:', { bpm, key, limit, searchQuery })

    // Allow if BPM exists OR if we are searching (text query)
    if (!bpm && !searchQuery) {
      console.error('❌ NO BPM and NO Query - returning empty array')
      return []
    }

    try {
      console.log('📂 Fetching broader sample set (limit 200) from Supabase...')

      // Simply fetch recent samples
      // We do filtering in memory to avoid complex OR logic issues with the client
      const { data: allLoops, error } = await supabase
        .from('samples')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300)

      if (error) {
        console.error('❌ Could not load samples from Supabase:', error)
        return []
      }

      console.log('✅ Loaded samples from DB:', allLoops?.length, 'loops')

      // ✅ Filter out invalid entries (no filename/fileName and no url/audioUrl)
      const validLoops = (allLoops || []).filter(loop => {
        const hasFileName = !!(loop.filename || loop.name)
        const hasAudioUrl = !!(loop.url || loop.audio_url)
        return hasFileName && hasAudioUrl
      })

      console.log('✅ Valid loops (with filename & URL):', validLoops.length)

      // === IMPROVED SEARCH ALGORITHM ===

      // Synonym mapping for common drum/music terms
      const synonymMap: { [key: string]: string[] } = {
        'hihat': ['hi-hat', 'hi hat', 'hh', 'hats', 'hat'],
        'hi-hat': ['hihat', 'hi hat', 'hh', 'hats', 'hat'],
        'kick': ['bass drum', 'bd', 'kick drum', 'bass'],
        'snare': ['sd', 'snare drum'],
        'percussion': ['perc', 'percs', 'percussive'],
        'perc': ['percussion', 'percussive'],
        'shaker': ['shakers', 'shake'],
        'afrobeat': ['afro', 'afrobeats', 'african'],
        'afro': ['afrobeat', 'afrobeats', 'african'],
        'energetic': ['energy', 'upbeat', 'fast', 'dynamic', 'powerful'],
        'chill': ['mellow', 'relaxed', 'calm', 'soft', 'slow'],
        'fast': ['quick', 'speedy', 'upbeat', 'energetic'],
        'slow': ['chill', 'mellow', 'relaxed'],
        'talking drum': ['talking', 'talkingdrum'],
        'djembe': ['djembes', 'jembe'],
        'conga': ['congas', 'congo'],
        'bongo': ['bongos'],
        'cowbell': ['cowbells', 'bell'],
        'clap': ['claps', 'handclap'],
        'tom': ['toms', 'tom-tom'],
        'fill': ['fills', 'drum fill'],
        'loop': ['loops', 'sample', 'pattern'],
      }

      // Extract BPM from search query (e.g., "120 bpm afrobeat" -> 120)
      const extractBPMFromQuery = (query: string): number | null => {
        // Match patterns like "120 bpm", "120bpm", "bpm 120", "bpm120", "at 120", "tempo 120"
        const bpmPatterns = [
          /(\d{2,3})\s*bpm/i,
          /bpm\s*(\d{2,3})/i,
          /at\s+(\d{2,3})/i,
          /tempo\s*(\d{2,3})/i,
          /(\d{2,3})\s*tempo/i,
        ]

        for (const pattern of bpmPatterns) {
          const match = query.match(pattern)
          if (match) {
            const bpm = parseInt(match[1])
            if (bpm >= 60 && bpm <= 200) return bpm
          }
        }
        return null
      }

      // Fuzzy match function - checks if query term matches with variations
      const fuzzyMatch = (searchTerm: string, targetText: string): { matched: boolean; score: number } => {
        const lowerTarget = targetText.toLowerCase()
        const lowerSearch = searchTerm.toLowerCase()

        // Exact match = highest score
        if (lowerTarget.includes(lowerSearch)) {
          return { matched: true, score: 20 }
        }

        // Check synonyms
        const synonyms = synonymMap[lowerSearch] || []
        for (const synonym of synonyms) {
          if (lowerTarget.includes(synonym)) {
            return { matched: true, score: 15 }
          }
        }

        // Partial match (at least 3 chars matching)
        if (lowerSearch.length >= 3 && lowerTarget.includes(lowerSearch.substring(0, 3))) {
          return { matched: true, score: 8 }
        }

        // Word start match
        const words = lowerTarget.split(/[\s\-_]+/)
        for (const word of words) {
          if (word.startsWith(lowerSearch) || lowerSearch.startsWith(word)) {
            return { matched: true, score: 10 }
          }
        }

        return { matched: false, score: 0 }
      }

      // Extract query BPM if present
      const queryBPM = searchQuery ? extractBPMFromQuery(searchQuery) : null
      const effectiveBPM = queryBPM || bpm

      // Calculate compatibility scores (same algorithm as handleViewMore)
      const scoredLoops = validLoops.map((loop: any) => {
        // ✅ Handle both 'filename' and 'fileName' fields
        const fileName = loop.filename || loop.name || ''
        const loopBPM = loop.bpm ?? extractBPMFromString(fileName) ?? 120

        // ✅ Handle both string keys ("C", "Am") and object keys ({ tonic: "C", scale: "major" })
        let loopKey = 'C'
        if (typeof loop.key === 'string') {
          loopKey = loop.key
        } else if (loop.key?.tonic) {
          loopKey = loop.key.tonic
        }

        let score = 0

        // Text Search Scoring (Enhanced keyword-based)
        if (searchQuery) {
          const lowerName = fileName.toLowerCase() || ''
          const lowerCat = (loop.category || '').toLowerCase()
          const loopGenres = (loop.genres || []).map((g: string) => g.toLowerCase())
          const loopKeywords = (loop.keywords || []).map((k: string) => k.toLowerCase())

          // Combine all searchable text
          const allSearchableText = `${lowerName} ${lowerCat} ${loopGenres.join(' ')} ${loopKeywords.join(' ')}`

          // Improved stop words list
          const stopWords = ['i', 'need', 'a', 'want', 'the', 'of', 'for', 'with', 'sound', 'loop', 'sample', 'drums', 'drum', 'beat', 'me', 'get', 'find', 'show', 'please', 'some', 'give', 'looking', 'like', 'that', 'and', 'or', 'is', 'are', 'have', 'has']

          // Remove BPM references from query for keyword extraction
          const cleanedQuery = searchQuery.toLowerCase()
            .replace(/\d{2,3}\s*bpm/gi, '')
            .replace(/bpm\s*\d{2,3}/gi, '')
            .replace(/tempo\s*\d{2,3}/gi, '')
            .replace(/at\s+\d{2,3}/gi, '')

          const keywords = cleanedQuery
            .replace(/[^\w\s-]/g, ' ')
            .split(/\s+/)
            .filter(w => w.length > 2 && !stopWords.includes(w))

          if (keywords.length > 0) {
            let totalMatchScore = 0
            let matchCount = 0

            keywords.forEach(keyword => {
              // Try fuzzy match against all searchable content
              const nameMatch = fuzzyMatch(keyword, lowerName)
              const catMatch = fuzzyMatch(keyword, lowerCat)

              // Best match from genres
              let bestGenreMatch = { matched: false, score: 0 }
              for (const genre of loopGenres) {
                const match = fuzzyMatch(keyword, genre)
                if (match.score > bestGenreMatch.score) bestGenreMatch = match
              }

              // Best match from keywords
              let bestKeywordMatch = { matched: false, score: 0 }
              for (const kw of loopKeywords) {
                const match = fuzzyMatch(keyword, kw)
                if (match.score > bestKeywordMatch.score) bestKeywordMatch = match
              }

              // Use the best match score
              const bestScore = Math.max(nameMatch.score, catMatch.score, bestGenreMatch.score, bestKeywordMatch.score)
              if (bestScore > 0) {
                totalMatchScore += bestScore
                matchCount++
              }
            })

            // Boost score based on match quality
            if (matchCount > 0) {
              // Base score of 40 + match quality bonus
              score += 40 + totalMatchScore

              // Bonus for matching multiple keywords (relevance boost)
              if (matchCount >= 2) score += 15
              if (matchCount >= 3) score += 10

              // Bonus if ALL keywords matched
              if (matchCount === keywords.length) score += 20
            }
          } else if (searchQuery.trim().length > 0) {
            // Fallback: simple substring match for short queries
            const lowerQuery = searchQuery.toLowerCase().trim()
            const simpleMatch = fuzzyMatch(lowerQuery, allSearchableText)
            if (simpleMatch.matched) {
              score += 30 + simpleMatch.score
            }
          }
        }

        // BPM matching (use query BPM if specified, otherwise detected BPM)
        if (effectiveBPM) {
          const bpmRatio = loopBPM / effectiveBPM
          if (bpmRatio >= 0.98 && bpmRatio <= 1.02) {
            score += 45 // Exact match is very important
          } else if (Math.abs(effectiveBPM - loopBPM) <= 5) {
            score += 35
          } else if (Math.abs(effectiveBPM - loopBPM) <= 10) {
            score += 25
          } else if (Math.abs(effectiveBPM - loopBPM) <= 15) {
            score += 15
          }
        }

        // Key matching
        if (key === loopKey) {
          score += 25
        }

        // Rhythmic complexity bonus
        const fileNameLower = fileName.toLowerCase()
        if (fileNameLower.includes('kick') || fileNameLower.includes('bass')) {
          score += 15
        } else if (fileNameLower.includes('perc') || fileNameLower.includes('shaker')) {
          score += 20
        }

        return { loop, score }
      })

      // Log scoring results
      const sortedScores = [...scoredLoops].sort((a, b) => b.score - a.score)
      console.log('🎯 Scoring results:', {
        totalLoops: validLoops.length,
        scoredLoops: scoredLoops.length,
        topScores: sortedScores.slice(0, 10).map(l => {
          const fileName = l.loop.filename || l.loop.name
          return { name: fileName, score: l.score, bpm: l.loop.bpm, key: l.loop.key }
        }),
        lowestScore: sortedScores[sortedScores.length - 1]?.score || 0,
        highestScore: sortedScores[0]?.score || 0
      })

      // Sort by compatibility score and take top N
      const topLoops = scoredLoops
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item: any, index: number) => {
          // ✅ Handle both 'filename' and 'fileName' fields
          const fileName = item.loop.filename || item.loop.name || 'Unknown'
          const originalBpm = item.loop.bpm ?? extractBPMFromString(fileName)
          const audioUrl = item.loop.url || item.loop.audio_url

          // ✅ Handle both string keys and object keys
          let loopKey = key
          if (typeof item.loop.key === 'string') {
            loopKey = item.loop.key
          } else if (item.loop.key?.tonic) {
            loopKey = item.loop.key.tonic
          }

          return {
            id: item.loop.id || `compatible-${index}`,
            name: fileName.replace('Manifxtsounds - ', '').replace('Manifxtsounds___', '').replace('.wav', ''),
            artist: item.loop.category || 'Compatible Match', // Use category if no artist
            category: item.loop.category || 'audio-analysis',
            bpm: bpm,
            originalBpm: originalBpm,
            key: loopKey,
            audioUrl: audioUrl,
            imageUrl: item.loop.image_url || item.loop.imageUrl || '/placeholder.jpg', // Try both snake_case and camelCase
            duration: '4 bars', // This might need update if we have duration
            tags: ['compatible', 'matching-bpm'],
            waveform: Array.from({ length: 50 }, () => Math.random() * 100),
            compatibilityScore: item.score
          }
        })

      console.log(`✅ Loaded ${topLoops.length} initial compatible sounds`)
      return topLoops
    } catch (error) {
      console.error('Error loading initial compatible sounds:', error)
      return []
    }
  }

  useEffect(() => {
    const loadData = async () => {
      console.log('🎬 Results page loading data...')
      console.log('📦 URL params:', { recommendationsParam: !!recommendationsParam, detectedBPM, detectedKey, query })

      if (query) {
        setLoading(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      if (recommendationsParam || query) {
        try {
          const recommendations = recommendationsParam ? JSON.parse(decodeURIComponent(recommendationsParam)) : []

          // Get the detected BPM to use for all recommendation cards
          // Use edited BPM if available, otherwise fall back to detected BPM
          const universalBPM = editedBPM ?? (detectedBPM ? parseInt(detectedBPM) : null)

          console.log('🎵 Calculated universalBPM:', universalBPM, 'from editedBPM:', editedBPM, 'detectedBPM:', detectedBPM)

          // Set recorded BPM from URL params (for DraggableSample to use)
          if (detectedBPM) {
            const initialBPM = parseInt(detectedBPM)
            console.log('✅ Setting BPM states to:', initialBPM)
            setRecordedBPM(initialBPM)
            setOriginalDetectedBPM(initialBPM) // Store original detected BPM
            setEditedBPM(initialBPM) // Initialize edited BPM
            setBpmInputValue(initialBPM.toString()) // Initialize input value
          } else {
            console.error('❌ NO detectedBPM in URL params!')
          }

          // ✅ NEW: Load REAL compatible sounds from local library immediately!
          console.log('📞 Calling loadInitialCompatibleSounds with BPM:', universalBPM, 'Query:', query)
          const initialCompatibleSounds = await loadInitialCompatibleSounds(universalBPM, detectedKey || 'C', 10, query)

          let finalSamples = [...initialCompatibleSounds]

          // Only add "Your Audio" card if we actually have a detected BPM (audio analysis)
          if (detectedBPM) {
            const recentSong = {
              id: 'recent-song',
              name: 'YOUR AUDIO',
              artist: 'Recently Played',
              category: 'recording',
              bpm: universalBPM, // Use edited/detected BPM
              key: detectedKey || 'C',
              audioUrl: null, // Will use recordedAudioBuffer
              imageUrl: '/placeholder.jpg', // Placeholder for user recording
              duration: '4 bars',
              tags: ['recording', 'recent', 'your-audio'],
              waveform: Array.from({ length: 50 }, () => Math.random() * 100),
              isRecentSong: true,
              originalBpm: universalBPM,
              compatibilityScore: 100
            }
            finalSamples = [recentSong, ...finalSamples]
            console.log('🎸 Added Your Audio card (Audio Mode)')
          }

          console.log('🎯 Got initialCompatibleSounds:', initialCompatibleSounds.length, 'sounds')
          console.log('📋 Setting samples to:', finalSamples.length, 'total samples')

          // 🎲 Dynamic Result Variation - Shuffle for unpredictable AI feel
          // BUT: Keep "YOUR AUDIO" at the top if it exists
          let samplesToSet = finalSamples

          if (detectedBPM && finalSamples.length > 1) {
            // YOUR AUDIO is at index 0, shuffle only the rest
            const yourAudio = finalSamples[0]
            const otherSamples = finalSamples.slice(1)
            const sessionSeed = Date.now() % 10000
            const shuffledOthers = shuffleArray(otherSamples, sessionSeed)
            samplesToSet = [yourAudio, ...shuffledOthers]
            console.log('✨ Shuffled recommendations (keeping YOUR AUDIO first)')
          } else if (!detectedBPM && finalSamples.length > 0) {
            // No audio uploaded, shuffle all samples
            const sessionSeed = Date.now() % 10000
            samplesToSet = shuffleArray(finalSamples, sessionSeed)
            console.log('✨ Shuffled all results for AI variation')
          }

          setSamples(samplesToSet)

          // ✅ NEW: Load audio buffer from React Context (NOT localStorage!)
          try {
            if (analysisData?.recordedAudioBuffer) {
              console.log('✅ Loading audio buffer from React Context:', {
                duration: analysisData.recordedAudioBuffer.duration,
                sampleRate: analysisData.recordedAudioBuffer.sampleRate,
                numberOfChannels: analysisData.recordedAudioBuffer.numberOfChannels,
                length: analysisData.recordedAudioBuffer.length
              })
              setRecordedAudioBuffer(analysisData.recordedAudioBuffer)
            } else {
              console.warn('⚠️ No audio buffer found in React Context')
            }
          } catch (error) {
            console.error('Error loading audio buffer from context:', error)
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

    // ✅ FIX: Load compatible sounds IMMEDIATELY (no delay!)
    loadData()
  }, [query, recommendationsParam, detectedBPM, analysisData])

  // Load favorites count and listen for updates
  useEffect(() => {
    const updateFavoritesCount = () => {
      setFavoritesCount(getFavoritesCount())
    }

    updateFavoritesCount()
    window.addEventListener('favoritesUpdated', updateFavoritesCount)

    return () => {
      window.removeEventListener('favoritesUpdated', updateFavoritesCount)
    }
  }, [])

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

  // ✅ Handle sync play (play captured audio + sample together)
  const handleSyncPlay = async (sampleId: string, sampleBPM: number, sampleUrl: string) => {
    if (syncPlayingSampleId === sampleId) {
      // Stop sync playback for the same sample
      syncEngine.stopAll()
      setSyncPlayingSampleId(null)
      setCurrentlyPlaying(null)

      toast({
        title: "Sync Stopped",
        description: "Playback has been stopped.",
        duration: 2000,
      })
    } else {
      // ✅ FIXED: Auto-stop previous sync when clicking a new one
      if (syncPlayingSampleId) {
        // Stop the current sync playback first
        syncEngine.stopAll()
        setSyncPlayingSampleId(null)
        setCurrentlyPlaying(null)
        console.log('🔄 Stopped previous sync, starting new one...')
      }

      // Start sync playback
      if (!recordedAudioBuffer || !recordedBPM) {
        console.warn('No recorded audio or BPM for sync playback')
        toast({
          title: "No Audio to Sync",
          description: "Please record or upload audio first.",
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      try {
        // Stop any currently playing audio
        syncEngine.stopAll()
        setCurrentlyPlaying(null)

        // Load sample audio
        const sampleBuffer = await loadAudioBuffer(sampleUrl)

        // ✅ FIXED: Start sync playback with looping enabled
        await syncEngine.syncPlay(
          recordedAudioBuffer,
          sampleBuffer,
          sampleBPM,
          {
            recordedBPM: recordedBPM,
            recordedVolume: recordedVolume / 100, // Convert 0-100 to 0-1
            sampleVolume: sampleVolume / 100, // Convert 0-100 to 0-1
            loop: true // ✅ Enable looping
          }
        )

        setSyncPlayingSampleId(sampleId)
        console.log(`✅ Sync playing: Your audio + ${sampleId}`)

        toast({
          title: "Synced! 🎧",
          description: "Your audio is now playing with the drum sample (looping).",
          duration: 2000,
        })
      } catch (error) {
        console.error('Error in sync playback:', error)
        toast({
          title: "Sync Failed",
          description: "Could not sync the audio. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    }
  }

  const handleViewMore = async () => {
    const bpmToUse = editedBPM ?? recordedBPM
    // For text search, we don't need recordedAudioBuffer or detectedKey
    if ((!recordedAudioBuffer && !query) || isLoadingMore || (!bpmToUse && !query)) return

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
        detectedBPM: number | null,
        detectedKey: string | null,
        loopBPM: number,
        loopKey: string,
        loopFilename: string,
        loopCategory: string,
        loopGenres: string[] = [],
        loopKeywords: string[] = []
      ): number => {
        let totalScore = 0

        // 0. Text Search Scoring (if query exists)
        if (query) {
          const lowerName = loopFilename.toLowerCase()
          const lowerCat = loopCategory.toLowerCase()
          const lGenres = loopGenres.map(g => g.toLowerCase())
          const lKeywords = loopKeywords.map(k => k.toLowerCase())
          const lowerQuery = query.toLowerCase()

          if (lowerName.includes(lowerQuery) || lowerCat.includes(lowerQuery) || lGenres.some(g => g.includes(lowerQuery)) || lKeywords.some(k => k.includes(lowerQuery))) {
            totalScore += 50
          }
        }

        if (detectedBPM && detectedKey) {
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
        }

        const finalScore = Math.min(100, totalScore)
        return finalScore >= (query ? 30 : 75) ? finalScore : 0 // Lower threshold for search results
      }

      // Score all loops and filter out already shown ones
      const scoredLoops = allLoops
        .filter(loop => {
          const loopUrl = loop.url || loop.audioUrl
          return !existingUrls.has(loopUrl)
        })
        .map(loop => {
          // ✅ Handle both 'filename' and 'fileName' fields
          const fileName = loop.filename || loop.fileName || loop.name || ''

          // ✅ Handle both string keys and object keys
          let loopKey = 'C'
          if (typeof loop.key === 'string') {
            loopKey = loop.key
          } else if (loop.key?.tonic) {
            loopKey = loop.key.tonic
          }

          return {
            ...loop,
            score: calculateCompatibilityScore(
              bpmToUse,
              detectedKey,
              loop.bpm,
              loopKey,
              fileName,
              loop.category || '',
              loop.genres,
              loop.keywords
            )
          }
        })
        .filter(loop => loop.score > 0) // Only compatible matches
        .sort((a, b) => b.score - a.score) // Sort by compatibility

      // Get top 5-10 additional matches
      const topMatches = scoredLoops.slice(0, 10)

      // Convert to sample format
      const universalBPMForAdditional = bpmToUse
      const additionalSamples = topMatches.map((loop, index) => {
        // ✅ Handle both 'filename' and 'fileName' fields
        const fileName = loop.filename || loop.fileName || loop.name || 'Unknown'
        const audioUrl = loop.url || loop.audioUrl
        const originalBpm = loop.bpm

        // ✅ Handle both string keys and object keys
        let loopKey = detectedKey
        if (typeof loop.key === 'string') {
          loopKey = loop.key
        } else if (loop.key?.tonic) {
          loopKey = loop.key.tonic
        }

        return {
          id: `additional-${Date.now()}-${index}`,
          name: fileName.replace('Manifxtsounds - ', '').replace('Manifxtsounds___', '').replace('.wav', ''),
          artist: 'Audio Library Match',
          category: loop.category?.toLowerCase() || 'matching',
          bpm: universalBPMForAdditional, // Use detected BPM for display
          originalBpm: originalBpm, // Store actual BPM for tempo matching
          key: loopKey,
          audioUrl: audioUrl,
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

  // Comprehensive filtering logic
  const filteredSamples = useMemo(() => {
    return samples.filter((sample) => {
      // Search filter
      if (searchFilter) {
        const matchesSearch =
          sample.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
          sample.artist?.toLowerCase().includes(searchFilter.toLowerCase())
        if (!matchesSearch) return false
      }

      // Loop Type filter
      if (selectedLoopType && sample.drumType !== selectedLoopType) return false

      // Instrument filter
      if (selectedInstrument && !sample.instruments?.includes(selectedInstrument)) return false

      // Genre filter
      if (selectedGenre && !sample.genres?.includes(selectedGenre)) return false

      // Keyword/Style filter
      if (selectedKeyword && !sample.keywords?.includes(selectedKeyword)) return false

      // Key filter
      if (selectedFilterKey && sample.key !== selectedFilterKey) return false

      // Time Signature filter
      if (selectedTimeSignature && sample.timeSignature !== selectedTimeSignature) return false

      // Legacy category filter (keep for backwards compatibility)
      if (selectedCategory !== "all") {
        const matchesCategory = sample.category === selectedCategory
        if (!matchesCategory) return false
      }

      return true
    })
  }, [samples, searchFilter, selectedLoopType, selectedInstrument, selectedGenre, selectedKeyword, selectedFilterKey, selectedTimeSignature, selectedCategory])

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
            {/* Favorites Button */}
            <motion.button
              onClick={() => router.push('/favorites')}
              className="relative p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="View Favorites"
            >
              <Heart className="w-5 h-5 text-red-500 fill-current" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </motion.button>

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

            {/* Search Filter Removed */}

            {/* Dual Volume Controls - For Sync Playback */}
            {syncPlayingSampleId && (
              <div className="hidden lg:flex items-center gap-3 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg px-4 py-2 border-2 border-blue-200 dark:border-blue-700">
                {/* Your Audio Volume */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Music className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">You</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={recordedVolume}
                    onChange={(e) => {
                      const newVol = Number.parseInt(e.target.value);
                      setRecordedVolume(newVol);
                      // Update volume in real-time if playing
                      if (syncPlayingSampleId) {
                        updateRecordedVolume(newVol / 100);
                      }
                    }}
                    className="w-16 h-1.5 bg-blue-200 dark:bg-blue-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    title="Your audio volume"
                  />
                  <span className="text-xs text-blue-600 dark:text-blue-400 w-7 font-semibold">{recordedVolume}</span>
                </div>

                {/* Divider */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

                {/* Sample Volume */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">Loop</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sampleVolume}
                    onChange={(e) => {
                      const newVol = Number.parseInt(e.target.value);
                      setSampleVolume(newVol);
                      // Update volume in real-time if playing
                      if (syncPlayingSampleId) {
                        updateSampleVolume(newVol / 100);
                      }
                    }}
                    className="w-16 h-1.5 bg-green-200 dark:bg-green-800 rounded-lg appearance-none cursor-pointer accent-green-600"
                    title="Drum loop volume"
                  />
                  <span className="text-xs text-green-600 dark:text-green-400 w-7 font-semibold">{sampleVolume}</span>
                </div>
              </div>
            )}

            {/* Regular Volume Control - When not sync playing */}
            {!syncPlayingSampleId && (
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
            )}

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
            {/* Session Info - Responsive sizing */}
            {/* <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-2 sm:px-3 py-2 border border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-600 dark:text-gray-400">SESSION KEY</div>
              <div className="font-semibold text-green-600 dark:text-green-400 text-sm">{sessionKey}</div>
            </div> */}

          </div>
        </div>

      </motion.header>

      {/* Filter Navigation Bar - Sticky */}
      <div className="sticky top-[72px] z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md pb-4 pt-4 px-6 border-b border-gray-200 dark:border-white/10 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
          <input
            type="text"
            placeholder="Search in results..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-green-500 dark:focus:border-white/30 transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Loop Type"
            value={selectedLoopType}
            onChange={setSelectedLoopType}
            options={DRUM_TYPE_OPTIONS}
          />
          <FilterSelect
            label="African Instruments"
            value={selectedInstrument}
            onChange={setSelectedInstrument}
            options={INSTRUMENT_OPTIONS}
          />
          <FilterSelect
            label="Genres"
            value={selectedGenre}
            onChange={setSelectedGenre}
            options={GENRE_OPTIONS}
          />
          <FilterSelect
            label="Styles"
            value={selectedKeyword}
            onChange={setSelectedKeyword}
            options={KEYWORD_OPTIONS}
          />
          <FilterSelect
            label="Key"
            value={selectedFilterKey}
            onChange={setSelectedFilterKey}
            options={KEY_OPTIONS}
          />
          <FilterSelect
            label="Time Sig"
            value={selectedTimeSignature}
            onChange={setSelectedTimeSignature}
            options={['4/4', '3/4', '6/8', '5/4', '7/8']}
          />

          {/* Reset Button */}
          {(selectedLoopType || selectedInstrument || selectedGenre || selectedKeyword || selectedFilterKey || selectedTimeSignature || searchFilter) && (
            <button
              onClick={() => {
                setSearchFilter("")
                setSelectedLoopType("")
                setSelectedInstrument("")
                setSelectedGenre("")
                setSelectedKeyword("")
                setSelectedFilterKey("")
                setSelectedTimeSignature("")
              }}
              className="px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Active Filter Tags */}
        {(selectedLoopType || selectedInstrument || selectedGenre || selectedKeyword || selectedFilterKey || selectedTimeSignature) && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs text-gray-500 dark:text-white/40">Active filters:</span>
            {selectedLoopType && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded text-xs">
                {selectedLoopType}
              </span>
            )}
            {selectedInstrument && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-xs">
                {selectedInstrument}
              </span>
            )}
            {selectedGenre && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded text-xs">
                {selectedGenre}
              </span>
            )}
            {selectedKeyword && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 rounded text-xs">
                {selectedKeyword}
              </span>
            )}
            {selectedFilterKey && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded text-xs">
                {selectedFilterKey}
              </span>
            )}
            {selectedTimeSignature && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded text-xs">
                {selectedTimeSignature}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Mobile Volume Controls - Show only when sync playing */}
      {syncPlayingSampleId && (
        <motion.div
          className="lg:hidden bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 border-b-2 border-blue-200 dark:border-blue-700 p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col space-y-3 max-w-md mx-auto">
            {/* Your Audio Volume */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[80px]">
                <Music className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Your Audio</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={recordedVolume}
                onChange={(e) => {
                  const newVol = Number.parseInt(e.target.value);
                  setRecordedVolume(newVol);
                  if (syncPlayingSampleId) {
                    updateRecordedVolume(newVol / 100);
                  }
                }}
                className="flex-1 h-2 bg-blue-200 dark:bg-blue-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                title="Your audio volume"
              />
              <span className="text-sm text-blue-600 dark:text-blue-400 w-10 font-semibold text-right">{recordedVolume}%</span>
            </div>

            {/* Sample Volume */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 min-w-[80px]">
                <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Drum Loop</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sampleVolume}
                onChange={(e) => {
                  const newVol = Number.parseInt(e.target.value);
                  setSampleVolume(newVol);
                  if (syncPlayingSampleId) {
                    updateSampleVolume(newVol / 100);
                  }
                }}
                className="flex-1 h-2 bg-green-200 dark:bg-green-800 rounded-lg appearance-none cursor-pointer accent-green-600"
                title="Drum loop volume"
              />
              <span className="text-sm text-green-600 dark:text-green-400 w-10 font-semibold text-right">{sampleVolume}%</span>
            </div>
          </div>
        </motion.div>
      )}

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
              isSyncPlaying={syncPlayingSampleId === sample.id}
              onSyncPlay={() => handleSyncPlay(sample.id, sample.originalBpm || sample.bpm, sample.audioUrl)}
              audioUrl={sample.audioUrl}
              recordedAudioBuffer={recordedAudioBuffer}
              recordedBPM={editedBPM ?? recordedBPM}
              originalDetectedBPM={originalDetectedBPM}
              volume={(syncPlayingSampleId ? sampleVolume : volume) / 100}
              showCheckbox={false}
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

        {/* View More Button - Only show for AI-matched results or text search results */}
        {(recommendationsParam || query) && filteredSamples.length > 0 && (
          <motion.div
            className="flex justify-center mt-8 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={handleViewMore}
              disabled={isLoadingMore || (!recordedAudioBuffer && !query)}
              className={`px-8 py-3 rounded-full font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${isLoadingMore || (!recordedAudioBuffer && !query)
                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105"
                }`}
              whileHover={!isLoadingMore && (recordedAudioBuffer || query) ? { scale: 1.05 } : {}}
              whileTap={!isLoadingMore && (recordedAudioBuffer || query) ? { scale: 0.95 } : {}}
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

      {/* Toast Notifications */}
      <Toaster />
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
      <div className="relative pb-24">
        <ResultsContent />
        <PlayerBar />
      </div>
    </Suspense>
  )
}
