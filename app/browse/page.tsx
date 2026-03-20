"use client"

import { useRouter } from 'next/navigation'
import BrowseHeader from "@/components/BrowseHeader"
import RecommendedSection from "@/components/RecommendedSection"
import WhatsNewSection from "@/components/WhatsNewSection"
import SampleGroupSection from "@/components/SampleGroupSection"
import PaywallModal from "@/components/PaywallModal"
import { useSubscription } from "@/hooks/useSubscription"

export default function BrowsePage() {
  const router = useRouter()
  const { isPro, loading } = useSubscription()

  // While checking subscription status, show a minimal skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-xl w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Non-subscribers → paywall
  if (!isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
        {/* Blurred library preview in background */}
        <div className="filter blur-sm pointer-events-none select-none opacity-40 p-6">
          <BrowseHeader />
          <RecommendedSection />
        </div>
        <PaywallModal onDismiss={() => router.push('/')} />
      </div>
    )
  }

  // Full library for Pro subscribers
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300 p-6">
      <BrowseHeader />

      {/* CURATED FOR YOU */}
      <RecommendedSection />

      {/* FRESH DROPS */}
      <WhatsNewSection />

      {/* AFROBEATS */}
      <SampleGroupSection
        title="Afrobeats"
        subTitle="The best of Afrobeats sounds"
        filterFn={(s) => s.genres?.some(g => g.toLowerCase() === 'afrobeats' || g.toLowerCase() === 'afrobeat') || false}
      />

      {/* AMAPIANO */}
      <SampleGroupSection
        title="Amapiano"
        subTitle="Deep and soulful Amapiano vibes"
        filterFn={(s) => s.genres?.some(g => g.toLowerCase() === 'amapiano') || false}
      />

      {/* PERCUSSIONS */}
      <SampleGroupSection
        title="Percussions"
        subTitle="Rhythmic textures and loops"
        filterFn={(s) => s.instruments?.some(i => i.toLowerCase().includes('percussion')) || false}
      />

      {/* DRUM FILLS */}
      <SampleGroupSection
        title="Drum Fills"
        subTitle="Essential transitions and fills"
        filterFn={(s) => s.drumType?.toLowerCase().includes('fill') || false}
      />
    </div>
  )
}

