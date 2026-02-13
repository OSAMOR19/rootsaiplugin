"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        // TODO: Implement Supabase password reset
        setTimeout(() => {
            setIsLoading(false)
            setSuccess(true)
        }, 1000)
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-gray-900">
            <motion.div
                className="w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Back button */}
                <Link href="/auth/login">
                    <button className="mb-6 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        <span className="text-sm">Back to login</span>
                    </button>
                </Link>

                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Image
                        src="/rootslogo.png"
                        alt="ROOTS"
                        width={48}
                        height={48}
                        className="h-12 w-auto object-contain"
                    />
                </div>

                {!success ? (
                    <>
                        <div className="mb-8 text-center">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                Reset Password
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400">
                                Enter your email and we'll send you a reset link
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

                        {/* Reset Form */}
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        required
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all duration-300 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-2.5 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={!isLoading ? { scale: 1.02 } : {}}
                                whileTap={!isLoading ? { scale: 0.98 } : {}}
                            >
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </motion.button>
                        </form>
                    </>
                ) : (
                    /* Success Message */
                    <motion.div
                        className="text-center py-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Check Your Email
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            We've sent a password reset link to<br />
                            <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                        </p>
                        <Link href="/auth/login">
                            <motion.button
                                className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Back to Login
                            </motion.button>
                        </Link>
                    </motion.div>
                )}

                {/* Back to Home */}
                <Link href="/">
                    <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-400">
                        ← Back to home
                    </p>
                </Link>
            </motion.div>
        </div>
    )
}
