'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'

const WARN_DAYS = 7  // Show warning when <= 7 days left

export default function SubscriptionExpiryBanner() {
  const { isPro, daysUntilExpiry, subscriptionEndDate, billingInterval } = useSubscription()
  const [dismissed, setDismissed] = useState(false)
  const router = useRouter()

  // Only show if Pro and expiring soon
  if (!isPro || dismissed || daysUntilExpiry === null || daysUntilExpiry > WARN_DAYS || daysUntilExpiry < 0) {
    return null
  }

  const expiryStr = subscriptionEndDate
    ? subscriptionEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : 'soon'

  const isExpired = daysUntilExpiry <= 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        className="relative flex items-center gap-3 px-5 py-3.5 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700/50"
      >
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <span className="text-sm text-amber-800 dark:text-amber-300 flex-1">
          {isExpired ? (
            <>Your ROOTS Pro subscription has expired. Renew now to keep full access.</>
          ) : daysUntilExpiry === 1 ? (
            <>Your subscription expires <strong>tomorrow</strong> ({expiryStr}). Renew to keep access.</>
          ) : (
            <>Your subscription expires in <strong>{daysUntilExpiry} days</strong> ({expiryStr}). Renew to keep access.</>
          )}
        </span>
        <button
          onClick={() => router.push('/settings')}
          className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 shrink-0"
        >
          Manage <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 text-amber-500 hover:text-amber-700 dark:hover:text-amber-200 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
