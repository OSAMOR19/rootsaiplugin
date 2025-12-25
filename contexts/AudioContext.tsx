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

  const playTrack = async (track: Track) => {
    if (audioRef.current) {
      if (currentTrack?.id === track.id) {
        togglePlay()
        return
      }

      try {
        audioRef.current.src = track.audioUrl
        audioRef.current.load() // Ensure new source is loaded

        const playPromise = audioRef.current.play()

        if (playPromise !== undefined) {
          await playPromise
          setCurrentTrack(track)
          setIsPlaying(true)
        }
      } catch (error) {
        console.error("Playback failed:", error)
        setIsPlaying(false)
        // Verify if URL is valid or empty
        if (!track.audioUrl) {
          console.error("Track has no audio URL")
        }
      }
    }
  }

  const pauseTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const resumeTrack = async () => {
    if (audioRef.current && currentTrack) {
      try {
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
          await playPromise
          setIsPlaying(true)
        }
      } catch (error) {
        console.error("Resume failed:", error)
        setIsPlaying(false)
      }
    }
  }

  const togglePlay = async () => {
    if (isPlaying) {
      pauseTrack()
    } else {
      await resumeTrack()
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

