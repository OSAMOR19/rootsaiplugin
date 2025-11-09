"use client"

const FAVORITES_STORAGE_KEY = 'rootsai_favorites'

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
  timestamp: number // When it was favorited
}

/**
 * Get all favorites from localStorage
 */
export function getFavorites(): FavoriteSample[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(FAVORITES_STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Error reading favorites:', error)
    return []
  }
}

/**
 * Check if a sample is favorited
 */
export function isFavorite(sampleId: string): boolean {
  const favorites = getFavorites()
  return favorites.some(fav => fav.id === sampleId)
}

/**
 * Add a sample to favorites
 */
export function addFavorite(sample: any): void {
  if (typeof window === 'undefined') return
  
  try {
    const favorites = getFavorites()
    
    // Check if already favorited
    if (favorites.some(fav => fav.id === sample.id)) {
      return // Already favorited
    }
    
    // Create favorite object
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
    
    favorites.push(favorite)
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites))
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('favoritesUpdated'))
  } catch (error) {
    console.error('Error adding favorite:', error)
  }
}

/**
 * Remove a sample from favorites
 */
export function removeFavorite(sampleId: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const favorites = getFavorites()
    const filtered = favorites.filter(fav => fav.id !== sampleId)
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filtered))
    
    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('favoritesUpdated'))
  } catch (error) {
    console.error('Error removing favorite:', error)
  }
}

/**
 * Toggle favorite status
 */
export function toggleFavorite(sample: any): boolean {
  const isFav = isFavorite(sample.id)
  if (isFav) {
    removeFavorite(sample.id)
    return false
  } else {
    addFavorite(sample)
    return true
  }
}

/**
 * Get favorites count
 */
export function getFavoritesCount(): number {
  return getFavorites().length
}

