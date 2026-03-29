"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, Moon, Sun, Monitor, Volume2, Headphones, SettingsIcon, Shield, User, LogOut, Save, Mail, HeadphonesIcon, CreditCard, Crown, Loader2, MessageSquare, ExternalLink } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useSubscription } from "@/hooks/useSubscription"

export default function SettingsPage() {
  const router = useRouter()
  const { isPro } = useSubscription()
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system")
  const [audioOutput, setAudioOutput] = useState("default")
  const [masterVolume, setMasterVolume] = useState(75)
  const [sampleRate, setSampleRate] = useState("44100")
  const [bufferSize, setBufferSize] = useState("512")
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelSuccess, setCancelSuccess] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null)
  const [paystackCustomerCode, setPaystackCustomerCode] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setDisplayName(session?.user?.user_metadata?.full_name || "")
    })
    // Fetch payment provider info for the manage sub section
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('profiles')
        .select('stripe_customer_id, paystack_customer_code')
        .eq('id', user.id)
        .single()
      if (data) {
        setStripeCustomerId(data.stripe_customer_id || null)
        setPaystackCustomerCode(data.paystack_customer_code || null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setDisplayName(session?.user?.user_metadata?.full_name || "")
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Apply theme
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else if (theme === "light") {
      root.classList.remove("dark")
    } else {
      // System preference
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (prefersDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
    }
  }, [theme])

  const handleBack = () => {
    router.push("/")
  }

  const handleUpdateProfile = async () => {
    if (!user) return
    setIsSaving(true)
    setSaveSuccess(false)
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName }
      })
      if (error) throw error
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
      if (typeof window !== 'undefined') {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') || key.includes('supabase') || key === 'auth-storage') {
            localStorage.removeItem(key)
          }
        })
      }
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      router.push('/')
      router.refresh()
    }
  }

  const handleManageStripe = async () => {
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (error) { alert(error); return }
      window.open(url, '_blank')
    } catch {
      alert('Could not open billing portal. Please try again.')
    }
  }

  const handleCancelPaystack = async () => {
    if (!confirm('Are you sure you want to cancel your ROOTS Pro subscription? You will lose access at the end of your current period.')) return
    setIsCancelling(true)
    try {
      const res = await fetch('/api/paystack/cancel', { method: 'POST' })
      const { success, error } = await res.json()
      if (error) { alert(error); setIsCancelling(false); return }
      if (success) {
        setCancelSuccess(true)
        setTimeout(() => window.location.reload(), 2000)
      }
    } catch {
      alert('Cancellation failed. Please contact support.')
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 transition-colors duration-300">
      {/* Header */}
      <motion.header
        className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 dark:from-green-400 dark:to-green-300 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customize your ROOTS experience</p>
            </div>
          </div>
          <SettingsIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
      </motion.header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Account / Profile Settings */}
          <motion.div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Account
            </h2>

            {user ? (
              <div className="space-y-5">
                {/* Profile Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                    <div className="flex items-center px-4 py-2.5 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>

                {/* Plan Badge */}
                <div className="flex items-center gap-3 p-4 rounded-xl border"
                  style={isPro
                    ? { background: 'linear-gradient(135deg,rgba(34,197,94,.15),rgba(16,185,129,.15))', borderColor: 'rgba(34,197,94,.3)' }
                    : { background: 'rgba(107,114,128,.05)', borderColor: 'rgba(107,114,128,.2)' }
                  }>
                  <Crown className={`w-5 h-5 ${isPro ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  <div>
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                      Current Plan: <span className={isPro ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>{isPro ? 'Pro ✓' : 'Free'}</span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {isPro ? 'Full access to all samples, packs, and AI features.' : '5 downloads and 5 AI uses included. Upgrade to unlock everything.'}
                    </div>
                  </div>
                  {!isPro && (
                    <motion.button
                      onClick={() => router.push('/browse')}
                      className="ml-auto px-4 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-semibold rounded-full shadow-md"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Upgrade
                    </motion.button>
                  )}
                </div>

                {/* Subscription Management (only for pro users) */}
                {isPro && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Subscription Management</p>
                    {cancelSuccess ? (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-400">
                        ✓ Subscription cancelled. Refreshing…
                      </div>
                    ) : stripeCustomerId ? (
                      <motion.button
                        onClick={handleManageStripe}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-medium rounded-lg text-sm transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <CreditCard className="w-4 h-4" />
                        Manage / Cancel Stripe Subscription
                        <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-60" />
                      </motion.button>
                    ) : paystackCustomerCode ? (
                      <motion.button
                        onClick={handleCancelPaystack}
                        disabled={isCancelling}
                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-medium rounded-lg text-sm transition-all disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {isCancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                        {isCancelling ? 'Cancelling…' : 'Cancel Paystack Subscription'}
                      </motion.button>
                    ) : null}
                  </div>
                )}

                {/* Save / Success */}
                <div className="flex items-center space-x-3">
                  <motion.button
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center"
                    whileHover={!isSaving ? { scale: 1.02 } : {}}
                    whileTap={!isSaving ? { scale: 0.98 } : {}}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Profile"}
                  </motion.button>

                  {saveSuccess && (
                    <motion.span
                      className="text-sm text-green-600 dark:text-green-400 font-medium"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      ✓ Profile updated!
                    </motion.span>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <motion.button
                    onClick={handleSignOut}
                    className="px-5 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 font-medium rounded-lg transition-all duration-300 text-sm flex items-center"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500 dark:text-gray-400 mb-4">Sign in to manage your profile</p>
                <motion.button
                  onClick={() => router.push('/auth/login')}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Sign In
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Appearance Settings */}
          <motion.div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Monitor className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Appearance
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: "light", icon: Sun, label: "Light" },
                    { value: "dark", icon: Moon, label: "Dark" },
                    { value: "system", icon: Monitor, label: "System" },
                  ].map(({ value, icon: Icon, label }) => (
                    <motion.button
                      key={value}
                      onClick={() => setTheme(value as any)}
                      className={`p-3 rounded-lg border transition-all ${
                        theme === value
                          ? "bg-green-500 text-white border-green-500 shadow-lg"
                          : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-200 dark:hover:border-green-700"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1" />
                      <div className="text-sm font-medium">{label}</div>
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Glassmorphism Effects
                </label>
                <motion.button
                  className="w-full p-3 bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-sm border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-300 hover:from-green-500/30 hover:to-green-600/30 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Enhanced Visual Effects Enabled
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Audio Settings */}
          <motion.div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <Headphones className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Audio
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Master Volume</label>
                <div className="flex items-center space-x-3">
                  <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={masterVolume}
                    onChange={(e) => setMasterVolume(Number.parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-10">{masterVolume}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Audio Output</label>
                <select
                  value={audioOutput}
                  onChange={(e) => setAudioOutput(e.target.value)}
                  className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 dark:text-gray-300"
                >
                  <option value="default">Default Audio Device</option>
                  <option value="headphones">Headphones</option>
                  <option value="speakers">Speakers</option>
                  <option value="usb">USB Audio Interface</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sample Rate</label>
                  <select
                    value={sampleRate}
                    onChange={(e) => setSampleRate(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 dark:text-gray-300 text-sm"
                  >
                    <option value="44100">44.1 kHz</option>
                    <option value="48000">48 kHz</option>
                    <option value="96000">96 kHz</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Buffer Size</label>
                  <select
                    value={bufferSize}
                    onChange={(e) => setBufferSize(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-700 dark:text-gray-300 text-sm"
                  >
                    <option value="128">128 samples</option>
                    <option value="256">256 samples</option>
                    <option value="512">512 samples</option>
                    <option value="1024">1024 samples</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Performance Settings */}
          <motion.div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Performance</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">Hardware Acceleration</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Use GPU for audio processing</div>
                </div>
                <motion.button
                  className="w-12 h-6 bg-green-500 rounded-full p-1 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: 20 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </motion.button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200">Reduce Animations</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Improve performance on slower devices</div>
                </div>
                <motion.button
                  className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full p-1 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  <motion.div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* About */}
          <motion.div
            className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-xl rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">About ROOTS</h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>Version 1.0.0</p>
              <p>AI-powered Afrobeat sample discovery</p>
              <p>Built with Next.js and Framer Motion</p>
            </div>
            <motion.button
              className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Check for Updates
            </motion.button>
          </motion.div>

          {/* Contact Support */}
          <motion.div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Contact Support
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Having trouble with payments, subscriptions, or the app? We're here to help.
            </p>
            <motion.a
              href="mailto:support@manifxtaudio.com?subject=ROOTS Support Request"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-300 text-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Mail className="w-4 h-4" />
              Email Support
            </motion.a>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

