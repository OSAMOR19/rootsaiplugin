import { useState, useEffect } from 'react'
import { getFavorites, removeFavorite, addFavorite, FavoriteSample } from '@/lib/favorites'

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

    return {
        favorites,
        isLoading,
        refreshFavorites,
        removeFavorite,
        addFavorite,
        isFavorite: (id: string) => favorites.some(f => f.id === id)
    }
}
