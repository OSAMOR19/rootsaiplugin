"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { BPMDetector, BPMDetectionResult, BPMDetectionOptions, detectBPMFromFile, quickBPMDetection } from '@/lib/bpmDetection'

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

  const detectorRef = useRef<BPMDetector | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize detector
  useEffect(() => {
    detectorRef.current = new BPMDetector(options)
    
    return () => {
      if (detectorRef.current) {
        detectorRef.current.stopAnalysis()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [options])

  // Start live analysis from media stream (microphone, etc.)
  const startLiveAnalysis = useCallback(async (stream: MediaStream) => {
    try {
      setError(null)
      setIsAnalyzing(true)
      
      if (!detectorRef.current) {
        throw new Error('BPM detector not initialized')
      }

      await detectorRef.current.analyzeLiveStream(stream)
      
      // Poll for BPM updates during live analysis
      intervalRef.current = setInterval(() => {
        if (detectorRef.current && detectorRef.current.isRunning()) {
          const bpm = detectorRef.current.getCurrentBPM()
          const confidenceScore = detectorRef.current.getConfidence()
          
          if (bpm !== null) {
            setCurrentBPM(bpm)
            setConfidence(confidenceScore)
            setIsStable(confidenceScore > 0.8)
            
            console.log(`Live BPM: ${bpm}, Confidence: ${confidenceScore.toFixed(2)}`)
          }
        }
      }, 500) // Update every 500ms
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start live analysis'
      setError(errorMessage)
      setIsAnalyzing(false)
      console.error('Live analysis error:', err)
    }
  }, [])

  // Analyze audio file
  const analyzeAudioFile = useCallback(async (file: File): Promise<BPMDetectionResult> => {
    try {
      setError(null)
      setIsAnalyzing(true)
      setDetectionResult(null)
      
      console.log(`Analyzing audio file: ${file.name}`)
      
      const result = await detectBPMFromFile(file)
      
      setDetectionResult(result)
      setCurrentBPM(result.bpm)
      setConfidence(result.confidence)
      setIsStable(result.isStable)
      setIsAnalyzing(false)
      
      console.log('File analysis complete:', result)
      return result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze audio file'
      setError(errorMessage)
      setIsAnalyzing(false)
      console.error('File analysis error:', err)
      throw err
    }
  }, [])

  // Analyze audio buffer
  const analyzeAudioBuffer = useCallback(async (buffer: AudioBuffer): Promise<BPMDetectionResult> => {
    try {
      setError(null)
      setIsAnalyzing(true)
      setDetectionResult(null)
      
      if (!detectorRef.current) {
        throw new Error('BPM detector not initialized')
      }

      console.log(`Analyzing audio buffer: ${buffer.duration}s duration`)
      
      const result = await detectorRef.current.analyzeAudioBuffer(buffer)
      
      setDetectionResult(result)
      setCurrentBPM(result.bpm)
      setConfidence(result.confidence)
      setIsStable(result.isStable)
      setIsAnalyzing(false)
      
      console.log('Buffer analysis complete:', result)
      return result
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze audio buffer'
      setError(errorMessage)
      setIsAnalyzing(false)
      console.error('Buffer analysis error:', err)
      throw err
    }
  }, [])

  // Quick BPM detection (faster but less accurate)
  const quickDetect = useCallback(async (buffer: AudioBuffer): Promise<number> => {
    try {
      setError(null)
      setIsAnalyzing(true)
      
      console.log('Quick BPM detection started...')
      
      const bpm = await quickBPMDetection(buffer)
      
      setCurrentBPM(bpm)
      setConfidence(0.8) // Assume good confidence for quick detection
      setIsStable(true)
      setIsAnalyzing(false)
      
      console.log(`Quick detection result: ${bpm} BPM`)
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
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (detectorRef.current) {
      detectorRef.current.stopAnalysis()
    }
    
    setIsAnalyzing(false)
    console.log('BPM analysis stopped')
  }, [])

  // Reset analysis state
  const resetAnalysis = useCallback(() => {
    stopAnalysis()
    
    if (detectorRef.current) {
      detectorRef.current.resetHistory()
    }
    
    setCurrentBPM(null)
    setConfidence(0)
    setError(null)
    setDetectionResult(null)
    setIsStable(false)
    
    console.log('BPM analysis reset')
  }, [stopAnalysis])

  // Get current stability score
  const getStabilityScore = useCallback((): number => {
    if (!detectorRef.current) return 0
    return detectorRef.current.getConfidence()
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
      const bpmResult = await detectBPMFromFile(file)
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
