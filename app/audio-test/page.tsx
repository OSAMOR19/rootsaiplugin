"use client"

import { useState, useRef } from 'react'

export default function AudioTestPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const testAudioFiles = [
    "/audio/Full Drums/Manifxtsounds - Scata Drum Loop 120BPM.wav",
    "/audio/Top Loops/Manifxtsounds - B Riddim Top Loop 116BPM.wav",
    "/audio/Kick Loops/Manifxtsounds - Scata Kick 120BPM.wav"
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
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Audio Test Page</h1>
        
        <div className="space-y-6">
          {/* File Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Select Audio File:</label>
            <select 
              onChange={handleFileChange}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="">Choose a file...</option>
              {testAudioFiles.map((file, index) => (
                <option key={index} value={file}>
                  {file.split('/').pop()}
                </option>
              ))}
            </select>
          </div>

          {/* Audio Controls */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePlayPause}
              className={`px-6 py-3 rounded-lg font-medium ${
                isPlaying 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <div className="text-sm text-gray-600">
              Status: {isPlaying ? 'Playing' : 'Stopped'}
            </div>
          </div>

          {/* Native Audio Element */}
          <div>
            <label className="block text-sm font-medium mb-2">Native Audio Controls:</label>
            <audio
              ref={audioRef}
              controls
              className="w-full"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={(e) => console.error('Audio error:', e)}
            >
              Your browser does not support the audio element.
            </audio>
          </div>

          {/* Debug Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Debug Information:</h3>
            <div className="text-sm space-y-1">
              <div>Audio Element: {audioRef.current ? 'Loaded' : 'Not loaded'}</div>
              <div>Current Source: {audioRef.current?.src || 'None'}</div>
              <div>Ready State: {audioRef.current?.readyState || 'Unknown'}</div>
              <div>Network State: {audioRef.current?.networkState || 'Unknown'}</div>
            </div>
          </div>

          {/* Test Links */}
          <div>
            <h3 className="font-medium mb-2">Direct File Links:</h3>
            <div className="space-y-2">
              {testAudioFiles.map((file, index) => (
                <a
                  key={index}
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:text-blue-800 text-sm"
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
