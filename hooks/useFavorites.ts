import { useState, useEffect } from 'react'
import { getFavorites, removeFavorite, addFavorite, FavoriteSample } from '@/lib/favorites'

export function useFavorites() {
    const [favorites, setFavorites] = useState<FavoriteSample[]>([])

    const refreshFavorites = () => {
        setFavorites(getFavorites())
    }

    useEffect(() => {
        refreshFavorites()

        const handleUpdate = () => refreshFavorites()

        window.addEventListener('favoritesUpdated', handleUpdate)
        return () => window.removeEventListener('favoritesUpdated', handleUpdate)
    }, [])

    return {
        favorites,
        refreshFavorites,
        removeFavorite,
        addFavorite,
        isFavorite: (id: string) => favorites.some(f => f.id === id)
    }
}
