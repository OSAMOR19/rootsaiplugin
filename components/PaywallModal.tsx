'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Music,
  Zap,
  Heart,
  Headphones,
  Lock,
  X,
  Loader2,
  Star,
} from 'lucide-react'

const FEATURES = [
  { icon: Music,      label: 'Full drum sample library' },
  { icon: Headphones, label: 'Browse all genres & categories' },
  { icon: Heart,      label: 'Save unlimited favorites' },
  { icon: Zap,        label: 'AI-powered sample matching' },
  { icon: Star,       label: 'New drops every week' },
]

interface PaywallModalProps {
  /** Called when the user dismisses the modal (goes back) */
  onDismiss?: () => void
}

export default function PaywallModal({ onDismiss }: PaywallModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const price = process.env.NEXT_PUBLIC_STRIPE_PRICE_AMOUNT ?? '9.99'
  const currency = (process.env.NEXT_PUBLIC_STRIPE_CURRENCY ?? 'USD').toUpperCase()
  const currencySymbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$'

  const handleSubscribe = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      setError(err.message)
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss()
    } else {
      router.back()
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          {/* Gradient banner */}
          <div className="h-2 w-full bg-gradient-to-r from-green-400 via-green-500 to-green-600" />

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="p-8">
            {/* Icon + headline */}
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/40 dark:to-green-800/40 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Unlock the Full Library
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Subscribe to ROOTS Pro and get access to everything.
              </p>
            </div>

            {/* Feature list */}
            <ul className="space-y-3 mb-6">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </li>
              ))}
            </ul>

            {/* Pricing */}
            <div className="text-center mb-6">
              <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                {currencySymbol}{price}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">/month</span>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 dark:text-red-400 text-center mb-3"
              >
                {error}
              </motion.p>
            )}

            {/* CTA */}
            <motion.button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to checkout…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Get ROOTS Pro — {currencySymbol}{price}/mo
                </>
              )}
            </motion.button>

            <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
              Cancel anytime · Secure payment via Stripe
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
