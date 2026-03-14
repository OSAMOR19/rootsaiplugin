import { supabase } from './supabase'

export interface FavoriteSample {
  id: string
  name: string
  artist?: string
  category?: string
  bpm?: number
  key?: string
  audioUrl?: string
  imageUrl?: string
  duration?: string
  tags?: string[]
  waveform?: number[]
  originalBpm?: number
  timestamp?: number
}

/**
 * Helper to dispatch window events safely
 */
const notifyUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('favoritesUpdated'))
  }
}

/**
 * Get all favorites from Supabase for the authenticated user
 */
export async function getFavorites(): Promise<FavoriteSample[]> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return [] // Unauthenticated users have no favorites

    const { data, error } = await supabase
      .from('favorites')
      .select('sample_data')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    // Extract the JSON payload back into the FavoriteSample format
    return data.map(row => row.sample_data as FavoriteSample)
  } catch (error) {
    console.error('Error fetching favorites from Supabase:', error)
    return []
  }
}

/**
 * Check if a sample is favorited
 */
export async function isFavorite(sampleId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return false

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('sample_id', sampleId)
      .single()

    // .single() throws if no rows are found, which means it isn't favorited
    return !!data
  } catch (error) {
    return false // Not favorited or error
  }
}

/**
 * Add a sample to favorites
 */
export async function addFavorite(sample: any): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('unauthenticated')
    }

    // Standardize object format
    const favorite: FavoriteSample = {
      id: sample.id,
      name: sample.name || sample.filename || 'Unknown',
      artist: sample.artist,
      category: sample.category,
      bpm: sample.bpm,
      key: sample.key,
      audioUrl: sample.audioUrl || sample.url,
      imageUrl: sample.imageUrl,
      duration: sample.duration,
      tags: sample.tags,
      waveform: sample.waveform,
      originalBpm: sample.originalBpm,
      timestamp: Date.now()
    }

    const { error } = await supabase
      .from('favorites')
      .insert({
        user_id: session.user.id,
        sample_id: sample.id,
        sample_data: favorite
      })

    if (error && error.code !== '23505') { 
      // Ignored code 23505 (unique constraint violation) = already favorited
      throw error
    }

    notifyUpdate()
  } catch (error) {
    console.error('Error adding favorite to Supabase:', error)
  }
}

/**
 * Remove a sample from favorites
 */
export async function removeFavorite(sampleId: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('unauthenticated')
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .match({ user_id: session.user.id, sample_id: sampleId })

    if (error) throw error

    notifyUpdate()
  } catch (error) {
    console.error('Error removing favorite from Supabase:', error)
  }
}

/**
 * Toggle favorite status
 * Returns a boolean indicating if it is NOW favorited
 */
export async function toggleFavorite(sample: any): Promise<boolean> {
  const isFav = await isFavorite(sample.id)
  if (isFav) {
    await removeFavorite(sample.id)
    return false
  } else {
    await addFavorite(sample)
    return true
  }
}

/**
 * Get favorites count
 */
export async function getFavoritesCount(): Promise<number> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) return 0

    const { count, error } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)

    if (error) throw error
    return count || 0
  } catch (error) {
    return 0
  }
}

