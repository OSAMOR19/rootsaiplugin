import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabase"

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

export function useSamples(options: UseSamplesOptions = {}): UseSamplesResult {
  const { category, autoFetch = true } = options
  const [samples, setSamples] = useState<Sample[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSamples = async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('samples').select('*').order('created_at', { ascending: false })

      // Optional category filter at database level
      if (category) {
        // query = query.eq('category', category) 
        // Don't filter at DB level yet since category names might need normalization
      }

      const { data, error } = await query

      if (error) throw error

      if (data) {
        const mappedSamples: Sample[] = data.map((s: any) => ({
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
          storage: 'supabase', // Mark as supabase source
          moodTag: s.mood_tag || s.mood, // Try to find mood tag
        }))
        setSamples(mappedSamples)
      }
    } catch (err) {
      console.error("Failed to fetch samples:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch samples")
    } finally {
      setLoading(false)
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

  return { samples, loading, error, refetch: fetchSamples, filterByCategory }
}
