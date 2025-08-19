"use client"

import { useState, useRef } from 'react'

export default function SimpleAudioTest() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const testAudioFiles = [
    "/audio/Full Drums/Manifxtsounds - Scata Drum Loop 120BPM.wav",
    "/audio/Top Loops/Manifxtsounds - B Riddim Top Loop 116BPM.wav",
    "/audio/Kick Loops/Manifxtsounds - Scata Kick 120BPM.wav",
    "/audio/Shaker Loops/Manifxtsounds - Sapa Shaker Loop 110BPM.wav",
    "/audio/Fills & Rolls/Manifxtsounds - Colours Drum Fill 110BPM.wav",
    "/audio/Percussions/Manifxtsounds - High Perc Loop 116BPM.wav"
  ]

  const handlePlayPause = async () => {
    if (!audioRef.current) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Audio error:', error)
      alert(`Audio error: ${error}`)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (audioRef.current) {
      audioRef.current.src = event.target.value
      audioRef.current.load()
      setIsPlaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Simple Audio Test</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Audio File:</label>
            <select 
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {testAudioFiles.map((file, index) => (
                <option key={index} value={file}>
                  {file.split('/').pop()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <span className="text-sm text-gray-600">
              Status: {isPlaying ? 'Playing' : 'Stopped'}
            </span>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Native Audio Controls:</h3>
            <audio
              ref={audioRef}
              controls
              className="w-full"
              onError={(e) => console.error('Audio error:', e)}
              onLoadStart={() => console.log('Loading audio...')}
              onCanPlay={() => console.log('Audio can play')}
              onPlay={() => console.log('Audio started playing')}
            >
              Your browser does not support the audio element.
            </audio>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h3 className="font-medium mb-2">Debug Info:</h3>
            <p className="text-sm text-gray-600">
              Current source: {audioRef.current?.src || 'None'}
            </p>
            <p className="text-sm text-gray-600">
              Ready state: {audioRef.current?.readyState || 'Unknown'}
            </p>
            <p className="text-sm text-gray-600">
              Duration: {audioRef.current?.duration || 'Unknown'} seconds
            </p>
          </div>

          <div className="mt-4">
            <h3 className="font-medium mb-2">Direct File Links:</h3>
            <div className="space-y-2">
              {testAudioFiles.map((file, index) => (
                <a
                  key={index}
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-500 hover:text-blue-700 text-sm"
                >
                  {file.split('/').pop()}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
