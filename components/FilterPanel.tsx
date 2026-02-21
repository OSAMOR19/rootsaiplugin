"use client"

import { motion } from "framer-motion"
import { useState } from "react"

export default function FilterPanel() {
  const [filters, setFilters] = useState({
    key: "all",
    bpm: [60, 140],
    genre: "all",
    duration: "all",
    mood: "all",
  })

  const keys = ["All", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  const genres = ["All", "Hip Hop", "Electronic", "Rock", "Jazz", "Classical", "Ambient"]
  const moods = ["All", "Energetic", "Chill", "Dark", "Uplifting", "Mysterious"]

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Filters</h3>

      {/* Key Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Key</label>
        <div className="grid grid-cols-4 gap-2">
          {keys.map((key) => (
            <motion.button
              key={key}
              className={`p-2 text-sm rounded-lg transition-colors ${
                filters.key === key.toLowerCase()
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 hover:bg-green-50 text-gray-700"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilters({ ...filters, key: key.toLowerCase() })}
            >
              {key}
            </motion.button>
          ))}
        </div>
      </div>

      {/* BPM Range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">BPM Range</label>
        <div className="px-3">
          <input
            type="range"
            min="60"
            max="180"
            value={filters.bpm[1]}
            onChange={(e) => setFilters({ ...filters, bpm: [filters.bpm[0], Number.parseInt(e.target.value)] })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{filters.bpm[0]} BPM</span>
            <span>{filters.bpm[1]} BPM</span>
          </div>
        </div>
      </div>

      {/* Genre Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
        <select
          value={filters.genre}
          onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          {genres.map((genre) => (
            <option key={genre} value={genre.toLowerCase()}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      {/* Mood Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mood</label>
        <div className="space-y-2">
          {moods.map((mood) => (
            <motion.button
              key={mood}
              className={`w-full p-2 text-left text-sm rounded-lg transition-colors ${
                filters.mood === mood.toLowerCase()
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 hover:bg-green-50 text-gray-700"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilters({ ...filters, mood: mood.toLowerCase() })}
            >
              {mood}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Clear Filters */}
      <motion.button
        className="w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() =>
          setFilters({
            key: "all",
            bpm: [60, 140],
            genre: "all",
            duration: "all",
            mood: "all",
          })
        }
      >
        Clear All Filters
      </motion.button>
    </div>
  )
}
