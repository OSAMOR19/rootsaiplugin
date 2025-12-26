import { useState, useEffect } from 'react'
import { supabase } from "@/lib/supabase"

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
    // Added for compatibility with legacy code
    name?: string
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
            const { data, error } = await supabase
                .from('packs')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            if (data) {
                const mappedPacks: Pack[] = data.map((p: any) => ({
                    id: p.id,
                    title: p.title,
                    name: p.title, // Map title to name for backward compatibility
                    genre: p.genre,
                    description: p.description,
                    coverImage: p.cover_image,
                    allowCash: p.allow_cash,
                    sampleCount: 0, // Need to implement sample counting
                    createdAt: p.created_at
                }))
                setPacks(mappedPacks)
            }
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
