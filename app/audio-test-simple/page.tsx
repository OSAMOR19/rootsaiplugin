"use client"

import { useState } from 'react'

export default function AudioTestPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAudio = () => {
    const audio = new Audio('/audio/Full Drums/Manifxtsounds - Scata Drum Loop 120BPM.wav')
    
    audio.addEventListener('loadstart', () => {
      console.log('Audio loading started')
    })
    
    audio.addEventListener('loadeddata', () => {
      console.log('Audio data loaded')
    })
    
    audio.addEventListener('canplay', () => {
      console.log('Audio can play')
    })
    
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
      setError('Audio failed to load')
    })
    
    audio.addEventListener('play', () => {
      console.log('Audio started playing')
      setIsPlaying(true)
    })
    
    audio.addEventListener('pause', () => {
      console.log('Audio paused')
      setIsPlaying(false)
    })
    
    audio.play().catch(err => {
      console.error('Play failed:', err)
      setError(`Play failed: ${err.message}`)
    })
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Audio Test</h1>
        
        <button
          onClick={testAudio}
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          {isPlaying ? 'Playing...' : 'Test Audio'}
        </button>
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Check the browser console for detailed logs.</p>
          <p>File: /audio/Full Drums/Manifxtsounds - Scata Drum Loop 120BPM.wav</p>
        </div>
      </div>
    </div>
  )
}