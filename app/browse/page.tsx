"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, Filter, Grid, List } from "lucide-react"
import { useRouter } from "next/navigation"
import SampleGrid from "@/components/SampleGrid"
import FilterPanel from "@/components/FilterPanel"
import Sidebar from "@/components/Sidebar"
import { mockSampleCategories, mockSamples } from "@/lib/mockData"

export default function BrowsePage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)

  // Filter samples based on search query and selected category
  const filteredSamples = mockSamples.filter((sample) => {
    // First filter by search query
    const matchesSearch = 
      sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.artist.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Then filter by selected category
    if (selectedCategory === "all") {
      return matchesSearch
    }
    
    // Check if sample category matches selected category
    const matchesCategory = sample.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const handleBack = () => {
    router.push("/")
  }

  const handleSamplePlay = (sampleId: string) => {
    setCurrentlyPlaying(currentlyPlaying === sampleId ? null : sampleId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-green-50">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                 Drum Library
              </h1>
              <p className="text-sm text-gray-600">
                {filteredSamples.length} of {mockSamples.length} drum loops
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search drum loops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list" ? "bg-white shadow-sm" : "hover:bg-gray-200"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filters */}
            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </motion.button>
          </div>
        </div>


      </motion.header>

      <div className="flex">
        {/* Category Sidebar */}
        <Sidebar 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* Filter Sidebar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200 p-6"
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <FilterPanel />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 p-6">
          {filteredSamples.length > 0 ? (
            <SampleGrid
              viewMode={viewMode}
              samples={filteredSamples}
              currentlyPlaying={currentlyPlaying}
              onSamplePlay={handleSamplePlay}
            />
          ) : (
            <motion.div className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="text-gray-400 mb-2">
                <Search className="w-12 h-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No samples found</h3>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
