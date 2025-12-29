"use client"

import BrowseHeader from "@/components/BrowseHeader"
import RecommendedSection from "@/components/RecommendedSection"
import WhatsNewSection from "@/components/WhatsNewSection"
import SampleGroupSection from "@/components/SampleGroupSection"

export default function BrowsePage() {
  return (
    <div className="w-full h-full p-6 text-white bg-black">
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
