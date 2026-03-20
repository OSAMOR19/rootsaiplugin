'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SubscriptionState {
  isPro: boolean
  loading: boolean
  error: string | null
}

/**
 * Returns whether the current logged-in user has an active Pro subscription.
 * Reads from the `profiles` table in Supabase (column: is_pro).
 */
export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) setState({ isPro: false, loading: false, error: null })
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('is_pro')
          .eq('id', user.id)
          .single()

        if (cancelled) return

        if (error) {
          // If the profiles table doesn't exist yet, treat as free
          setState({ isPro: false, loading: false, error: null })
          return
        }

        setState({ isPro: data?.is_pro ?? false, loading: false, error: null })
      } catch (err: any) {
        if (!cancelled) setState({ isPro: false, loading: false, error: err.message })
      }
    }

    fetchStatus()

    // Re-fetch when auth state changes (e.g. after login)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchStatus()
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  return state
}
