"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MoreVertical, Trash2 } from "lucide-react"
import { useSamples } from "@/hooks/useSamples"

import { useRouter } from "next/navigation"

interface PackRow {
    id: string
    name: string
    status: string
    type: string
    fileCount: number
    dateAdded: string
}

export default function PacksPage() {
    const router = useRouter()
    const { samples, loading } = useSamples({ autoFetch: true })
    const [packs, setPacks] = useState<PackRow[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        if (loading || !samples.length) return

        // Group samples by Category to form "Packs"
        const grouped = samples.reduce((acc, sample) => {
            const category = sample.category || "Uncategorized"
            if (!acc[category]) {
                acc[category] = {
                    count: 0,
                    lastDate: sample.uploadedAt || new Date().toISOString(),
                    id: category // Using category name as ID for filtering
                }
            }
            acc[category].count++
            // Keep the most recent date
            if (sample.uploadedAt && new Date(sample.uploadedAt) > new Date(acc[category].lastDate)) {
                acc[category].lastDate = sample.uploadedAt
            }
            return acc
        }, {} as Record<string, { count: number, lastDate: string, id: string }>)

        const packRows: PackRow[] = Object.entries(grouped).map(([category, data]) => ({
            id: data.id,
            name: category,
            status: "Active",
            type: "Samples",
            fileCount: data.count,
            dateAdded: new Date(data.lastDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            })
        }))

        setPacks(packRows)
    }, [samples, loading])

    const filteredPacks = packs.filter(pack =>
        pack.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">My Packs</h2>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <input
                            type="text"
                            placeholder="Search packs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-white/30 transition-colors w-64"
                        />
                    </div>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-xs font-medium text-white/40 uppercase tracking-wider">
                    <div className="col-span-4">Pack</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2">Pack Type</div>
                    <div className="col-span-2"># of Files</div>
                    <div className="col-span-2 text-right">Date Added</div>
                </div>

                <div className="divide-y divide-white/5">
                    {loading ? (
                        <div className="p-8 text-center text-white/40">Loading packs...</div>
                    ) : filteredPacks.length === 0 ? (
                        <div className="p-8 text-center text-white/40">No packs found</div>
                    ) : (
                        filteredPacks.map((pack) => (
                            <div
                                key={pack.id}
                                onClick={() => router.push(`/admin/edit-pack/${encodeURIComponent(pack.id)}`)}
                                className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group cursor-pointer"
                            >
                                <div className="col-span-4 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-gray-800 to-gray-700 flex-shrink-0" />
                                    <span className="font-medium text-white">{pack.name}</span>
                                </div>
                                <div className="col-span-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
                                        {pack.status}
                                    </span>
                                </div>
                                <div className="col-span-2 text-white/60 text-sm">
                                    {pack.type}
                                </div>
                                <div className="col-span-2 text-white/60 text-sm pl-4">
                                    {pack.fileCount}
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-3 text-white/60">
                                    <span className="text-sm">{pack.dateAdded}</span>
                                    <button className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
