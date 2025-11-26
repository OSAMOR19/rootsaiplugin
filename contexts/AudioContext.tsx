"use client"

import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react'

export interface AnalysisData {
  detectedBPM: number
  detectedKey: string
  recommendations: any[]
  recordedAudioBuffer?: AudioBuffer
}

export interface Track {
  id: string
  title: string
  artist: string
  audioUrl: string
  imageUrl?: string
  duration?: string
}

interface AudioContextType {
  analysisData: AnalysisData | null
  setAnalysisData: (data: AnalysisData | null) => void
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number
  playTrack: (track: Track) => void
  pauseTrack: () => void
  resumeTrack: () => void
  togglePlay: () => void
  seekTo: (time: number) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()

      audioRef.current.onended = () => setIsPlaying(false)

      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      }

      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0)
      }
    }
  }, [])

  const playTrack = (track: Track) => {
    if (audioRef.current) {
      if (currentTrack?.id === track.id) {
        togglePlay()
        return
      }

      audioRef.current.src = track.audioUrl
      audioRef.current.play()
      setCurrentTrack(track)
      setIsPlaying(true)
    }
  }

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resumeTrack = () => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const togglePlay = () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      resumeTrack()
    }
  }

  const seekTo = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  return (
    <AudioContext.Provider value={{
      analysisData,
      setAnalysisData,
      currentTrack,
      isPlaying,
      currentTime,
      duration,
      playTrack,
      pauseTrack,
      resumeTrack,
      togglePlay,
      seekTo
    }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

