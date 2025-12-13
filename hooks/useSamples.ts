import { useState, useEffect } from 'react'

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
  energy?: number
  danceability?: number
  valence?: number
  moodTag?: string
  featured?: boolean
  artist?: string
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
  filterByMood: (mood: string) => Sample[]
  filterByBPM: (minBpm: number, maxBpm: number) => Sample[]
}

/**
 * Hook to fetch and manage samples from metadata.json
 * Works with both local and R2-stored samples
 */
export function useSamples(options: UseSamplesOptions = {}): UseSamplesResult {
  const { category, autoFetch = true } = options

  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSamples = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/audio/metadata.json')

      if (!response.ok) {
        throw new Error(`Failed to fetch samples: ${response.statusText}`)
      }

      const data = await response.json()

      // Normalize the data to ensure consistent format
      const normalizedSamples: Sample[] = data.map((item: any) => ({
        id: item.id || Math.random().toString(36).substr(2, 9),
        name: item.name || item.filename?.replace(/\.[^/.]+$/, '') || 'Untitled',
        filename: item.filename || '',
        bpm: item.bpm || 120,
        key: item.key || 'C',
        category: item.category || 'Uncategorized',
        audioUrl: item.audioUrl || item.url || '',
        imageUrl: item.imageUrl || '/placeholder.jpg',
        duration: item.duration || '0:00',
        timeSignature: item.timeSignature || '4/4',
        storage: item.storage || 'local',
        uploadedAt: item.uploadedAt,
        energy: item.energy,
        danceability: item.danceability,
        valence: item.valence,
        moodTag: item.moodTag,
        featured: item.featured,
        artist: item.artist,
      }))

      // Filter by category if specified
      const filtered = category
        ? normalizedSamples.filter(s => s.category === category)
        : normalizedSamples

      setSamples(filtered)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      console.error('Error fetching samples:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter functions
  const filterByCategory = (cat: string): Sample[] => {
    return samples.filter(s => s.category === cat)
  }

  const filterByMood = (mood: string): Sample[] => {
    return samples.filter(s => s.moodTag === mood)
  }

  const filterByBPM = (minBpm: number, maxBpm: number): Sample[] => {
    return samples.filter(s => s.bpm && s.bpm >= minBpm && s.bpm <= maxBpm)
  }

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchSamples()
    }
  }, [autoFetch, category])

  return {
    samples,
    loading,
    error,
    refetch: fetchSamples,
    filterByCategory,
    filterByMood,
    filterByBPM,
  }
}

