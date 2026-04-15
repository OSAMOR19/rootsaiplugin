"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, RefreshCw, Users, Crown, User, ShieldCheck, ChevronUp, ChevronDown, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface UserRow {
    id: string
    full_name: string | null
    email: string | null
    plan: 'free' | 'paid'
    is_pro?: boolean
    stripe_subscription_id?: string | null
    paystack_reference?: string | null
    created_at: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserRow[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [updatingId, setUpdatingId] = useState<string | null>(null)
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date())

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/users')
            const data = await res.json()
            if (data.success) {
                setUsers(data.users)
                setLastRefreshed(new Date())
            }
        } catch (err) {
            console.error('Failed to fetch users:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchUsers()
        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchUsers, 30000)
        return () => clearInterval(interval)
    }, [fetchUsers])

    const [confirmUser, setConfirmUser] = useState<UserRow | null>(null)

    const handleTogglePlan = async (user: UserRow) => {
        if (!user) return
        const newPlan = user.plan === 'free' ? 'paid' : 'free'
        setUpdatingId(user.id)
        // Note: Do NOT setConfirmUser(null) here, otherwise the modal closes instantly and the user thinks nothing is happening!
        
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, plan: newPlan }),
            })
            
            if (res.status === 401) {
                alert("Your admin session has expired or is invalid. Please log in again using the new secure password.")
                window.location.href = '/admin/login'
                return
            }

            const data = await res.json()
            if (res.ok && data.success) {
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: newPlan, is_pro: newPlan === 'paid' } : u))
                // Close the modal only upon successful update
                setConfirmUser(null)
                alert(`Success! User has been granted ${newPlan === 'paid' ? 'PRO' : 'FREE'} access.`)
            } else {
                alert(`Failed to update user: ${data.error || 'Unknown server error from Supabase'}`)
            }
        } catch (err: any) {
            console.error('Failed to update plan:', err)
            alert(`Network error: Could not reach the server to grant plan. Details: ${err?.message || 'Unknown'}`)
        } finally {
            setUpdatingId(null)
        }
    }

    const filtered = users.filter(u => {
        const q = searchQuery.toLowerCase()
        return (
            u.email?.toLowerCase().includes(q) ||
            u.full_name?.toLowerCase().includes(q)
        )
    })

    const freeCount = users.filter(u => !u.is_pro && u.plan !== 'paid').length
    const paidCount = users.filter(u => u.is_pro || u.plan === 'paid').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Users</h2>
                <button
                    onClick={fetchUsers}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20 transition-colors"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-white/40" />
                        <span className="text-xs text-white/40 uppercase tracking-wider">Total</span>
                    </div>
                    <span className="text-3xl font-bold text-white">{users.length}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-blue-400 uppercase tracking-wider">Free</span>
                    </div>
                    <span className="text-3xl font-bold text-white">{freeCount}</span>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-yellow-400 uppercase tracking-wider">Paid</span>
                    </div>
                    <span className="text-3xl font-bold text-white">{paidCount}</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors text-sm"
                />
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-medium text-white/40 uppercase tracking-wider">
                    <div className="col-span-3">User</div>
                    <div className="col-span-3">Email</div>
                    <div className="col-span-2">Plan</div>
                    <div className="col-span-2">Provider</div>
                    <div className="col-span-1">Joined</div>
                    <div className="col-span-1 text-right">Action</div>
                </div>

                {loading && users.length === 0 ? (
                    <div className="p-8 text-center text-white/40">Loading users...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-white/40">
                        {searchQuery ? "No users match your search." : "No users yet."}
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {filtered.map((user, index) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: index * 0.02 }}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors"
                            >
                                {/* Name + avatar */}
                                <div className="col-span-3 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {(user.full_name || user.email || '?')[0].toUpperCase()}
                                    </div>
                                    <span className="text-white font-medium text-sm truncate">
                                        {user.full_name || <span className="text-white/40 italic">No name</span>}
                                    </span>
                                </div>

                                {/* Email */}
                                <div className="col-span-3 text-white/60 text-sm truncate">
                                    {user.email || '—'}
                                </div>

                                {/* Plan badge */}
                                <div className="col-span-2">
                                    {user.is_pro || user.plan === 'paid' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold">
                                            <Crown className="w-3 h-3" /> Pro
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white/50 rounded-full text-xs font-medium">
                                            Free
                                        </span>
                                    )}
                                </div>

                                {/* Provider badge */}
                                <div className="col-span-2 flex items-center">
                                    {user.plan === 'paid' && user.stripe_subscription_id ? (
                                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-bold tracking-wider uppercase">Stripe</span>
                                    ) : user.plan === 'paid' && user.paystack_reference ? (
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold tracking-wider uppercase">Paystack</span>
                                    ) : (user.is_pro || user.plan === 'paid') ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-400 rounded text-[10px] font-bold tracking-wider uppercase">
                                            <ShieldCheck className="w-3 h-3" /> Admin
                                        </span>
                                    ) : (
                                        <span className="text-white/30 text-xs">—</span>
                                    )}
                                </div>

                                {/* Joined date */}
                                <div className="col-span-1 text-white/40 text-xs">
                                    {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                                </div>

                                {/* Toggle plan */}
                                <div className="col-span-1 flex justify-end">
                                    <button
                                        onClick={() => setConfirmUser(user)}
                                        disabled={updatingId === user.id}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${user.plan === 'free'
                                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 hover:scale-105'
                                            : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 hover:scale-105'
                                            } disabled:opacity-40 disabled:hover:scale-100`}
                                        title={user.plan === 'free' ? 'Grant Pro Access' : 'Revoke Pro Access'}
                                    >
                                        {updatingId === user.id ? (
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                        ) : user.plan === 'free' ? (
                                            <><ChevronUp className="w-3 h-3" /> Grant Pro</>
                                        ) : (
                                            <><ChevronDown className="w-3 h-3" /> Revoke</>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <p className="text-xs text-white/20 text-right">
                Last refreshed: {lastRefreshed.toLocaleTimeString()} · Auto-refreshes every 30s
            </p>

            {/* Confirmation dialog */}
            <AnimatePresence>
                {confirmUser && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setConfirmUser(null)}
                    >
                        <motion.div
                            className="bg-gray-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl"
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    confirmUser.plan === 'free'
                                        ? 'bg-yellow-500/20'
                                        : 'bg-red-500/20'
                                }`}>
                                    {confirmUser.plan === 'free' ? (
                                        <Crown className="w-5 h-5 text-yellow-400" />
                                    ) : (
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">
                                        {confirmUser.plan === 'free' ? 'Grant Pro Access' : 'Revoke Pro Access'}
                                    </h3>
                                    <p className="text-white/40 text-xs">This takes effect immediately</p>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-3 mb-5">
                                <p className="text-white/70 text-sm">
                                    {confirmUser.plan === 'free' ? (
                                        <>You are about to <span className="text-yellow-400 font-semibold">grant Pro access</span> to <span className="text-white font-semibold">{confirmUser.full_name || confirmUser.email || 'this user'}</span>. They will immediately get full access to all paid features.{` `}Access will be set for 1 month by default.</>
                                    ) : (
                                        <>You are about to <span className="text-red-400 font-semibold">revoke Pro access</span> from <span className="text-white font-semibold">{confirmUser.full_name || confirmUser.email || 'this user'}</span>. They will be downgraded to the free plan immediately.</>
                                    )}
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmUser(null)}
                                    className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white/60 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleTogglePlan(confirmUser)}
                                    disabled={updatingId === confirmUser.id}
                                    className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 disabled:opacity-40 ${
                                        confirmUser.plan === 'free'
                                            ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                                            : 'bg-red-500 hover:bg-red-400 text-white'
                                    }`}
                                >
                                    {updatingId === confirmUser.id ? 'Updating...' : confirmUser.plan === 'free' ? 'Grant Pro' : 'Revoke Pro'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
