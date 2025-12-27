"use client"

import BrowseHeader from "@/components/BrowseHeader"
import RecommendedSection from "@/components/RecommendedSection"
import WhatsNewSection from "@/components/WhatsNewSection"

export default function BrowsePage() {
  return (
    <div className="w-full h-full p-6 text-white bg-black">
      <BrowseHeader />

      <RecommendedSection />

      <WhatsNewSection />
    </div>
  )
}
