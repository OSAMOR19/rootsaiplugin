"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { X, Sparkles } from "lucide-react"
import Image from "next/image"

interface AuthPromptModalProps {
    isOpen: boolean
    onClose: () => void
    usageCount?: number
}

export default function AuthPromptModal({ isOpen, onClose, usageCount = 2 }: AuthPromptModalProps) {
    const router = useRouter()

    const handleSignup = () => {
        onClose()
        router.push("/auth/signup")
    }

    const handleLogin = () => {
        onClose()
        router.push("/auth/login")
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 pointer-events-auto border border-gray-200 dark:border-gray-700"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25 }}
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>

                            {/* Icon and Logo */}
                            <div className="flex flex-col items-center mb-6">
                                <motion.div
                                    className="relative mb-4"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-full blur-lg opacity-50" />
                                    <div className="relative bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-full">
                                        <Sparkles className="w-8 h-8 text-white" />
                                    </div>
                                </motion.div>

                                <div className="flex items-center space-x-2 mb-2">
                                    <Image
                                        src="/rootslogo.png"
                                        alt="ROOTS"
                                        width={28}
                                        height={28}
                                        className="h-7 w-auto object-contain"
                                    />
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">ROOTS</h2>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    Unlock Unlimited Access
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                    You've used {usageCount} free AI searches! 🎉
                                </p>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mt-2">
                                    Create a free account to enjoy <span className="font-semibold text-green-600 dark:text-green-400">unlimited AI-powered sample matching</span> and save your favorite sounds.
                                </p>
                            </div>

                            {/* Benefits */}
                            <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800">
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-start">
                                        <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                                        <span className="text-gray-700 dark:text-gray-300">Unlimited AI sample searches</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                                        <span className="text-gray-700 dark:text-gray-300">Save & organize your favorite sounds</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                                        <span className="text-gray-700 dark:text-gray-300">Access exclusive African percussion packs</span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                                        <span className="text-gray-700 dark:text-gray-300">Priority support & early feature access</span>
                                    </li>
                                </ul>
                            </div>

                            {/* Buttons */}
                            <div className="space-y-3">
                                <motion.button
                                    onClick={handleSignup}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Create Free Account
                                </motion.button>

                                <motion.button
                                    onClick={handleLogin}
                                    className="w-full py-3 px-4 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Already Have an Account
                                </motion.button>
                            </div>

                            {/* Skip Link */}
                            <button
                                onClick={onClose}
                                className="w-full mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                                Maybe later
                            </button>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    )
}
