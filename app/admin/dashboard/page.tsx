"use client"

import { useState } from "react"
import { ChevronDown, ArrowUpRight } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

// Mock Data for Chart
const chartData = [
    { name: 'Nov 13', value: 400 },
    { name: 'Nov 15', value: 300 },
    { name: 'Nov 17', value: 200 },
    { name: 'Nov 19', value: 278 },
    { name: 'Nov 21', value: 189 },
    { name: 'Nov 23', value: 239 },
    { name: 'Nov 25', value: 349 },
    { name: 'Nov 27', value: 200 },
    { name: 'Nov 29', value: 278 },
    { name: 'Dec 01', value: 189 },
    { name: 'Dec 03', value: 349 },
    { name: 'Dec 05', value: 400 },
    { name: 'Dec 07', value: 300 },
    { name: 'Dec 09', value: 200 },
    { name: 'Dec 11', value: 278 },
    { name: 'Dec 13', value: 189 },
]

export default function DashboardPage() {

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
                <StatCard label="Downloads" value="1,720" />
                <StatCard label="Plays" value="45,921" />
                <StatCard label="Conversion rate" value="3.75%" />
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
                            dataKey="value"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorValue)"
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
                    {[
                        { name: "Afrowave Vol 4", downloads: "1,755", plays: "34,052", conv: "5.15%", date: "Jun 4, 2024" },
                        { name: "PLUTO Vol 2 - Amapiano", downloads: "1,382", plays: "25,564", conv: "5.41%", date: "Sep 18, 2024" },
                        { name: "Riddims Drum Loops Vol. 4", downloads: "1,207", plays: "29,659", conv: "4.07%", date: "Jan 14, 2025" }
                    ].map((row, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors">
                            <div className="col-span-1 text-white/60">{index + 1}</div>
                            <div className="col-span-5 flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-700 rounded flex-shrink-0" />
                                <span className="font-medium text-white">{row.name}</span>
                            </div>
                            <div className="col-span-2 text-right text-white/80">{row.downloads}</div>
                            <div className="col-span-2 text-right text-white/80">{row.plays}</div>
                            <div className="col-span-2 text-right text-white/80">{row.conv}</div>
                        </div>
                    ))}
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
