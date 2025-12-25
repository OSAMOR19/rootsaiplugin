import { useState, useEffect } from 'react'

export interface Pack {
    id: string
    title: string
    genre?: string
    description?: string
    allowCash?: boolean
    coverImage?: string
    sampleCount?: number
    createdAt?: string
    samples?: string[]
    featuredSampleId?: string
}

export interface UsePacksResult {
    packs: Pack[]
    loading: boolean
    error: string | null
    refetch: () => Promise<void>
    getPackByTitle: (title: string) => Pack | undefined
}

export function usePacks(): UsePacksResult {
    const [packs, setPacks] = useState<Pack[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPacks = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/audio/packs.json')

            if (!response.ok) {
                // If file doesn't exist yet, we can return empty array
                if (response.status === 404) {
                    setPacks([])
                    return
                }
                throw new Error(`Failed to fetch packs: ${response.statusText}`)
            }

            const data = await response.json()
            setPacks(data)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
            setError(errorMessage)
            console.error('Error fetching packs:', err)
        } finally {
            setLoading(false)
        }
    }

    const getPackByTitle = (title: string): Pack | undefined => {
        // Case-insensitive comparison
        return packs.find(p => p.title.toLowerCase() === title.toLowerCase())
    }

    useEffect(() => {
        fetchPacks()
    }, [])

    return {
        packs,
        loading,
        error,
        refetch: fetchPacks,
        getPackByTitle
    }
}
