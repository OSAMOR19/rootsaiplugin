"use client"

import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, ArrowLeft } from "lucide-react"
import { motion } from "framer-motion"

// Data definition with Groups
const EXPLORE_DATA: Record<string, { label: string, description: string, groups: { title: string, items: string[] }[] }> = {
    "genres": {
        label: "Genres",
        description: "Explore sounds by musical genre",
        groups: [
            {
                title: "Afro & World",
                items: ["Afrobeats", "Amapiano", "Afro-house", "World"]
            }
        ]
    },
    "drum-type": {
        label: "Drum Type",
        description: "Find the perfect drum loop or hit",
        groups: [
            {
                title: "Loops",
                items: ["Full Drum Loop", "Top Loop", "Kick Loop", "Snare Loop", "Hat Loop", "Percussion Loop", "Shaker Loop"]
            },
            {
                title: "One Shots & Fills",
                items: ["Drum One-Shot", "Fill"]
            }
        ]
    },
    "percussions": {
        label: "Percussions",
        description: "Add texture with organic percussions",
        groups: [
            {
                title: "Organic Percussion",
                items: ["Shakers", "Conga", "Djembe", "Bongo", "Woodblock"]
            },
            {
                title: "Metallic & Shakers",
                items: ["Cabasa", "Cowbell", "Triangle", "Chimes"]
            }
        ]
    },
    "styles": {
        label: "Styles",
        description: "Browse by mood and characteristic",
        groups: [
            {
                title: "Keywords",
                items: ["Acoustic", "Chill", "Epic", "Energetic", "Experimental", "Groovy", "Mellow", "Percussive"]
            }
        ]
    }
}

export default function ExploreCategoryPage() {
    const params = useParams()
    const router = useRouter()
    const categoryId = params.category as string

    // Fallback if ID not found, though clicking from Browse header ensures it exists
    const categoryData = EXPLORE_DATA[categoryId]

    if (!categoryData) {
        return (
            <div className="p-8 text-gray-900 dark:text-white">
                <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
                <button onClick={() => router.back()} className="text-sm text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white underline">Go Back</button>
            </div>
        )
    }

    const handleSubClick = (subItem: string) => {
        // Map category ID to the filter type used in Sounds Page
        const query = new URLSearchParams()

        if (categoryId === 'genres') query.set('genre', subItem)
        else if (categoryId === 'drum-type') query.set('drumType', subItem)
        else if (categoryId === 'percussions') query.set('instrument', subItem)
        else if (categoryId === 'styles') query.set('keyword', subItem)
        else query.set('query', subItem)

        router.push(`/sounds?${query.toString()}`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 text-gray-900 dark:text-white transition-colors duration-300 p-6">
            <button
                onClick={() => router.push('/browse')}
                className="flex items-center text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white mb-8 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Explore
            </button>

            <div className="mb-10">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{categoryData.label}</h1>
                <p className="text-xl text-gray-600 dark:text-white/60">{categoryData.description}</p>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryData.groups.map((group, groupIndex) => (
                    <motion.div
                        key={group.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: groupIndex * 0.1 }}
                        className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl p-6 hover:bg-gray-50 dark:hover:bg-white/[0.07] transition-colors"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-white/10">{group.title}</h2>
                        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                            {group.items.map((item, i) => (
                                <button
                                    key={item}
                                    onClick={() => handleSubClick(item)}
                                    className="text-left text-gray-600 dark:text-white/60 hover:text-gray-900 dark:hover:text-white transition-colors text-sm py-1"
                                >
                                    {item}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
