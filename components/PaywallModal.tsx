'use client'

import { useState, useEffect } from 'react'
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
  CreditCard,
  CheckCircle2,
  Tag,
} from 'lucide-react'

const FEATURES = [
  { icon: Music,      label: 'Full drum sample library' },
  { icon: Headphones, label: 'Browse all genres & categories' },
  { icon: Heart,      label: 'Save unlimited favorites' },
  { icon: Zap,        label: 'AI-powered sample matching' },
  { icon: Star,       label: 'New drops every week' },
]

type Provider = 'paystack' | 'stripe'
type BillingInterval = 'month' | 'year'

interface PaywallModalProps {
  onDismiss?: () => void
}

const PaystackLogo = () => (
  <svg width="28" height="28" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M512 0C229.2 0 0 229.2 0 512c0 282.8 229.2 512 512 512 282.8 0 512-229.2 512-512C1024 229.2 794.8 0 512 0zm-111 685H277.5V562.6H401V685zm345.5 0H623v-122.4h123.5V685zM746.5 500.2H277.5V377.7h469v122.5z" fill="#0BA4DB"/>
  </svg>
)

const StripeLogo = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M15.4 12.3c0-1.2 1-1.7 2.6-1.7 2.1 0 4.3 .7 6.1 1.9l2.2-6.5C24.1 4.5 21.1 3.5 18 3.5c-6.1 0-10.4 3.2-10.4 8.7 0 8.1 11.2 6.6 11.2 10.1 0 1.4-1.2 2-3 2-2.7 0-5.5-1.1-7.8-2.9l-2.3 6.6c2.8 1.8 6.1 2.9 9.5 2.9 6.4 0 10.9-3.2 10.9-8.9 0-8.6-11.2-6.9-11.2-10.3z" fill="#635BFF"/>
  </svg>
)

// Pricing config
const MONTHLY_USD = 5
const YEARLY_USD = 50  // $60 discounted to $50
const YEARLY_SAVINGS_USD = 60 - 50

export default function PaywallModal({ onDismiss }: PaywallModalProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<Provider | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Provider>('paystack')
  const [billing, setBilling] = useState<BillingInterval>('month')

  // ── Live Paystack exchange rate ───────────────────────────────────────────
  const psCurrency = (process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY ?? 'NGN').toUpperCase()
  const psSymbol = psCurrency === 'GBP' ? '£' : psCurrency === 'EUR' ? '€' : psCurrency === 'GHS' ? 'GH₵' : psCurrency === 'ZAR' ? 'R' : '₦'
  const fallbackAmount = Number(process.env.NEXT_PUBLIC_PAYSTACK_AMOUNT ?? 500000) / 100
  const [exchangeRate, setExchangeRate] = useState<number>(fallbackAmount / MONTHLY_USD)

  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.[psCurrency]) setExchangeRate(data.rates[psCurrency])
      })
      .catch(() => {})
  }, [psCurrency])

  // ── Computed prices ────────────────────────────────────────────────────────
  const stripeSymbol = '$'
  const stripeUSD = billing === 'month' ? MONTHLY_USD : YEARLY_USD
  const psAmount = billing === 'month'
    ? Math.round(MONTHLY_USD * exchangeRate)
    : Math.round(YEARLY_USD * exchangeRate)

  const handleSubscribe = async (provider: Provider) => {
    setIsLoading(provider)
    setError('')
    try {
      const endpoint = provider === 'paystack'
        ? '/api/paystack/checkout'
        : '/api/stripe/checkout'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing_interval: billing }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')

      const redirectUrl = provider === 'paystack' ? data.authorization_url : data.url
      if (redirectUrl) {
        if (provider === 'paystack') {
          // Same-tab redirect so Paystack's callback_url lands back in this tab
          // and the /browse?upgraded=true polling flow triggers correctly
          window.location.href = redirectUrl
        } else {
          // Stripe opens in new tab (Stripe handles its own redirect)
          window.open(redirectUrl, '_blank')
          if (onDismiss) onDismiss()
          else router.back()
        }
      }
    } catch (err: any) {
      setError(err.message)
      setIsLoading(null)
    }
  }

  const handleDismiss = () => {
    if (onDismiss) onDismiss()
    else router.back()
  }

  const providers: { id: Provider; name: string; logo: React.ReactNode; tagline: string; price: string; symbol: string; currency: string }[] = [
    {
      id: 'paystack', name: 'Paystack', logo: <PaystackLogo />,
      tagline: 'Cards, Bank, USSD & more',
      price: psAmount.toLocaleString(),
      symbol: psSymbol, currency: psCurrency,
    },
    {
      id: 'stripe', name: 'Stripe', logo: <StripeLogo />,
      tagline: 'International cards',
      price: stripeUSD.toFixed(2),
      symbol: stripeSymbol, currency: 'USD',
    },
  ]

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
            <ul className="space-y-2.5 mb-5">
              {FEATURES.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </li>
              ))}
            </ul>

            {/* Billing interval toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5">
              {(['month', 'year'] as BillingInterval[]).map((interval) => (
                <button
                  key={interval}
                  onClick={() => setBilling(interval)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    billing === interval
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {interval === 'month' ? 'Monthly' : (
                    <>
                      Yearly
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded-full">
                        <Tag className="w-2.5 h-2.5" /> Save ${YEARLY_SAVINGS_USD}
                      </span>
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Provider selector */}
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5" /> Choose payment method
            </p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {providers.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p.id)}
                  className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                    selected === p.id
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-sm'
                      : 'border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700'
                  }`}
                >
                  {selected === p.id && (
                    <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-green-500" />
                  )}
                  <span className="flex items-center justify-center h-8 my-1">{p.logo}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{p.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{p.tagline}</span>
                  <span className="mt-1 text-base font-extrabold text-green-600 dark:text-green-400">
                    {p.symbol}{p.price}
                    <span className="text-xs font-normal text-gray-400 ml-0.5">
                      /{p.currency}/{billing === 'month' ? 'mo' : 'yr'}
                    </span>
                  </span>
                </button>
              ))}
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
              onClick={() => handleSubscribe(selected)}
              disabled={!!isLoading}
              className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              whileHover={!isLoading ? { scale: 1.02 } : {}}
              whileTap={!isLoading ? { scale: 0.98 } : {}}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Redirecting to {isLoading === 'paystack' ? 'Paystack' : 'Stripe'}…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Pay with {selected === 'paystack' ? 'Paystack' : 'Stripe'}
                </>
              )}
            </motion.button>

            <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
              Cancel anytime · Secure payment via {selected === 'paystack' ? 'Paystack' : 'Stripe'}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
