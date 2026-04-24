import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabase"

// Fisher-Yates shuffle — randomizes array order for a fresh, mixed feel
function shuffleSamples<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export interface Sample {
  id: string
  name: string
  filename: string
  bpm?: number
  key?: string
  category?: string
  audioUrl?: string
  url?: string // Support both formats
  imageUrl?: string
  duration?: string
  timeSignature?: string
  storage?: string
  uploadedAt?: string
  featured?: boolean
  genres?: string[]
  instruments?: string[]
  drumType?: string
  keywords?: string[]
  moodTag?: string
  stems?: {
    name: string
    url: string
    size?: number
    filename?: string
  }[]
}

export interface UseSamplesOptions {
  category?: string
  autoFetch?: boolean
}

export interface UseSamplesResult {
  samples: Sample[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  filterByCategory: (category: string) => Sample[]
}

// Global cache to prevent refetching during client-side navigation
const globalSamplesCache: Record<string, { data: Sample[], timestamp: number }> = {}
const globalFetchPromises: Record<string, Promise<Sample[]> | null> = {}

// Cache expiration: 15 minutes (longer TTL reduces DB calls and improves speed)
const CACHE_TTL = 15 * 60 * 1000

export function useSamples(options: UseSamplesOptions = {}): UseSamplesResult {
  const { category, autoFetch = true } = options
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSamples = async (forceRefetch = false) => {
    const cacheKey = category || 'all_samples'

    // 1. Check if we have valid cached data and we aren't forcing a refetch
    if (!forceRefetch && globalSamplesCache[cacheKey] && (Date.now() - globalSamplesCache[cacheKey].timestamp < CACHE_TTL)) {
      setSamples(globalSamplesCache[cacheKey].data)
      setLoading(false)
      setError(null)
      return
    }

    // 2. Check if a fetch is already in progress for this key (deduping)
    if (!forceRefetch && globalFetchPromises[cacheKey]) {
      setLoading(true)
      try {
        const data = await globalFetchPromises[cacheKey]!
        // Make sure component is still mounted before setting state? 
        // Not strictly necessary here since React 18 handles state on unmounted components gracefully,
        // but can be added. We'll simply set the state.
        setSamples(data)
        setError(null)
      } catch (err: any) {
        setError(err instanceof Error ? err.message : "Failed to fetch samples")
      } finally {
        setLoading(false)
      }
      return
    }

    // 3. Start a new fetch
    setLoading(true)
    setError(null)

    const fetchPromise = (async () => {
      // Supabase silently caps queries at 1,000 rows.
      // We paginate in batches of 1,000 until we get a partial page (= end of data).
      const PAGE_SIZE = 1000
      let allData: any[] = []
      let from = 0
      let keepFetching = true

      while (keepFetching) {
        let query = supabase
          .from('samples')
          .select('*')
          .order('created_at', { ascending: true })  // Oldest → Newest
          .range(from, from + PAGE_SIZE - 1)

        // Optional category filter
        if (category) {
          query = query.eq('category', category)
        }

        const { data, error } = await query
        if (error) throw error

        if (data && data.length > 0) {
          allData = allData.concat(data)
        }

        // If we got fewer rows than PAGE_SIZE, we've reached the end
        if (!data || data.length < PAGE_SIZE) {
          keepFetching = false
        } else {
          from += PAGE_SIZE
        }
      }

      const mappedSamples: Sample[] = allData.map((s: any) => ({
        id: s.id,
        name: s.name,
        filename: s.filename,
        bpm: s.bpm,
        key: s.key,
        category: s.category,
        audioUrl: s.audio_url,
        url: s.audio_url, // Alias for legacy support
        imageUrl: s.image_url,
        duration: s.duration,
        timeSignature: s.time_signature,
        uploadedAt: s.created_at,
        featured: s.is_featured,
        genres: s.genres || [],
        instruments: s.instruments || [],
        drumType: s.drum_type,
        keywords: s.keywords || [],
        storage: 'supabase',
        moodTag: s.mood_tag || s.mood,
        stems: s.stems || []
      }))

      // Shuffle for a mixed/random feel — no strict ordering
      const shuffledSamples = shuffleSamples(mappedSamples)

      // Update the cache
      globalSamplesCache[cacheKey] = {
        data: shuffledSamples,
        timestamp: Date.now()
      }

      return shuffledSamples
    })()

    // Store the promise in the global dictionary
    globalFetchPromises[cacheKey] = fetchPromise

    try {
      const mappedSamples = await fetchPromise
      setSamples(mappedSamples)
    } catch (err) {
      console.error("Failed to fetch samples:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch samples")
    } finally {
      setLoading(false)
      globalFetchPromises[cacheKey] = null
    }
  }

  const filterByCategory = (cat: string) => {
    return samples.filter(s => s.category?.toLowerCase() === cat.toLowerCase())
  }

  useEffect(() => {
    if (autoFetch) {
      fetchSamples()
    }
  }, [autoFetch, category])

  return { samples, loading, error, refetch: () => fetchSamples(true), filterByCategory }
}
