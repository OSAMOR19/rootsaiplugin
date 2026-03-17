"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mail, Lock, User, Eye, EyeOff, CheckCircle, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

const CAROUSEL_IMAGES = [
    "/images/RiddimsV4Artwork.jpeg",
    "/images/RIDDIMSV5Artwork.png",
    "/images/RIDDIMSV7Artwork.png",
    "/images/RIDDIMSV8Artwork.png",
    "/images/RIDDIMSV9Artwork.png",
]

// Google Logo SVG Component
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        <path fill="none" d="M0 0h48v48H0z" />
    </svg>
)

export default function SignupPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [confirmedEmail, setConfirmedEmail] = useState("")
    const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle")
    const [currentSlide, setCurrentSlide] = useState(0)

    // Auto-rotate carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % CAROUSEL_IMAGES.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            return
        }

        setIsLoading(true)
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { full_name: name },
                    emailRedirectTo: `${window.location.origin}/auth/callback?next=/browse`,
                },
            })
            if (error) throw error
            // Show the confirmation screen
            setConfirmedEmail(email)
        } catch (err: any) {
            setError(err.message || "Something went wrong. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleSignup = async () => {
        setError("")
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
        if (error) setError(error.message)
    }

    const handleResend = async () => {
        if (!confirmedEmail || resendStatus === "sending") return
        setResendStatus("sending")
        try {
            await supabase.auth.resend({
                type: "signup",
                email: confirmedEmail,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/browse` },
            })
            setResendStatus("sent")
            setTimeout(() => setResendStatus("idle"), 5000)
        } catch {
            setResendStatus("idle")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
            <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    {/* Left Side — Full-bleed Image Carousel */}
                    <div className="hidden lg:block lg:w-1/2 relative overflow-hidden" style={{ minHeight: 600 }}>
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                className="absolute inset-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Image
                                    src={CAROUSEL_IMAGES[currentSlide]}
                                    alt="ROOTS Feature"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </motion.div>
                        </AnimatePresence>

                        {/* Dots — overlaid */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
                            {CAROUSEL_IMAGES.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                        ? "bg-white w-8"
                                        : "bg-white/50 w-2 hover:bg-white/80"
                                        }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Right Side - Signup Form / Confirmation */}
                    <div className="w-full lg:w-1/2 p-8 lg:p-12">
                        <AnimatePresence mode="wait">
                            {confirmedEmail ? (
                                /* ── Confirmation Screen ── */
                                <motion.div
                                    key="confirm"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.5 }}
                                    className="flex flex-col items-center justify-center h-full text-center py-12"
                                >
                                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                                    </div>

                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your inbox!</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">We sent a confirmation link to</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-6 break-all">{confirmedEmail}</p>

                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 max-w-xs">
                                        Click the link in the email to activate your account. After confirming, you can sign in.
                                    </p>

                                    {/* Resend button */}
                                    <button
                                        onClick={handleResend}
                                        disabled={resendStatus !== "idle"}
                                        className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${resendStatus === "sending" ? "animate-spin" : ""}`} />
                                        {resendStatus === "sent" ? "Email resent!" : resendStatus === "sending" ? "Resending…" : "Resend confirmation email"}
                                    </button>

                                    <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 w-full">
                                        <Link href="/auth/login" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                                            Already confirmed? <span className="font-semibold text-green-600 dark:text-green-400">Sign in</span>
                                        </Link>
                                    </div>
                                </motion.div>
                            ) : (
                                /* ── Sign-up Form ── */
                                <motion.div
                                    key="form"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {/* Back to Home */}
                                    <Link href="/">
                                        <div className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors cursor-pointer">
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                            </svg>
                                            <span className="text-sm">Back to home</span>
                                        </div>
                                    </Link>

                                    {/* Logo for mobile */}
                                    <div className="lg:hidden flex justify-center mb-6">
                                        <Image src="/rootslogo.png" alt="ROOTS" width={48} height={48} className="h-12 w-auto object-contain" />
                                    </div>

                                    <div className="mb-6">
                                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Create Account</h1>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Start your journey with ROOTS</p>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <motion.div
                                            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            {error}
                                        </motion.div>
                                    )}

                                    {/* Google Signup */}
                                    <motion.button
                                        onClick={handleGoogleSignup}
                                        className="w-full py-2.5 px-4 mb-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center space-x-3"
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                    >
                                        <GoogleIcon />
                                        <span>Sign up with Google</span>
                                    </motion.button>

                                    {/* Divider */}
                                    <div className="relative my-5">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs">
                                            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with email</span>
                                        </div>
                                    </div>

                                    {/* Signup Form */}
                                    <form onSubmit={handleSignup} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                            <div className="relative">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="John Doe"
                                                    required
                                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="you@example.com"
                                                    required
                                                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                <input
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    placeholder="••••••••"
                                                    required
                                                    className="w-full pl-9 pr-11 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 dark:text-white text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                                >
                                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">At least 8 characters</p>
                                        </div>

                                        <motion.button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                            whileHover={!isLoading ? { scale: 1.01 } : {}}
                                            whileTap={!isLoading ? { scale: 0.99 } : {}}
                                        >
                                            {isLoading ? "Creating account..." : "Create Account"}
                                        </motion.button>
                                    </form>

                                    <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
                                        Already have an account?{" "}
                                        <Link href="/auth/login" className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold">
                                            Sign in
                                        </Link>
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    )
}
