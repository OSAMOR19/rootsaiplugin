"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Lock, ArrowRight } from "lucide-react"

export default function AdminLoginPage() {
    const router = useRouter()
    const [password, setPassword] = useState("")
    const [error, setError] = useState(false)

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        // Dummy password check as requested
        if (password === "roots" || password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
            // Set auth flag
            if (typeof window !== "undefined") {
                localStorage.setItem("admin_authenticated", "true")
            }
            router.push("/admin/dashboard")
        } else {
            setError(true)
        }
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-green-900/10 rounded-full blur-[150px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/10 rounded-full blur-[150px]" />

            {/* Back Button */}
            <button
                onClick={() => router.push('/')}
                className="absolute top-8 left-8 z-20 flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/5"
            >
                <ArrowRight className="w-4 h-4 rotate-180" />
                <span className="text-sm font-medium">Back to App</span>
            </button>

            <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl relative z-10">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-green-500/20">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Access</h1>
                    <p className="text-white/40 text-center mt-2">
                        Enter your secure password to access the dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value)
                                setError(false)
                            }}
                            placeholder="Enter password"
                            className={`w-full bg-black/40 border ${error ? 'border-red-500' : 'border-white/10'} rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-green-500 transition-colors`}
                        />
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm text-center">
                            Incorrect password. Please try again.
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                    >
                        Access Dashboard
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </form>

            </div>

            <p className="mt-8 text-white/20 text-sm relative z-10">
                Authorized personnel only
            </p>
        </div>
    )
}
