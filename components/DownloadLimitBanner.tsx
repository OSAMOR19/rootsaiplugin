'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Zap } from 'lucide-react'
import { useState } from 'react'
import PaywallModal from '@/components/PaywallModal'

interface DownloadLimitBannerProps {
  downloadCount: number
  downloadLimit: number
  isPro: boolean
}

export default function DownloadLimitBanner({ downloadCount, downloadLimit, isPro }: DownloadLimitBannerProps) {
  const [showPaywall, setShowPaywall] = useState(false)

  // Don't show for Pro users or users under the limit
  if (isPro || downloadCount < downloadLimit) return null

  return (
    <>
      {showPaywall && <PaywallModal onDismiss={() => setShowPaywall(false)} />}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="w-full bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-red-500/90 backdrop-blur-sm border border-orange-400/30 rounded-xl p-4 mb-6 shadow-lg shadow-orange-500/10"
        >
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">
                  You&apos;ve used {downloadCount}/{downloadLimit} free downloads
                </p>
                <p className="text-white/80 text-xs mt-0.5">
                  Upgrade to ROOTS Pro for unlimited downloads, AI features, and more.
                </p>
              </div>
            </div>

            <motion.button
              onClick={() => setShowPaywall(true)}
              className="px-5 py-2.5 bg-white text-orange-600 font-bold text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-4 h-4" />
              Upgrade Now
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  )
}
