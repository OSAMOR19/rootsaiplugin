"use client"

import { useState, useEffect } from "react"
import { Search, Filter, MoreVertical, Trash2 } from "lucide-react"
import { useSamples } from "@/hooks/useSamples"
import { usePacks } from "@/hooks/usePacks"

import { useRouter } from "next/navigation"

interface PackRow {
    id: string
    name: string
    status: string
    type: string
    fileCount: number
    dateAdded: string
    imageUrl?: string
}

export default function PacksPage() {
    const router = useRouter()
    const { samples, loading } = useSamples({ autoFetch: true })
    const { packs: packsData, loading: packsLoading } = usePacks()
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
                    id: category, // Using category name as ID for filtering
                    firstImage: sample.imageUrl
                }
            }
            acc[category].count++
            // Keep the most recent date
            if (sample.uploadedAt && new Date(sample.uploadedAt) > new Date(acc[category].lastDate)) {
                acc[category].lastDate = sample.uploadedAt
            }
            return acc
        }, {} as Record<string, { count: number, lastDate: string, id: string, firstImage?: string }>)

        const packRows: PackRow[] = Object.entries(grouped).map(([category, data]) => {
            // Find specific pack metadata (cover image)
            const packMeta = packsData.find((p: any) => p.title === category || p.name === category)
            // Priority: Pack Metadata Cover -> First Sample Image -> Placeholder
            const coverImage = (packMeta?.coverImage && packMeta.coverImage !== '/placeholder.jpg' ? packMeta.coverImage : null) ||
                (data.firstImage && data.firstImage !== '/placeholder.jpg' ? data.firstImage : null) ||
                '/placeholder.jpg'

            return {
                id: data.id,
                name: category,
                status: "Active",
                type: "Samples",
                fileCount: data.count,
                dateAdded: new Date(data.lastDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }),
                imageUrl: coverImage
            }
        })

        setPacks(packRows)
    }, [samples, loading, packsData])

    const filteredPacks = packs.filter(pack =>
        pack.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const [packToDelete, setPackToDelete] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // ... (useEffect remains same) ...

    const handleDeletePack = (e: React.MouseEvent, packId: string) => {
        e.stopPropagation()
        setPackToDelete(packId)
    }

    const confirmDelete = async () => {
        if (!packToDelete) return
        setIsDeleting(true)

        try {
            const response = await fetch('/api/admin/delete-pack', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: packToDelete }),
            })

            if (!response.ok) throw new Error('Delete failed')

            // Optimistic UI update
            setPacks(prev => prev.filter(p => p.id !== packToDelete))
            setPackToDelete(null)

        } catch (error) {
            console.error('Delete error:', error)
            alert('Failed to delete pack')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6 relative">
            {/* ... (Header and Table remain the same) ... */}
            {/* Table Header/Content code ... (just pasting the part that renders children to avoid full replacement if tool is smart, else I will replace full return if needed, but I should use StartLine/EndLine carefully) */}

            {/* Wait, the task is to replace the file content significantly or add the modal. Let's effectively keep the main structure but append the modal at the end. */}

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
                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-gray-800 to-gray-700 flex-shrink-0 overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={pack.imageUrl || '/placeholder.jpg'}
                                            alt={pack.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement
                                                target.src = '/placeholder.jpg'
                                            }}
                                        />
                                    </div>
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
                                    <button
                                        onClick={(e) => handleDeletePack(e, pack.id)}
                                        className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {packToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPackToDelete(null)} />
                    <div className="relative bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl flex flex-col items-center">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
                            <Trash2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Delete Pack?</h3>
                        <p className="text-white/60 mb-8 text-sm">
                            Are you sure you want to delete <span className="text-white font-medium">"{packs.find(p => p.id === packToDelete)?.name}"</span>?
                            <br />This action cannot be undone.
                        </p>

                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setPackToDelete(null)}
                                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all text-sm"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
