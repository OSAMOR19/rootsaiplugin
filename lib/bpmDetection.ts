"use client"

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

export class BPMDetector {
  private isAnalyzing = false
  private bpmHistory: number[] = []
  private options: Required<BPMDetectionOptions>

  constructor(options: BPMDetectionOptions = {}) {
    this.options = {
      continuousAnalysis: options.continuousAnalysis ?? false,
      stabilityThreshold: options.stabilityThreshold ?? 5,
      minBPM: options.minBPM ?? 60,
      maxBPM: options.maxBPM ?? 200,
    }
  }

  /**
   * Analyze BPM from an audio buffer (for uploaded files)
   */
  async analyzeAudioBuffer(audioBuffer: AudioBuffer): Promise<BPMDetectionResult> {
    try {
      this.isAnalyzing = true
      console.log('Starting BPM analysis with web-audio-beat-detector...')
      
      // Use the quick detection function which uses web-audio-beat-detector
      const bpm = await quickBPMDetection(audioBuffer)
      
      // Add to history for confidence calculation
      this.bpmHistory.push(bpm)
      
      // For single detection, confidence is based on whether BPM is in expected range
      const confidence = (bpm >= this.options.minBPM && bpm <= this.options.maxBPM) ? 0.9 : 0.5
      
      const result: BPMDetectionResult = {
        bpm: Math.round(bpm),
        confidence: confidence,
        isStable: confidence > 0.8
      }
      
      this.isAnalyzing = false
      console.log('BPM Analysis complete:', result)
      
      return result
    } catch (error) {
      this.isAnalyzing = false
      console.error('BPM Detection error:', error)
      throw error
    }
  }

  /**
   * Analyze BPM from a live audio stream (microphone, etc.)
   */
  async analyzeLiveStream(stream: MediaStream): Promise<void> {
    try {
      console.log('Live BPM analysis - using simplified implementation')
      this.isAnalyzing = true
      
      // For live streams, we'll implement a simpler approach
      // This is a placeholder for more complex real-time analysis
      console.log('Live BPM analysis started (placeholder implementation)')

    } catch (error) {
      console.error('Live stream BPM analysis error:', error)
      throw error
    }
  }

  /**
   * Get current BPM from live analysis
   */
  getCurrentBPM(): number | null {
    if (!this.isAnalyzing) return null
    
    // For simplified implementation, return last detected BPM if available
    if (this.bpmHistory.length > 0) {
      return this.bpmHistory[this.bpmHistory.length - 1]
    }
    
    return null
  }

  /**
   * Calculate average BPM from history
   */
  private calculateAverageBPM(): number {
    if (this.bpmHistory.length === 0) return 0
    
    // Remove outliers (values more than 20 BPM away from median)
    const sorted = [...this.bpmHistory].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    const filtered = this.bpmHistory.filter(bpm => Math.abs(bpm - median) <= 20)
    
    return filtered.reduce((sum, bpm) => sum + bpm, 0) / filtered.length
  }

  /**
   * Calculate stability score (0-1, higher is more stable)
   */
  private calculateStability(): number {
    if (this.bpmHistory.length < 3) return 0
    
    const average = this.calculateAverageBPM()
    const deviations = this.bpmHistory.map(bpm => Math.abs(bpm - average))
    const averageDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length
    
    // Convert deviation to stability score (lower deviation = higher stability)
    return Math.max(0, 1 - (averageDeviation / 10))
  }

  /**
   * Stop BPM analysis and cleanup resources
   */
  stopAnalysis(): void {
    this.isAnalyzing = false
    console.log('BPM analysis stopped')
  }

  /**
   * Reset BPM history
   */
  resetHistory(): void {
    this.bpmHistory = []
  }

  /**
   * Check if analysis is currently running
   */
  isRunning(): boolean {
    return this.isAnalyzing
  }

  /**
   * Get BPM detection confidence based on stability and sample count
   */
  getConfidence(): number {
    if (this.bpmHistory.length === 0) return 0
    
    const stabilityScore = this.calculateStability()
    const sampleScore = Math.min(1, this.bpmHistory.length / 10) // Full confidence at 10+ samples
    
    return (stabilityScore + sampleScore) / 2
  }
}

// Utility function to detect BPM from audio file
export async function detectBPMFromFile(file: File): Promise<BPMDetectionResult> {
  return new Promise(async (resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      const detector = new BPMDetector({
        continuousAnalysis: false,
        stabilityThreshold: 3,
        minBPM: 60,
        maxBPM: 200,
      })
      
      const result = await detector.analyzeAudioBuffer(audioBuffer)
      detector.stopAnalysis()
      
      resolve(result)
    } catch (error) {
      console.error('Error detecting BPM from file:', error)
      reject(error)
    }
  })
}

// Utility function for quick BPM detection with Web Audio Beat Detector
export async function quickBPMDetection(audioBuffer: AudioBuffer): Promise<number> {
  try {
    // Import the web-audio-beat-detector dynamically
    const beatDetector = await import('web-audio-beat-detector')
    
    // Use analyze method which is available in the library
    const bpm = await beatDetector.analyze(audioBuffer)
    return Math.round(bpm)
  } catch (error) {
    console.error('Quick BPM detection failed:', error)
    throw error
  }
}
