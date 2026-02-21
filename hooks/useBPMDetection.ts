"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { detectBPMFromAudioBuffer, detectBPMFromFile } from '@/utils/detectBpm'

export interface BPMDetectionResult {
  bpm: number
  confidence: number
  isStable: boolean
}

export interface BPMDetectionOptions {
  continuousAnalysis?: boolean
  stabilityThreshold?: number
  minBPM?: number
  maxBPM?: number
}

export interface UseBPMDetectionReturn {
  // State
  currentBPM: number | null
  isAnalyzing: boolean
  confidence: number
  error: string | null
  detectionResult: BPMDetectionResult | null
  
  // Actions
  startLiveAnalysis: (stream: MediaStream) => Promise<void>
  analyzeAudioFile: (file: File) => Promise<BPMDetectionResult>
  analyzeAudioBuffer: (buffer: AudioBuffer) => Promise<BPMDetectionResult>
  quickDetect: (buffer: AudioBuffer) => Promise<number>
  stopAnalysis: () => void
  resetAnalysis: () => void
  
  // Utils
  getStabilityScore: () => number
  isStable: boolean
}

export function useBPMDetection(options?: BPMDetectionOptions): UseBPMDetectionReturn {
  const [currentBPM, setCurrentBPM] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [detectionResult, setDetectionResult] = useState<BPMDetectionResult | null>(null)
  const [isStable, setIsStable] = useState(false)

  const bpmHistoryRef = useRef<number[]>([])
  const abortControllerRef = useRef<AbortController | null>(null)

  // Start live analysis from media stream
  // Note: For live streams, we'll need to record chunks and send them to API
  const startLiveAnalysis = useCallback(async (stream: MediaStream) => {
    try {
      setError(null)
      setIsAnalyzing(true)
      
      console.log('Live BPM analysis not fully implemented - API requires complete audio file')
      // For live analysis, you would need to:
      // 1. Record audio chunks
      // 2. Send accumulated chunks to API periodically
      // 3. Update BPM as new data comes in
      
      // This is a placeholder - implement if needed
      throw new Error('Live BPM analysis requires recording and sending audio chunks to API')
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start live analysis'
      setError(errorMessage)
      setIsAnalyzing(false)
      console.error('Live analysis error:', err)
    }
  }, [])

  // Analyze audio file using SoundStat API
  const analyzeAudioFile = useCallback(async (file: File): Promise<BPMDetectionResult> => {
    try {
      setError(null)
      setIsAnalyzing(true)
      setDetectionResult(null)
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()
      
      console.log(`Analyzing audio file via SoundStat: ${file.name}`)
      
      const bpm = await detectBPMFromFile(file)
      
      // SoundStat API is highly accurate
      const result: BPMDetectionResult = {
        bpm,
        confidence: 0.95, // SoundStat is very accurate
        isStable: true
      }
      
      // Add to history
      bpmHistoryRef.current.push(bpm)
      
      setDetectionResult(result)
      setCurrentBPM(result.bpm)
      setConfidence(result.confidence)
      setIsStable(result.isStable)
      setIsAnalyzing(false)
      
      console.log('SoundStat BPM analysis complete:', result)
      return result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze audio file'
      setError(errorMessage)
      setIsAnalyzing(false)
      console.error('File analysis error:', err)
      throw err
    } finally {
      abortControllerRef.current = null
    }
  }, [])

  // Analyze audio buffer using SoundStat API
  const analyzeAudioBuffer = useCallback(async (buffer: AudioBuffer): Promise<BPMDetectionResult> => {
    try {
      setError(null)
      setIsAnalyzing(true)
      setDetectionResult(null)
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      console.log(`Analyzing audio buffer via SoundStat: ${buffer.duration}s duration`)
      
      const bpm = await detectBPMFromAudioBuffer(buffer)
      
      // SoundStat API is highly accurate
      const result: BPMDetectionResult = {
        bpm,
        confidence: 0.95, // SoundStat is very accurate
        isStable: true
      }
      
      // Add to history
      bpmHistoryRef.current.push(bpm)
      
      setDetectionResult(result)
      setCurrentBPM(result.bpm)
      setConfidence(result.confidence)
      setIsStable(result.isStable)
      setIsAnalyzing(false)
      
      console.log('SoundStat buffer analysis complete:', result)
      return result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze audio buffer'
      setError(errorMessage)
      setIsAnalyzing(false)
      console.error('Buffer analysis error:', err)
      throw err
    } finally {
      abortControllerRef.current = null
    }
  }, [])

  // Quick BPM detection (same as full detection for SoundStat API)
  const quickDetect = useCallback(async (buffer: AudioBuffer): Promise<number> => {
    try {
      setError(null)
      setIsAnalyzing(true)
      
      console.log('Quick BPM detection via SoundStat...')
      
      const bpm = await detectBPMFromAudioBuffer(buffer)
      
      // Add to history
      bpmHistoryRef.current.push(bpm)
      
      setCurrentBPM(bpm)
      setConfidence(0.95) // SoundStat is highly accurate
      setIsStable(true)
      setIsAnalyzing(false)
      
      console.log(`Quick detection result from SoundStat: ${bpm} BPM`)
      return bpm
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Quick detection failed'
      setError(errorMessage)
      setIsAnalyzing(false)
      console.error('Quick detection error:', err)
      throw err
    }
  }, [])

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    
    setIsAnalyzing(false)
    console.log('BPM analysis stopped')
  }, [])

  // Reset analysis state
  const resetAnalysis = useCallback(() => {
    stopAnalysis()
    
    bpmHistoryRef.current = []
    
    setCurrentBPM(null)
    setConfidence(0)
    setError(null)
    setDetectionResult(null)
    setIsStable(false)
    
    console.log('BPM analysis reset')
  }, [stopAnalysis])

  // Get current stability score
  const getStabilityScore = useCallback((): number => {
    if (bpmHistoryRef.current.length === 0) return 0
    
    // For SoundStat detection, stability is high since each detection is independent and accurate
    return 0.95
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnalysis()
    }
  }, [stopAnalysis])

  return {
    // State
    currentBPM,
    isAnalyzing,
    confidence,
    error,
    detectionResult,
    isStable,
    
    // Actions
    startLiveAnalysis,
    analyzeAudioFile,
    analyzeAudioBuffer,
    quickDetect,
    stopAnalysis,
    resetAnalysis,
    
    // Utils
    getStabilityScore,
  }
}

// Additional hook for simple file-based BPM detection
export function useFileBPMDetection() {
  const [result, setResult] = useState<BPMDetectionResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const detectBPM = useCallback(async (file: File) => {
    setLoading(true)
    setError(null)
    
    try {
      const bpm = await detectBPMFromFile(file)
      const bpmResult: BPMDetectionResult = {
        bpm,
        confidence: 0.95, // SoundStat is highly accurate
        isStable: true
      }
      setResult(bpmResult)
      return bpmResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'BPM detection failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    result,
    loading,
    error,
    detectBPM,
    reset,
    bpm: result?.bpm || null,
    confidence: result?.confidence || 0,
    isStable: result?.isStable || false,
  }
}
