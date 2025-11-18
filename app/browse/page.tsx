"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Search, Grid, List, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"
import SampleGrid from "@/components/SampleGrid"
import { mockSamples } from "@/lib/mockData"

const categories = [
  { id: 'all', name: 'All Drums', count: mockSamples.length },
  { id: 'full-drums', name: 'Full Drums', count: mockSamples.filter(s => s.category?.toLowerCase().includes('full')).length },
  { id: 'top-loops', name: 'Top Loops', count: mockSamples.filter(s => s.category?.toLowerCase().includes('top')).length },
  { id: 'kick-loops', name: 'Kick Loops', count: mockSamples.filter(s => s.category?.toLowerCase().includes('kick')).length },
  { id: 'shaker-loops', name: 'Shaker Loops', count: mockSamples.filter(s => s.category?.toLowerCase().includes('shaker')).length },
  { id: 'fills-rolls', name: 'Fills & Rolls', count: mockSamples.filter(s => s.category?.toLowerCase().includes('fill')).length },
  { id: 'percussions', name: 'Percussions', count: mockSamples.filter(s => s.category?.toLowerCase().includes('percussion')).length }
]

export default function BrowsePage() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Check scroll position
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  // Filter samples based on search query and selected category
  const filteredSamples = mockSamples.filter((sample) => {
    const matchesSearch =
      sample.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sample.artist.toLowerCase().includes(searchQuery.toLowerCase())

    if (selectedCategory === "all") {
      return matchesSearch
    }

    const matchesCategory = sample.category?.toLowerCase().includes(selectedCategory.replace('-', ' ').replace('fills-rolls', 'fill'))

    return matchesSearch && matchesCategory
  })

  const handleBack = () => {
    router.push("/")
  }

  const handleSamplePlay = (sampleId: string) => {
    setCurrentlyPlaying(currentlyPlaying === sampleId ? null : sampleId)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
      {/* Premium Glass Header */}
      <motion.header
        className="sticky top-0 z-50 backdrop-blur-2xl bg-white/5 border-b border-white/10 shadow-2xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-[1920px] mx-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            {/* Left Section */}
            <div className="flex items-center space-x-6">
              <motion.button
                onClick={handleBack}
                className="p-3 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/10 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-green-300 to-teal-400 bg-clip-text text-transparent">
                  Sound Library
                </h1>
                <p className="text-sm text-white/60 mt-1">
                  {filteredSamples.length} {filteredSamples.length === 1 ? 'sample' : 'samples'} • Premium African Drum Sounds
                </p>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40 group-hover:text-emerald-400 transition-colors" />
                <input
                  type="text"
                  placeholder="Search sounds..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-3 w-80 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-300"
                />
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl p-1.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === "grid"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2.5 rounded-lg transition-all duration-300 ${
                    viewMode === "list"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Filters Button */}
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl backdrop-blur-xl border transition-all duration-300 ${
                  showFilters
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30"
                    : "bg-white/10 text-white/90 border-white/10 hover:bg-white/20"
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="font-medium">Filters</span>
              </motion.button>
            </div>
          </div>

          {/* Horizontal Scrolling Categories - Splice Style */}
          <div className="relative">
            {/* Left Scroll Button */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gradient-to-r from-slate-950 to-transparent flex items-center justify-center"
              >
                <div className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 transition-all">
                  <ChevronLeft className="w-4 h-4 text-white" />
                </div>
              </button>
            )}

            {/* Categories Scroll Container */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex space-x-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex-shrink-0 px-6 py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 border border-emerald-400"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10 backdrop-blur-xl"
                  }`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {category.name}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    selectedCategory === category.id
                      ? "bg-white/20"
                      : "bg-white/10"
                  }`}>
                    {category.count}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Right Scroll Button */}
            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-gradient-to-l from-slate-950 to-transparent flex items-center justify-center"
              >
                <div className="w-8 h-8 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 transition-all">
                  <ChevronRight className="w-4 h-4 text-white" />
                </div>
              </button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-8 py-8">
        {/* Advanced Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="mb-8 p-6 rounded-2xl bg-white/5 backdrop-blur-2xl border border-white/10"
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">BPM Range</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">Key</label>
                  <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <option>All Keys</option>
                    <option>C Major</option>
                    <option>A Minor</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">Duration</label>
                  <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <option>Any Length</option>
                    <option>Under 10s</option>
                    <option>10s - 30s</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-white/70 mb-2 block">Sort By</label>
                  <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50">
                    <option>Most Recent</option>
                    <option>Most Popular</option>
                    <option>BPM (Low to High)</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {filteredSamples.length > 0 ? (
          <SampleGrid
            viewMode={viewMode}
            samples={filteredSamples}
            currentlyPlaying={currentlyPlaying}
            onSamplePlay={handleSamplePlay}
          />
        ) : (
          <motion.div
            className="text-center py-24 px-8"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                <Search className="w-10 h-10 text-white/40" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No sounds found</h3>
              <p className="text-white/60">Try adjusting your search query or filters to discover more sounds</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
