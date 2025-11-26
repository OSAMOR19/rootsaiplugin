"use client"

import BrowseHeader from "@/components/BrowseHeader"
import RecommendedSection from "@/components/RecommendedSection"
import WhatsNewSection from "@/components/WhatsNewSection"

export default function BrowsePage() {
  return (
    <div className="max-w-7xl mx-auto pb-20">
      <BrowseHeader />

      <RecommendedSection />

      <WhatsNewSection />
    </div>
  )
}
