"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react"

const CAROUSEL_IMAGES = ["/images/slideshow1.png", "/images/slideshow2.png", "/images/slideshow3.png"]

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

        // TODO: Implement Supabase auth signup
        setTimeout(() => {
            setIsLoading(false)
            router.push("/")
        }, 1000)
    }

    const handleGoogleSignup = async () => {
        // TODO: Implement Supabase Google OAuth
        console.log("Google signup")
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900">
            <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                <div className="flex flex-col lg:flex-row">
                    {/* Left Side - Image Carousel */}
                    <div className="hidden lg:flex lg:w-1/2 bg-gray-50 dark:bg-gray-900 relative overflow-hidden p-6">
                        {/* Carousel Content - Images Only with Glassmorphism */}
                        <div className="relative z-10 flex flex-col items-center justify-center w-full">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentSlide}
                                    className="w-full h-full flex flex-col items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {/* Slideshow Image with Glassmorphism Padding */}
                                    <div className="mb-6 rounded-2xl p-2 bg-white/40 dark:bg-white/10 backdrop-blur-lg shadow-2xl max-w-2xl w-full border border-white/20">
                                        <Image
                                            src={CAROUSEL_IMAGES[currentSlide]}
                                            alt="ROOTS Feature"
                                            width={600}
                                            height={400}
                                            className="w-full h-auto object-cover rounded-xl"
                                        />
                                    </div>

                                    {/* Carousel Dots */}
                                    <div className="flex justify-center space-x-2">
                                        {CAROUSEL_IMAGES.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => setCurrentSlide(index)}
                                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                                    ? "bg-green-600 w-8"
                                                    : "bg-gray-400 dark:bg-gray-600 hover:bg-gray-600 dark:hover:bg-gray-500"
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Right Side - Signup Form */}
                    <div className="w-full lg:w-1/2 p-8 lg:p-12">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Back to Home - Top */}
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
                                <Image
                                    src="/rootslogo.png"
                                    alt="ROOTS"
                                    width={48}
                                    height={48}
                                    className="h-12 w-auto object-contain"
                                />
                            </div>

                            <div className="mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                                    Create Account
                                </h1>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Start your journey with ROOTS
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* Google Signup Button */}
                            <motion.button
                                onClick={handleGoogleSignup}
                                className="w-full py-2.5 px-4 mb-5 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-650 transition-all duration-300 flex items-center justify-center space-x-3"
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
                                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                        Or continue with email
                                    </span>
                                </div>
                            </div>

                            {/* Signup Form */}
                            <form onSubmit={handleSignup} className="space-y-4">
                                {/* Name Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Full Name
                                    </label>
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

                                {/* Email Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email
                                    </label>
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

                                {/* Password Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Password
                                    </label>
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

                                {/* Signup Button */}
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

                            {/* Login Link */}
                            <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
                                Already have an account?{" "}
                                <Link
                                    href="/auth/login"
                                    className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-semibold"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    )
}
