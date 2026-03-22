"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Loader2 } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

export default function DashboardPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/admin/dashboard')
                const json = await res.json()
                if (json.success) {
                    setData(json)
                }
            } catch (error) {
                console.error('Failed to load dashboard metrics', error)
            } finally {
                setLoading(false)
            }
        }
        fetchMetrics()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
        )
    }

    const { totalPlays = 0, totalDownloads = 0, conversionRate = "0%", chartData = [], topPacks = [] } = data || {}

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Dashboard</h2>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20 transition-colors">
                    Last 30 days
                    <ChevronDown className="w-4 h-4 text-white/60" />
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <StatCard label="Downloads" value={totalDownloads.toLocaleString()} />
                <StatCard label="Plays" value={totalPlays.toLocaleString()} />
                <StatCard label="Conversion rate" value={conversionRate} />
                {/* Revenue excluded as requested */}
            </div>

            {/* Main Chart */}
            <div className="h-[400px] w-full bg-white/5 rounded-2xl p-6 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="plays"
                            name="Plays"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                        />
                        <Area
                            type="monotone"
                            dataKey="downloads"
                            name="Downloads"
                            stroke="#10b981"
                            strokeWidth={2}
                            fillOpacity={0.2}
                            fill="#10b981"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Top Packs List */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Top Performing Packs</h3>
                </div>

                <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-medium text-white/40 uppercase tracking-wider">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">Pack Name</div>
                        {/* Revenue column removed */}
                        <div className="col-span-2 text-right">Downloads</div>
                        <div className="col-span-2 text-right">Plays</div>
                        <div className="col-span-2 text-right">Conversion</div>
                    </div>

                    {/* Rows */}
                    {topPacks.length === 0 ? (
                        <div className="p-8 text-center text-white/40 text-sm">No engagement data yet. Go play some samples!</div>
                    ) : (
                        topPacks.map((row: any, index: number) => (
                            <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                                <div className="col-span-1 text-white/60">{index + 1}</div>
                                <div className="col-span-5 flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-700/50 rounded flex-shrink-0 flex items-center justify-center text-xs text-white/50">{row.name.charAt(0)}</div>
                                    <span className="font-medium text-white truncate">{row.name}</span>
                                </div>
                                <div className="col-span-2 text-right text-white/80">{row.downloads.toLocaleString()}</div>
                                <div className="col-span-2 text-right text-white/80">{row.plays.toLocaleString()}</div>
                                <div className="col-span-2 text-right text-white/80">{row.conv}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

function StatCard({ label, value }: { label: string, value: string }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-sm text-white/60">{label}</span>
            <span className="text-3xl font-bold text-white">{value}</span>
        </div>
    )
}
