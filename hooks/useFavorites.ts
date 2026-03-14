import { useState, useEffect } from 'react'
import { getFavorites, removeFavorite, addFavorite, FavoriteSample } from '@/lib/favorites'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteSample[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const refreshFavorites = async () => {
        setIsLoading(true)
        try {
            const favs = await getFavorites()
            setFavorites(favs)
        } catch (error) {
            console.error("Failed to load favorites in hook", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        let mounted = true
        
        const load = async () => {
            setIsLoading(true)
            try {
                const favs = await getFavorites()
                if (mounted) setFavorites(favs)
            } finally {
                if (mounted) setIsLoading(false)
            }
        }
        
        load()

        const handleUpdate = () => load()

        window.addEventListener('favoritesUpdated', handleUpdate)
        return () => {
            mounted = false
            window.removeEventListener('favoritesUpdated', handleUpdate)
        }
    }, [])

    const toggleFavorite = async (sample: any) => {
        // Quick session check
        const { data } = await supabase.auth.getSession()
        if (!data.session) {
            toast.error("Please sign in to save favorites")
            return false
        }

        const isFav = favorites.some(f => f.id === sample.id)

        // Optimistic UI update
        if (isFav) {
            setFavorites(prev => prev.filter(f => f.id !== sample.id))
        } else {
            setFavorites(prev => [{
                id: sample.id,
                name: sample.name || sample.filename || 'Unknown',
                category: sample.category,
                bpm: sample.bpm,
                key: typeof sample.key === 'object' && sample.key ? `${sample.key.tonic}${sample.key.scale ? ' ' + sample.key.scale : ''}` : sample.key,
                audioUrl: sample.audioUrl || sample.url,
                imageUrl: sample.imageUrl,
                duration: sample.duration,
                timestamp: Date.now()
            } as FavoriteSample, ...prev])
        }

        try {
            // Actual DB call
            if (isFav) {
                await removeFavorite(sample.id)
            } else {
                await addFavorite(sample)
                toast.success("Added to favorites!")
            }
        } catch (error: any) {
            // Revert on failure
            refreshFavorites()
            if (error?.message === "unauthenticated") {
                toast.error("Please sign in to save favorites")
            } else {
                toast.error(`Failed to save favorite: ${error?.message || 'Database error'}`)
            }
        }
    }

    return {
        favorites,
        isLoading,
        refreshFavorites,
        removeFavorite,
        addFavorite,
        toggleFavorite,
        isFavorite: (id: string) => favorites.some(f => f.id === id)
    }
}
