"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronDown } from "lucide-react"

interface BulkEditModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onApply: (edits: BulkEditData) => void
}

export interface BulkEditData {
  genres?: string[]
  instruments?: string[]
  keywords?: string[]
  tempo?: number
  key?: string
}

const genreOptions = [
  'Afrobeat', 'Amapiano', 'Hip Hop', 'Trap', 'House', 'Tech House',
  'Deep House', 'Drill', 'R&B', 'Soul', 'Funk', 'Jazz', 'Pop',
  'Electronic', 'Techno', 'Trance', 'EDM', 'Dancehall', 'Reggae'
]

const instrumentOptions = [
  'Drums', 'Kicks', 'Snares', 'Hats', 'Percussion', 'Shakers',
  'Bass', 'Synth', 'Keys', 'Piano', 'Guitar', 'Strings',
  'Brass', 'Woodwinds', 'Vocals', 'FX', 'Pads', 'Leads'
]

const keywordOptions = [
  'energetic', 'groovy', 'upbeat', 'chill', 'dark', 'melodic',
  'hard', 'soft', 'bouncy', 'soulful', 'epic', 'atmospheric',
  'aggressive', 'smooth', 'punchy', 'warm', 'crisp', 'clean',
  'dirty', 'vintage', 'modern', 'analog', 'digital', 'live',
  'loops', 'one-shots', 'layered', 'minimal', 'heavy', 'light'
]

export default function BulkEditModal({ isOpen, onClose, selectedCount, onApply }: BulkEditModalProps) {
  const [genres, setGenres] = useState<string[]>([])
  const [instruments, setInstruments] = useState<string[]>([])
  const [keywords, setKeywords] = useState<string[]>([])
  const [showMoreEdits, setShowMoreEdits] = useState(false)
  const [showGenreDropdown, setShowGenreDropdown] = useState(false)
  const [showInstrumentDropdown, setShowInstrumentDropdown] = useState(false)
  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false)

  const addGenre = (genre: string) => {
    if (!genres.includes(genre)) {
      setGenres([...genres, genre])
    }
    setShowGenreDropdown(false)
  }

  const removeGenre = (genre: string) => {
    setGenres(genres.filter(g => g !== genre))
  }

  const addInstrument = (instrument: string) => {
    if (!instruments.includes(instrument)) {
      setInstruments([...instruments, instrument])
    }
    setShowInstrumentDropdown(false)
  }

  const removeInstrument = (instrument: string) => {
    setInstruments(instruments.filter(i => i !== instrument))
  }

  const addKeyword = (keyword: string) => {
    if (!keywords.includes(keyword)) {
      setKeywords([...keywords, keyword])
    }
    setShowKeywordDropdown(false)
  }

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter(k => k !== keyword))
  }

  const handleApply = () => {
    onApply({
      genres: genres.length > 0 ? genres : undefined,
      instruments: instruments.length > 0 ? instruments : undefined,
      keywords: keywords.length > 0 ? keywords : undefined,
    })
    
    // Reset and close
    setGenres([])
    setInstruments([])
    setKeywords([])
    setShowMoreEdits(false)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: 100 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: 100 }}
            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-gradient-to-b from-gray-900 to-black border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-white/60" />
                </button>
                <h2 className="text-2xl font-bold text-white">
                  Edit {selectedCount} sample{selectedCount !== 1 ? 's' : ''}
                </h2>
              </div>
              
              <button
                onClick={handleApply}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold transition-colors"
              >
                Apply
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Genres */}
              <div>
                <label className="block text-white font-medium mb-3">Genres</label>
                <div className="space-y-3">
                  {/* Selected Genres */}
                  <div className="flex flex-wrap gap-2 min-h-[44px] p-3 bg-white/5 border border-white/10 rounded-lg">
                    {genres.map(genre => (
                      <span
                        key={genre}
                        className="px-3 py-1.5 bg-white/10 text-white rounded-full text-sm flex items-center gap-2 group"
                      >
                        {genre}
                        <button
                          onClick={() => removeGenre(genre)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {genres.length === 0 && (
                      <span className="text-white/40 text-sm py-1.5">No genres selected</span>
                    )}
                  </div>

                  {/* Genre Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                      className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left flex items-center justify-between transition-colors"
                    >
                      <span className="text-white/60">Add genre...</span>
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    </button>

                    {showGenreDropdown && (
                      <div className="absolute top-full mt-2 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                        {genreOptions.map(genre => (
                          <button
                            key={genre}
                            onClick={() => addGenre(genre)}
                            className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors"
                            disabled={genres.includes(genre)}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Instruments */}
              <div>
                <label className="block text-white font-medium mb-3">Instruments</label>
                <div className="space-y-3">
                  {/* Selected Instruments */}
                  <div className="flex flex-wrap gap-2 min-h-[44px] p-3 bg-white/5 border border-white/10 rounded-lg">
                    {instruments.map(instrument => (
                      <span
                        key={instrument}
                        className="px-3 py-1.5 bg-white/10 text-white rounded-full text-sm flex items-center gap-2 group"
                      >
                        {instrument}
                        <button
                          onClick={() => removeInstrument(instrument)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {instruments.length === 0 && (
                      <span className="text-white/40 text-sm py-1.5">No instruments selected</span>
                    )}
                  </div>

                  {/* Instrument Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowInstrumentDropdown(!showInstrumentDropdown)}
                      className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left flex items-center justify-between transition-colors"
                    >
                      <span className="text-white/60">Add instrument...</span>
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    </button>

                    {showInstrumentDropdown && (
                      <div className="absolute top-full mt-2 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                        {instrumentOptions.map(instrument => (
                          <button
                            key={instrument}
                            onClick={() => addInstrument(instrument)}
                            className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors"
                            disabled={instruments.includes(instrument)}
                          >
                            {instrument}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-white font-medium mb-3">Keywords</label>
                <div className="space-y-3">
                  {/* Selected Keywords */}
                  <div className="flex flex-wrap gap-2 min-h-[44px] p-3 bg-white/5 border border-white/10 rounded-lg">
                    {keywords.map(keyword => (
                      <span
                        key={keyword}
                        className="px-3 py-1.5 bg-white/10 text-white rounded-full text-sm flex items-center gap-2 group"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    {keywords.length === 0 && (
                      <span className="text-white/40 text-sm py-1.5">No keywords selected</span>
                    )}
                  </div>

                  {/* Keyword Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowKeywordDropdown(!showKeywordDropdown)}
                      className="w-full px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left flex items-center justify-between transition-colors"
                    >
                      <span className="text-white/60">Add keyword...</span>
                      <ChevronDown className="w-4 h-4 text-white/40" />
                    </button>

                    {showKeywordDropdown && (
                      <div className="absolute top-full mt-2 w-full bg-gray-800 border border-white/10 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                        {keywordOptions.map(keyword => (
                          <button
                            key={keyword}
                            onClick={() => addKeyword(keyword)}
                            className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 transition-colors"
                            disabled={keywords.includes(keyword)}
                          >
                            {keyword}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Add More Edits (Expandable) */}
              <div>
                <button
                  onClick={() => setShowMoreEdits(!showMoreEdits)}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white flex items-center gap-2 transition-colors"
                >
                  <span>Add more edits</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showMoreEdits ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showMoreEdits && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-2 overflow-hidden"
                    >
                      <button className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left transition-colors">
                        Genre
                      </button>
                      <button className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left transition-colors">
                        Instrument
                      </button>
                      <button className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left transition-colors">
                        Keywords
                      </button>
                      <button className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left transition-colors">
                        Pricing
                      </button>
                      <button className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white text-left transition-colors">
                        License
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Preview Summary */}
              {(genres.length > 0 || instruments.length > 0 || keywords.length > 0) && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-green-400 text-sm font-medium mb-2">
                    Changes to be applied to {selectedCount} sample{selectedCount !== 1 ? 's' : ''}:
                  </p>
                  <ul className="text-white/60 text-sm space-y-1">
                    {genres.length > 0 && (
                      <li>• Genres: {genres.join(', ')}</li>
                    )}
                    {instruments.length > 0 && (
                      <li>• Instruments: {instruments.join(', ')}</li>
                    )}
                    {keywords.length > 0 && (
                      <li>• Keywords: {keywords.join(', ')}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            {/* Close overlay on outside click */}
            {(showGenreDropdown || showInstrumentDropdown || showKeywordDropdown) && (
              <div
                className="fixed inset-0 z-10"
                onClick={() => {
                  setShowGenreDropdown(false)
                  setShowInstrumentDropdown(false)
                  setShowKeywordDropdown(false)
                }}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

