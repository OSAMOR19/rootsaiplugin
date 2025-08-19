"use client"

import { useState, useMemo } from 'react'
import DraggableSample from '../../components/DraggableSample'
import AudioFileUpload from '../../components/AudioFileUpload'
// import { mockSamples } from '../../lib/mockData' // Temporarily disabled to fix build

interface AudioFile {
  id: string
  name: string
  url: string
  category: string
  bpm: number
  duration: string
  artist: string
  waveform: number[]
}

export default function AudioDemoPage() {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)

  const handleAudioFileSelect = (audioUrl: string, fileName: string) => {
    const newAudioFile: AudioFile = {
      id: `audio-${Date.now()}`,
      name: fileName,
      url: audioUrl,
      category: 'Custom Audio',
      bpm: 120, // You could analyze the audio to get real BPM
      duration: '0:30', // You could get real duration from audio metadata
      artist: 'Local File',
      waveform: Array.from({ length: 20 }, () => Math.random() * 100), // Mock waveform
    }
    
    setAudioFiles(prev => [...prev, newAudioFile])
  }

  const handlePlayPause = (sampleId: string) => {
    if (currentlyPlaying === sampleId) {
      setCurrentlyPlaying(null)
    } else {
      setCurrentlyPlaying(sampleId)
    }
  }

  // For now, just use uploaded audio files to avoid build issues
  const allSamples = audioFiles

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Audio Loop Player
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Upload your local audio files and play them with real-time progress tracking
          </p>
        </div>

        {/* Audio Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Upload Audio Files
          </h2>
          <AudioFileUpload onAudioFileSelect={handleAudioFileSelect} />
        </div>

        {/* Samples Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            All Samples ({allSamples.length})
          </h2>
          
          <div className="grid gap-4">
            {allSamples.map((sample, index) => (
              <DraggableSample
                key={sample.id}
                sample={sample}
                isPlaying={currentlyPlaying === sample.id}
                onPlayPause={() => handlePlayPause(sample.id)}
                index={index}
                audioUrl={sample.audioUrl || sample.url} // Use audioUrl if available, fallback to url
              />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to Use
          </h3>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1 text-sm">
            <li>• Upload your audio files using the upload area above</li>
            <li>• Click the play button on any sample to start playback</li>
            <li>• The progress bar shows real-time playback progress</li>
            <li>• Only one sample can play at a time</li>
            <li>• Drag samples to your DAW (drag functionality)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
