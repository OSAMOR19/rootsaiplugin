"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, RefreshCw, Users, Crown, User } from "lucide-react"
import { motion } from "framer-motion"

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

    const handleTogglePlan = async (user: UserRow) => {
        const newPlan = user.plan === 'free' ? 'paid' : 'free'
        setUpdatingId(user.id)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id, plan: newPlan }),
            })
            const data = await res.json()
            if (data.success) {
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, plan: newPlan, is_pro: newPlan === 'paid' } : u))
            }
        } catch (err) {
            console.error('Failed to update plan:', err)
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
                                    {user.stripe_subscription_id ? (
                                        <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded text-[10px] font-bold tracking-wider uppercase">Stripe</span>
                                    ) : user.paystack_reference ? (
                                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-[10px] font-bold tracking-wider uppercase">Paystack</span>
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
                                        onClick={() => handleTogglePlan(user)}
                                        disabled={updatingId === user.id}
                                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${user.plan === 'free'
                                            ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                                            : 'bg-white/10 text-white/50 hover:bg-white/20'
                                            } disabled:opacity-40`}
                                        title={user.plan === 'free' ? 'Upgrade to Paid' : 'Downgrade to Free'}
                                    >
                                        {updatingId === user.id ? '...' : user.plan === 'free' ? '↑ Paid' : '↓ Free'}
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
        </div>
    )
}
