import { useState, useRef, useCallback, useEffect } from 'react'

interface AudioPlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  progress: number
  volume: number
}

interface UseAudioPlayerReturn {
  audioState: AudioPlayerState
  play: (audioUrl?: string) => Promise<void>
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  setVolume: (volume: number) => void
  loadAudio: (audioUrl: string) => Promise<void>
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioState, setAudioState] = useState<AudioPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    volume: 1,
  })

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.preload = 'metadata'
    
    const audio = audioRef.current

    const handleLoadedMetadata = () => {
      setAudioState(prev => ({
        ...prev,
        duration: audio.duration || 0,
      }))
    }

    const handleTimeUpdate = () => {
      const progress = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0
      setAudioState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        progress,
      }))
    }

    const handlePlay = () => {
      setAudioState(prev => ({ ...prev, isPlaying: true }))
    }

    const handlePause = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false }))
    }

    const handleEnded = () => {
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentTime: 0, 
        progress: 0 
      }))
    }

    // Add event listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const loadAudio = useCallback(async (audioUrl: string) => {
    if (!audioRef.current) return

    try {
      audioRef.current.src = audioUrl
      await audioRef.current.load()
    } catch (error) {
      console.error('Error loading audio:', error)
    }
  }, [])

  const play = useCallback(async (audioUrl?: string) => {
    if (!audioRef.current) return

    try {
      if (audioUrl && audioRef.current.src !== audioUrl) {
        await loadAudio(audioUrl)
      }
      
      await audioRef.current.play()
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }, [loadAudio])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        currentTime: 0, 
        progress: 0 
      }))
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const setVolume = useCallback((volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume))
      setAudioState(prev => ({ ...prev, volume }))
    }
  }, [])

  return {
    audioState,
    play,
    pause,
    stop,
    seek,
    setVolume,
    loadAudio,
  }
}
