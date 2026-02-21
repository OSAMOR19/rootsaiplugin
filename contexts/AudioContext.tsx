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
  playTrack: (track: Track, newQueue?: Track[]) => void
  pauseTrack: () => void
  resumeTrack: () => void
  togglePlay: () => void
  seekTo: (time: number) => void
  queue: Track[]
  setQueue: (tracks: Track[]) => void
  playNext: () => void
  playPrevious: () => void
  isShuffle: boolean
  toggleShuffle: () => void
  repeatMode: 'off' | 'all' | 'one'
  toggleRepeat: () => void
  closePlayer: () => void
  volume: number
  setVolume: (volume: number) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [queue, setQueue] = useState<Track[]>([])
  const [isShuffle, setIsShuffle] = useState(false)
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off')
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()

      audioRef.current.onended = () => {
        if (repeatMode === 'one') {
          audioRef.current?.play()
        } else {
          playNext()
        }
      }

      audioRef.current.ontimeupdate = () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      }

      audioRef.current.onloadedmetadata = () => {
        setDuration(audioRef.current?.duration || 0)
      }
    }
    // Update volume whenever it changes
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [queue, currentTrack, repeatMode, isShuffle, volume]) // Dependencies for onended and volume

  const playTrack = async (track: Track, newQueue?: Track[]) => {
    if (newQueue) {
      setQueue(newQueue)
    }

    if (audioRef.current) {
      if (currentTrack?.id === track.id) {
        togglePlay()
        return
      }

      try {
        audioRef.current.src = track.audioUrl
        audioRef.current.volume = volume // Ensure volume is set
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

  const playNext = () => {
    if (queue.length === 0 || !currentTrack) return

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id)
    let nextIndex = -1

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length)
    } else {
      nextIndex = currentIndex + 1
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0
        } else {
          setIsPlaying(false)
          return
        }
      }
    }

    if (nextIndex >= 0 && nextIndex < queue.length) {
      playTrack(queue[nextIndex])
    }
  }

  const playPrevious = () => {
    if (queue.length === 0 || !currentTrack) return

    const currentIndex = queue.findIndex(t => t.id === currentTrack.id)
    let prevIndex = -1

    if (isShuffle) {
      prevIndex = Math.floor(Math.random() * queue.length)
    } else {
      prevIndex = currentIndex - 1
      if (prevIndex < 0) {
        if (repeatMode === 'all') {
          prevIndex = queue.length - 1
        } else {
          prevIndex = 0 // Or stop/restart current? Usually restart current if > 3s, else prev. Simplified here.
        }
      }
    }

    if (prevIndex >= 0 && prevIndex < queue.length) {
      playTrack(queue[prevIndex])
    }
  }

  const toggleShuffle = () => setIsShuffle(!isShuffle)

  const toggleRepeat = () => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all'
      if (prev === 'all') return 'one'
      return 'off'
    })
  }

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentTrack(null)
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
      seekTo,
      queue,
      setQueue,
      playNext,
      playPrevious,
      isShuffle,
      toggleShuffle,
      repeatMode,
      toggleRepeat,
      closePlayer,
      volume,
      setVolume
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

