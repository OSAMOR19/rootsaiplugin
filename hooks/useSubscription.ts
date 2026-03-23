'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface SubscriptionState {
  isPro: boolean
  loading: boolean
  error: string | null
  subscriptionEndDate: Date | null
  billingInterval: 'month' | 'year' | null
  daysUntilExpiry: number | null
}

/**
 * Returns whether the current logged-in user has an active Pro subscription.
 * Reads from `profiles.is_pro`. Also exposes subscription_end_date for expiry banners.
 * 
 * Listens for real-time changes via Supabase Realtime so that admin plan toggles
 * take effect IMMEDIATELY in the user's session without a refresh or re-login.
 */
export function useSubscription(): SubscriptionState {
  const [userId, setUserId] = useState<string | null>(null)
  const [state, setState] = useState<SubscriptionState>({
    isPro: false,
    loading: true,
    error: null,
    subscriptionEndDate: null,
    billingInterval: null,
    daysUntilExpiry: null,
  })

  function buildState(data: any): SubscriptionState {
    const endDate = data?.subscription_end_date ? new Date(data.subscription_end_date) : null
    const daysUntilExpiry = endDate
      ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null
    return {
      isPro: data?.is_pro ?? false,
      loading: false,
      error: null,
      subscriptionEndDate: endDate,
      billingInterval: data?.billing_interval ?? null,
      daysUntilExpiry,
    }
  }

  useEffect(() => {
    let cancelled = false

    async function fetchStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          if (!cancelled) setState({ isPro: false, loading: false, error: null, subscriptionEndDate: null, billingInterval: null, daysUntilExpiry: null })
          return
        }

        setUserId(user.id)

        const { data, error } = await supabase
          .from('profiles')
          .select('is_pro, subscription_end_date, billing_interval')
          .eq('id', user.id)
          .single()

        if (cancelled) return

        if (error) {
          setState({ isPro: false, loading: false, error: null, subscriptionEndDate: null, billingInterval: null, daysUntilExpiry: null })
          return
        }

        setState(buildState(data))
      } catch (err: any) {
        if (!cancelled) setState({ isPro: false, loading: false, error: err.message, subscriptionEndDate: null, billingInterval: null, daysUntilExpiry: null })
      }
    }

    fetchStatus()

    // Re-fetch when auth state changes (e.g. after login)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      fetchStatus()
    })

    return () => {
      cancelled = true
      authSub.unsubscribe()
    }
  }, [])

  // ── Real-time listener: react instantly to admin plan changes ──────────────
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`profiles:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          // Admin changed this user's plan — update state immediately
          setState(buildState(payload.new))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return state
}
