"use client"

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import BrowseHeader from "@/components/BrowseHeader"
import RecommendedSection from "@/components/RecommendedSection"
import WhatsNewSection from "@/components/WhatsNewSection"
import SampleGroupSection from "@/components/SampleGroupSection"
import PaywallModal from "@/components/PaywallModal"
import SubscriptionExpiryBanner from "@/components/SubscriptionExpiryBanner"
import { useSubscription } from "@/hooks/useSubscription"
import { supabase } from '@/lib/supabase'
import { CheckCircle2, Loader2 } from 'lucide-react'

export default function BrowsePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const upgraded = searchParams.get('upgraded')
  const cancelled = searchParams.get('cancelled')

  const { isPro, loading } = useSubscription()
  const [polling, setPolling] = useState(false)
  const [pollGaveUp, setPollGaveUp] = useState(false)
  const [showSuccessBanner, setShowSuccessBanner] = useState(false)

  // When redirected back after payment, poll until is_pro becomes true
  useEffect(() => {
    if (upgraded !== 'true') return
    if (isPro) {
      setShowSuccessBanner(true)
      setTimeout(() => setShowSuccessBanner(false), 6000)
      return
    }
    if (loading) return

    // Start polling
    setPolling(true)
    let attempts = 0
    const maxAttempts = 10 // 10 × 2s = 20 seconds

    const poll = async () => {
      attempts++
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('is_pro')
        .eq('id', user.id)
        .single()

      if (data?.is_pro) {
        setPolling(false)
        setShowSuccessBanner(true)
        setTimeout(() => setShowSuccessBanner(false), 6000)
        // Remove the query param cleanly
        router.replace('/browse')
        return
      }

      if (attempts >= maxAttempts) {
        setPolling(false)
        setPollGaveUp(true)
        return
      }

      setTimeout(poll, 2000)
    }

    // Slight delay to let webhook fire
    setTimeout(poll, 1500)
  }, [upgraded, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading || polling) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
        {polling && (
          <div className="text-center">
            <p className="text-gray-700 dark:text-white font-semibold text-lg">Confirming your payment…</p>
            <p className="text-gray-500 dark:text-white/50 text-sm mt-1">This usually takes a few seconds.</p>
          </div>
        )}
      </div>
    )
  }

  // ── Non-subscribers → paywall ─────────────────────────────────────────────
  if (!isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
        {pollGaveUp && (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 px-6 py-3 text-sm text-amber-800 dark:text-amber-300 text-center">
            ⚠ We couldn't confirm your payment automatically. If you have paid, please wait a minute and refresh the page. Contact support if this persists.
          </div>
        )}
        {cancelled && (
          <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-700 px-6 py-3 text-sm text-red-800 dark:text-red-300 text-center">
            Payment was cancelled. You can try again whenever you're ready.
          </div>
        )}
        {/* Blurred library preview in background */}
        <div className="filter blur-sm pointer-events-none select-none opacity-40 p-6">
          <BrowseHeader />
          <RecommendedSection />
        </div>
        <PaywallModal onDismiss={() => router.push('/')} />
      </div>
    )
  }

  // ── Full library for Pro subscribers ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300">

      <SubscriptionExpiryBanner />

      <div className="p-6">
        {showSuccessBanner && (
          <div className="mb-6 flex items-center gap-3 px-5 py-3 bg-green-500/15 border border-green-500/30 rounded-xl text-green-700 dark:text-green-400 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            🎉 Welcome to ROOTS Pro! Your subscription is now active. Enjoy the full library!
          </div>
        )}

        <BrowseHeader />
        <RecommendedSection />
        <WhatsNewSection />

        <SampleGroupSection
          title="Afrobeats"
          subTitle="The best of Afrobeats sounds"
          filterFn={(s) => s.genres?.some((g: string) => g.toLowerCase() === 'afrobeats' || g.toLowerCase() === 'afrobeat') || false}
        />
        <SampleGroupSection
          title="Amapiano"
          subTitle="Deep and soulful Amapiano vibes"
          filterFn={(s) => s.genres?.some((g: string) => g.toLowerCase() === 'amapiano') || false}
        />
        <SampleGroupSection
          title="Percussions"
          subTitle="Rhythmic textures and loops"
          filterFn={(s) => s.instruments?.some((i: string) => i.toLowerCase().includes('percussion')) || false}
        />
        <SampleGroupSection
          title="Drum Fills"
          subTitle="Essential transitions and fills"
          filterFn={(s) => s.drumType?.toLowerCase().includes('fill') || false}
        />
      </div>
    </div>
  )
}
