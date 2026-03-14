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

// Global cache to prevent refetching during client-side navigation
let globalPacksCache: { data: Pack[], timestamp: number } | null = null
let globalFetchPromise: Promise<Pack[]> | null = null

// Cache expiration: 5 minutes
const CACHE_TTL = 5 * 60 * 1000

export function usePacks(): UsePacksResult {
    const [packs, setPacks] = useState<Pack[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const fetchPacks = async (forceRefetch = false) => {
        // 1. Check if we have valid cached data and we aren't forcing a refetch
        if (!forceRefetch && globalPacksCache && (Date.now() - globalPacksCache.timestamp < CACHE_TTL)) {
            setPacks(globalPacksCache.data)
            setLoading(false)
            setError(null)
            return
        }

        // 2. Check if a fetch is already in progress for packs (deduping)
        if (!forceRefetch && globalFetchPromise) {
            setLoading(true)
            try {
                const data = await globalFetchPromise
                setPacks(data)
                setError(null)
            } catch (err: any) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred')
            } finally {
                setLoading(false)
            }
            return
        }

        // 3. Start a new fetch
        setLoading(true)
        setError(null)

        const fetchPromise = (async () => {
            const { data, error } = await supabase
                .from('packs')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            const mappedPacks: Pack[] = (data || []).map((p: any) => ({
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

            globalPacksCache = {
                data: mappedPacks,
                timestamp: Date.now()
            }

            return mappedPacks
        })()

        globalFetchPromise = fetchPromise

        try {
            const mappedPacks = await fetchPromise
            setPacks(mappedPacks)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
            setError(errorMessage)
            console.error('Error fetching packs:', err)
        } finally {
            setLoading(false)
            globalFetchPromise = null
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
        refetch: () => fetchPacks(true),
        getPackByTitle
    }
}
