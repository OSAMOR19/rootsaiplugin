"use client"

import type React from "react"

import { motion } from "framer-motion"
import { Play, Pause } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface RelatedSamplesProps {
  currentSample: any
}

export default function RelatedSamples({ currentSample }: RelatedSamplesProps) {
  const router = useRouter()
  const [playingSample, setPlayingSample] = useState<string | null>(null)

  // Mock related samples
  const relatedSamples = [
    {
      id: "related-1",
      name: "Similar Guitar Riff",
      artist: "Various Artists",
      key: "F Maj",
      bpm: 82,
      duration: "0:06",
    },
    {
      id: "related-2",
      name: "Melodic Guitar Loop",
      artist: "Guitar Masters",
      key: "F Maj",
      bpm: 78,
      duration: "0:04",
    },
    {
      id: "related-3",
      name: "Soul Guitar Phrase",
      artist: "Soul Collective",
      key: "F Maj",
      bpm: 80,
      duration: "0:05",
    },
  ]

  const handleSampleClick = (sampleId: string) => {
    router.push(`/sample/${sampleId}`)
  }

  const handlePlayPause = (sampleId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPlayingSample(playingSample === sampleId ? null : sampleId)
  }

  return (
    <motion.div
      className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h3 className="text-lg font-semibold mb-4">Related Samples</h3>
      <div className="space-y-3">
        {relatedSamples.map((sample) => (
          <motion.div
            key={sample.id}
            className="p-3 bg-gray-50 hover:bg-green-50 rounded-lg cursor-pointer transition-colors group"
            whileHover={{ scale: 1.02 }}
            onClick={() => handleSampleClick(sample.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{sample.name}</h4>
                <p className="text-xs text-gray-600 truncate">{sample.artist}</p>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                  <span>{sample.key}</span>
                  <span>•</span>
                  <span>{sample.bpm} BPM</span>
                  <span>•</span>
                  <span>{sample.duration}</span>
                </div>
              </div>
              <motion.button
                onClick={(e) => handlePlayPause(sample.id, e)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  playingSample === sample.id
                    ? "bg-green-500 text-white"
                    : "bg-white text-gray-600 group-hover:bg-green-50 group-hover:text-green-600"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {playingSample === sample.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
