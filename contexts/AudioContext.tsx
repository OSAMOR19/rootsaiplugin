"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface AnalysisData {
  detectedBPM: number
  detectedKey: string
  recommendations: any[]
  recordedAudioBuffer?: AudioBuffer
}

interface AudioContextType {
  analysisData: AnalysisData | null
  setAnalysisData: (data: AnalysisData | null) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)

  return (
    <AudioContext.Provider value={{ analysisData, setAnalysisData }}>
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

