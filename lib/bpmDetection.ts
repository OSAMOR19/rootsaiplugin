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
      
      // Calculate more realistic confidence based on result validation
      // Lower confidence if BPM is outside expected range or if it's an unusual value
      let confidence = (bpm >= this.options.minBPM && bpm <= this.options.maxBPM) ? 0.85 : 0.5
      
      // Adjust confidence based on whether BPM is a common musical value
      const commonBPMs = [60, 65, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 140, 150, 160, 170, 180]
      const isCommonBPM = commonBPMs.some(c => Math.abs(bpm - c) <= 1)
      if (isCommonBPM) {
        confidence = Math.min(0.95, confidence + 0.1) // Boost confidence for common BPMs
      } else {
        confidence = Math.max(0.6, confidence - 0.05) // Slightly reduce for unusual BPMs
      }
      
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

// Utility function for quick BPM detection with improved accuracy
// Uses multiple detection passes, advanced signal processing, and post-correction
export async function quickBPMDetection(audioBuffer: AudioBuffer): Promise<number> {
  try {
    const results: Array<{ bpm: number; confidence: number; method: string }> = []
    
    // Method 1: web-audio-beat-detector (primary method) - run multiple times for validation
    try {
      const beatDetector = await import('web-audio-beat-detector')
      
      // Run detection multiple times with different audio segments for validation
      const duration = audioBuffer.duration
      const sampleRate = audioBuffer.sampleRate
      
      // Try full audio analysis (most accurate)
      try {
        const bpm1 = await beatDetector.analyze(audioBuffer)
        if (bpm1 > 0 && bpm1 < 500) {
          results.push({ bpm: bpm1, confidence: 0.9, method: 'full-audio' })
          console.log('Full audio analysis:', bpm1, 'BPM')
        }
      } catch (error) {
        console.warn('Full audio analysis failed:', error)
      }
      
      // If audio is long enough, try analyzing different segments for consistency
      if (duration > 8) {
        // Analyze first 8 seconds
        try {
          const startSample = 0
          const endSample = Math.floor(sampleRate * 8)
          const segmentBuffer = createAudioBufferSegment(audioBuffer, startSample, endSample)
          const bpm2 = await beatDetector.analyze(segmentBuffer)
          if (bpm2 > 0 && bpm2 < 500) {
            results.push({ bpm: bpm2, confidence: 0.85, method: 'first-segment' })
            console.log('First segment analysis:', bpm2, 'BPM')
          }
        } catch (error) {
          console.warn('First segment analysis failed:', error)
        }
        
        // Analyze middle segment (if audio is long enough)
        if (duration > 16) {
          try {
            const midStart = Math.floor(sampleRate * (duration / 2 - 4))
            const midEnd = Math.floor(sampleRate * (duration / 2 + 4))
            const midSegmentBuffer = createAudioBufferSegment(audioBuffer, midStart, midEnd)
            const bpm3 = await beatDetector.analyze(midSegmentBuffer)
            if (bpm3 > 0 && bpm3 < 500) {
              results.push({ bpm: bpm3, confidence: 0.85, method: 'middle-segment' })
              console.log('Middle segment analysis:', bpm3, 'BPM')
            }
          } catch (error) {
            console.warn('Middle segment analysis failed:', error)
          }
        }
      }
    } catch (error) {
      console.warn('web-audio-beat-detector failed:', error)
    }
    
    // Method 2: Improved Autocorrelation-based detection with better precision
    try {
      const autocorrResult = detectBPMWithImprovedAutocorrelation(audioBuffer)
      if (autocorrResult.bpm > 0 && autocorrResult.bpm < 500) {
        results.push({ 
          bpm: autocorrResult.bpm, 
          confidence: autocorrResult.confidence,
          method: 'autocorrelation' 
        })
        console.log('Autocorrelation method:', autocorrResult.bpm, 'BPM (confidence:', autocorrResult.confidence.toFixed(2) + ')')
      }
    } catch (error) {
      console.warn('Autocorrelation method failed:', error)
    }
    
    // Method 3: Onset detection + peak analysis (for additional validation)
    try {
      const onsetBPM = detectBPMWithOnsetDetection(audioBuffer)
      if (onsetBPM > 0 && onsetBPM < 500) {
        results.push({ bpm: onsetBPM, confidence: 0.8, method: 'onset-detection' })
        console.log('Onset detection method:', onsetBPM, 'BPM')
      }
    } catch (error) {
      console.warn('Onset detection failed:', error)
    }
    
    // Calculate final BPM from results with confidence weighting
    if (results.length === 0) {
      throw new Error('All BPM detection methods failed')
    }
    
    // Get initial BPM estimate (confidence-weighted average)
    let finalBPM = calculateWeightedBPM(results)
    
    // Post-processing: Check for common errors and correct them
    finalBPM = applyBPMCorrections(finalBPM, results)
    
    // Round to nearest integer
    finalBPM = Math.round(finalBPM)
    
    // Final validation
    if (finalBPM < 30 || finalBPM > 400) {
      console.warn('BPM result seems invalid:', finalBPM, 'using best valid result')
      const validResults = results.filter(r => r.bpm >= 30 && r.bpm <= 400)
      if (validResults.length > 0) {
        finalBPM = validResults.sort((a, b) => b.confidence - a.confidence)[0].bpm
      }
    }
    
    console.log('Final BPM (improved):', finalBPM, 'BPM from', results.length, 'detection(s)')
    return finalBPM
  } catch (error) {
    console.error('BPM detection failed:', error)
    throw error
  }
}

// Calculate confidence-weighted BPM from multiple results
function calculateWeightedBPM(results: Array<{ bpm: number; confidence: number }>): number {
  if (results.length === 1) {
    return results[0].bpm
  }
  
  // Weight by confidence and proximity to other results
  const sorted = [...results].sort((a, b) => a.bpm - b.bpm)
  
  // Calculate weighted average, but also consider clustering
  let totalWeight = 0
  let weightedSum = 0
  
  for (const result of results) {
    // Confidence weight
    let weight = result.confidence
    
    // Bonus weight if this BPM is close to other results (consensus)
    const closeResults = results.filter(r => Math.abs(r.bpm - result.bpm) <= 3)
    if (closeResults.length > 1) {
      weight *= (1 + 0.2 * (closeResults.length - 1)) // Bonus for consensus
    }
    
    weightedSum += result.bpm * weight
    totalWeight += weight
  }
  
  return weightedSum / totalWeight
}

// Apply corrections for common BPM detection errors
function applyBPMCorrections(initialBPM: number, results: Array<{ bpm: number; confidence: number }>): number {
  // Common BPM values (more likely to be correct) - expanded list including 104
  const commonBPMs = [60, 65, 70, 75, 80, 85, 90, 95, 100, 102, 104, 105, 110, 115, 120, 125, 130, 140, 150, 160, 170, 180, 190, 200]
  
  // First, check if any result directly suggests a common BPM
  for (const result of results) {
    for (const commonBPM of commonBPMs) {
      const diff = Math.abs(result.bpm - commonBPM)
      if (diff <= 2 && result.confidence > 0.7) {
        // If a high-confidence result is very close to a common BPM, prefer that
        console.log(`Preferring high-confidence result ${result.bpm} -> ${commonBPM} BPM`)
        return commonBPM
      }
    }
  }
  
  // Check if initial BPM is close to a common BPM
  for (const commonBPM of commonBPMs) {
    const diff = Math.abs(initialBPM - commonBPM)
    if (diff <= 3) {
      // Check if any results suggest a harmonic relationship
      const hasHarmonic = results.some(r => {
        const ratio = r.bpm / commonBPM
        // Check for 2x, 0.5x, 1.5x relationships
        return (ratio >= 1.9 && ratio <= 2.1) || (ratio >= 0.45 && ratio <= 0.55) || (ratio >= 1.4 && ratio <= 1.6)
      })
      
      if (hasHarmonic && diff > 1) {
        // If close to common BPM and we detect harmonics, prefer the common BPM
        console.log(`Correcting ${initialBPM} BPM to common value ${commonBPM} BPM`)
        return commonBPM
      } else if (diff <= 1.5) {
        // Very close to common BPM - round to it
        return commonBPM
      }
    } else if (diff <= 6) {
      // Check if any results are closer to this common BPM than to initialBPM
      const closerResults = results.filter(r => {
        const distToCommon = Math.abs(r.bpm - commonBPM)
        const distToInitial = Math.abs(r.bpm - initialBPM)
        return distToCommon < distToInitial && r.confidence > 0.75
      })
      
      if (closerResults.length >= 2) {
        // Multiple results suggest the common BPM is more accurate
        console.log(`Correcting ${initialBPM} BPM to ${commonBPM} BPM based on result consensus`)
        return commonBPM
      }
    }
  }
  
  // Check for half/double time errors
  for (const result of results) {
    const ratio = result.bpm / initialBPM
    // If we detect a value that's exactly half, it might be detecting a slower rhythm
    if (ratio >= 0.48 && ratio <= 0.52 && initialBPM < 120) {
      const doubled = initialBPM * 2
      // Check if doubled value makes more sense (closer to common BPMs)
      const doubledIsBetter = commonBPMs.some(c => Math.abs(doubled - c) < Math.abs(initialBPM - c))
      if (doubledIsBetter) {
        console.log(`Detected possible half-time error: ${initialBPM} -> ${doubled} BPM`)
        return doubled
      }
    }
    // If we detect a value that's exactly double, it might be detecting a faster rhythm
    if (ratio >= 1.9 && ratio <= 2.1 && initialBPM > 80) {
      const halved = initialBPM / 2
      // Check if halved value makes more sense
      const halvedIsBetter = commonBPMs.some(c => Math.abs(halved - c) < Math.abs(initialBPM - c))
      if (halvedIsBetter) {
        console.log(`Detected possible double-time error: ${initialBPM} -> ${halved} BPM`)
        return halved
      }
    }
  }
  
  return initialBPM
}

// Helper function to create an audio buffer segment
function createAudioBufferSegment(
  sourceBuffer: AudioBuffer,
  startSample: number,
  endSample: number
): AudioBuffer {
  const numberOfChannels = sourceBuffer.numberOfChannels
  const length = endSample - startSample
  const sampleRate = sourceBuffer.sampleRate
  
  // Create new offline context for the segment
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: sourceBuffer.sampleRate
  })
  const newBuffer = audioContext.createBuffer(numberOfChannels, length, sampleRate)
  
  // Copy channel data
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const sourceData = sourceBuffer.getChannelData(channel)
    const targetData = newBuffer.getChannelData(channel)
    for (let i = 0; i < length; i++) {
      targetData[i] = sourceData[startSample + i] || 0
    }
  }
  
  return newBuffer
}

// Improved autocorrelation-based BPM detection with better precision
function detectBPMWithImprovedAutocorrelation(audioBuffer: AudioBuffer): { bpm: number; confidence: number } {
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  
  // Use longer analysis window for better accuracy (up to 15 seconds)
  const maxSamples = Math.min(channelData.length, sampleRate * 15)
  const samples = channelData.slice(0, maxSamples)
  
  // Apply high-pass filter to emphasize rhythmic content (remove low-frequency noise)
  const filtered = applyHighPassFilter(samples, sampleRate, 80) // 80 Hz cutoff
  
  // Downsample for efficiency but keep higher quality (analyze at ~16kHz for better precision)
  const targetSampleRate = Math.min(16000, sampleRate)
  const downsampleFactor = Math.floor(sampleRate / targetSampleRate)
  const downsampled: number[] = []
  for (let i = 0; i < filtered.length; i += downsampleFactor) {
    downsampled.push(filtered[i])
  }
  
  const downsampledSampleRate = sampleRate / downsampleFactor
  
  // Calculate autocorrelation for lag values corresponding to 50-300 BPM
  // Use finer resolution around common BPMs
  const minLag = Math.floor((downsampledSampleRate * 60) / 300) // 300 BPM
  const maxLag = Math.floor((downsampledSampleRate * 60) / 50)   // 50 BPM
  
  // Store correlation values for peak detection
  const correlations: Array<{ lag: number; value: number }> = []
  
  // Autocorrelation function with normalization
  for (let lag = minLag; lag <= maxLag && lag < downsampled.length / 2; lag++) {
    let correlation = 0
    let energy = 0
    const n = downsampled.length - lag
    
    for (let i = 0; i < n; i++) {
      correlation += downsampled[i] * downsampled[i + lag]
      energy += downsampled[i] * downsampled[i]
    }
    
    // Normalize by energy (pearson correlation)
    const normalizedCorr = energy > 0 ? correlation / Math.sqrt(energy * (energy / n)) : 0
    correlations.push({ lag, value: normalizedCorr })
  }
  
  // Find peaks in correlation (not just maximum, but well-defined peaks)
  const peaks = findCorrelationPeaks(correlations, downsampledSampleRate)
  
  // Select best peak considering both strength and musical context
  const bestPeak = selectBestBPM(peaks, downsampledSampleRate)
  
  // Calculate confidence based on peak strength and sharpness
  const confidence = calculatePeakConfidence(bestPeak, peaks, correlations)
  
  return {
    bpm: Math.max(50, Math.min(300, bestPeak.bpm)),
    confidence: Math.min(0.95, confidence)
  }
}

// Apply simple high-pass filter to emphasize rhythmic content
function applyHighPassFilter(data: Float32Array, sampleRate: number, cutoffFreq: number): Float32Array {
  const rc = 1 / (2 * Math.PI * cutoffFreq)
  const dt = 1 / sampleRate
  const alpha = rc / (rc + dt)
  
  const filtered = new Float32Array(data.length)
  let prev = data[0]
  
  for (let i = 1; i < data.length; i++) {
    filtered[i] = alpha * (filtered[i - 1] + data[i] - prev)
    prev = data[i]
  }
  
  return filtered
}

// Find prominent peaks in autocorrelation
function findCorrelationPeaks(correlations: Array<{ lag: number; value: number }>, sampleRate: number): Array<{ lag: number; value: number; bpm: number }> {
  const peaks: Array<{ lag: number; value: number; bpm: number }> = []
  
  // Find local maxima
  for (let i = 1; i < correlations.length - 1; i++) {
    if (correlations[i].value > correlations[i - 1].value && 
        correlations[i].value > correlations[i + 1].value &&
        correlations[i].value > 0.1) { // Minimum threshold
      const bpm = (sampleRate * 60) / correlations[i].lag
      if (bpm >= 50 && bpm <= 300) {
        peaks.push({
          lag: correlations[i].lag,
          value: correlations[i].value,
          bpm: bpm
        })
      }
    }
  }
  
  // Sort by value (strength)
  return peaks.sort((a, b) => b.value - a.value).slice(0, 10) // Top 10 peaks
}

// Select best BPM from peaks, considering harmonics and musical context
function selectBestBPM(peaks: Array<{ lag: number; value: number; bpm: number }>, sampleRate: number): { lag: number; value: number; bpm: number } {
  if (peaks.length === 0) {
    throw new Error('No peaks found')
  }
  
  // Common BPM values are more likely correct
  const commonBPMs = [60, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 140, 150, 160, 170, 180]
  
  // Score each peak
  const scoredPeaks = peaks.map(peak => {
    let score = peak.value // Base score from correlation strength
    
    // Bonus for being close to common BPM
    for (const commonBPM of commonBPMs) {
      const diff = Math.abs(peak.bpm - commonBPM)
      if (diff <= 2) {
        score += 0.15 * (1 - diff / 2) // Up to 15% bonus
        break
      }
    }
    
    // Check for harmonic relationships with stronger peaks
    for (const otherPeak of peaks) {
      if (otherPeak.value > peak.value) {
        const ratio = peak.bpm / otherPeak.bpm
        // If this is a harmonic of a stronger peak, reduce score
        if (ratio >= 0.48 && ratio <= 0.52) {
          score *= 0.7 // Half-time - likely wrong
        } else if (ratio >= 1.9 && ratio <= 2.1) {
          score *= 0.8 // Double-time - might be correct but less likely
        }
      }
    }
    
    return { ...peak, score }
  })
  
  // Return peak with highest score
  return scoredPeaks.sort((a, b) => b.score - a.score)[0]
}

// Calculate confidence based on peak quality
function calculatePeakConfidence(
  bestPeak: { lag: number; value: number; bpm: number },
  peaks: Array<{ lag: number; value: number; bpm: number }>,
  correlations: Array<{ lag: number; value: number }>
): number {
  // Base confidence from peak strength
  let confidence = Math.min(0.9, bestPeak.value * 1.5)
  
  // Bonus if peak is significantly stronger than second-best
  if (peaks.length > 1) {
    const secondBest = peaks[1]
    const ratio = bestPeak.value / (secondBest.value + 0.01)
    if (ratio > 1.2) {
      confidence += 0.1 // Clear winner
    }
  }
  
  // Check peak sharpness (steep sides = good)
  const lagIndex = correlations.findIndex(c => Math.abs(c.lag - bestPeak.lag) < 2)
  if (lagIndex > 0 && lagIndex < correlations.length - 1) {
    const sharpness = Math.abs(correlations[lagIndex - 1].value - correlations[lagIndex].value) +
                      Math.abs(correlations[lagIndex + 1].value - correlations[lagIndex].value)
    confidence += Math.min(0.1, sharpness * 0.5)
  }
  
  return Math.min(0.95, confidence)
}

// Onset detection based BPM detection (alternative method)
function detectBPMWithOnsetDetection(audioBuffer: AudioBuffer): number {
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  
  // Detect onsets (transient events)
  const onsets = detectOnsets(channelData, sampleRate)
  
  if (onsets.length < 4) {
    return 0 // Not enough onsets
  }
  
  // Calculate intervals between onsets
  const intervals: number[] = []
  for (let i = 1; i < onsets.length; i++) {
    intervals.push(onsets[i] - onsets[i - 1])
  }
  
  // Find most common interval (beat duration)
  const intervalCounts = new Map<number, number>()
  for (const interval of intervals) {
    // Round to nearest 0.1 seconds
    const rounded = Math.round(interval * 10) / 10
    intervalCounts.set(rounded, (intervalCounts.get(rounded) || 0) + 1)
  }
  
  // Find interval with highest count
  let maxCount = 0
  let bestInterval = 0
  for (const [interval, count] of intervalCounts.entries()) {
    if (count > maxCount && interval > 0.2 && interval < 2.0) { // Reasonable beat interval
      maxCount = count
      bestInterval = interval
    }
  }
  
  if (bestInterval === 0) {
    return 0
  }
  
  // Convert interval to BPM
  const bpm = 60 / bestInterval
  return Math.max(50, Math.min(300, bpm))
}

// Detect onset events in audio
function detectOnsets(audioData: Float32Array, sampleRate: number): number[] {
  const onsets: number[] = []
  const windowSize = Math.floor(sampleRate * 0.05) // 50ms windows
  const hopSize = Math.floor(sampleRate * 0.01) // 10ms hop
  
  let prevEnergy = 0
  
  for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
    // Calculate energy in window
    let energy = 0
    for (let j = i; j < i + windowSize && j < audioData.length; j++) {
      energy += audioData[j] * audioData[j]
    }
    energy = Math.sqrt(energy / windowSize)
    
    // Detect sudden increase in energy (onset)
    const diff = energy - prevEnergy
    if (diff > 0.01 && energy > 0.05) { // Thresholds tuned for detection
      const time = i / sampleRate
      // Only add if not too close to previous onset (min 100ms apart)
      if (onsets.length === 0 || time - onsets[onsets.length - 1] > 0.1) {
        onsets.push(time)
      }
    }
    
    prevEnergy = energy
  }
  
  return onsets
}
