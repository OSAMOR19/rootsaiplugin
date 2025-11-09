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
    
    // Additional validation: Check for consensus among methods
    const consensusBPM = findConsensusBPM(results)
    if (consensusBPM && Math.abs(finalBPM - consensusBPM) > 10) {
      // If there's strong consensus on a different value, prefer it
      console.log(`Using consensus BPM: ${consensusBPM} instead of ${finalBPM}`)
      finalBPM = consensusBPM
    }
    
    // Round to nearest integer
    finalBPM = Math.round(finalBPM)
    
    // Final validation and clamping
    if (finalBPM < 30 || finalBPM > 400) {
      console.warn('BPM result seems invalid:', finalBPM, 'using best valid result')
      const validResults = results.filter(r => r.bpm >= 30 && r.bpm <= 400)
      if (validResults.length > 0) {
        finalBPM = validResults.sort((a, b) => b.confidence - a.confidence)[0].bpm
      } else {
        // Fallback: use median of all results
        const sorted = results.map(r => r.bpm).sort((a, b) => a - b)
        finalBPM = sorted[Math.floor(sorted.length / 2)]
      }
    }
    
    // Final clamp to reasonable range
    finalBPM = Math.max(50, Math.min(300, finalBPM))
    
    console.log('Final BPM (improved):', finalBPM, 'BPM from', results.length, 'detection(s)')
    return finalBPM
  } catch (error) {
    console.error('BPM detection failed:', error)
    throw error
  }
}

// Find consensus BPM when multiple methods agree
function findConsensusBPM(results: Array<{ bpm: number; confidence: number }>): number | null {
  if (results.length < 2) return null
  
  // Group results by similar BPM (within 3 BPM)
  const groups: Array<{ bpm: number; count: number; totalConfidence: number }> = []
  
  for (const result of results) {
    let found = false
    for (const group of groups) {
      if (Math.abs(group.bpm - result.bpm) <= 3) {
        // Add to existing group
        group.count++
        group.totalConfidence += result.confidence
        group.bpm = (group.bpm * (group.count - 1) + result.bpm) / group.count // Average
        found = true
        break
      }
    }
    
    if (!found) {
      groups.push({ bpm: result.bpm, count: 1, totalConfidence: result.confidence })
    }
  }
  
  // Find group with most members and high confidence
  const bestGroup = groups
    .filter(g => g.count >= 2) // At least 2 methods agree
    .sort((a, b) => {
      // Sort by count first, then by confidence
      if (b.count !== a.count) return b.count - a.count
      return b.totalConfidence - a.totalConfidence
    })[0]
  
  if (bestGroup && bestGroup.count >= 2) {
    return Math.round(bestGroup.bpm)
  }
  
  return null
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

// Improved autocorrelation-based BPM detection with better precision and fast tempo handling
function detectBPMWithImprovedAutocorrelation(audioBuffer: AudioBuffer): { bpm: number; confidence: number } {
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  
  // Use longer analysis window for better accuracy (up to 20 seconds for fast tempos)
  const maxSamples = Math.min(channelData.length, sampleRate * 20)
  const samples = channelData.slice(0, maxSamples)
  
  // Apply multiple filters for better beat detection
  // 1. High-pass filter to remove low-frequency noise
  let filtered = applyHighPassFilter(samples, sampleRate, 60) // Lower cutoff for fast tempos
  
  // 2. Apply envelope follower to emphasize transients (beats)
  filtered = applyEnvelopeFollower(filtered, sampleRate)
  
  // 3. Apply spectral flux for better beat emphasis
  filtered = applySpectralFlux(filtered, sampleRate)
  
  // Downsample for efficiency but keep higher quality
  // For fast tempos, we need higher sample rate to detect short intervals
  const targetSampleRate = Math.min(22050, sampleRate) // Higher sample rate for fast detection
  const downsampleFactor = Math.floor(sampleRate / targetSampleRate)
  const downsampled: number[] = []
  for (let i = 0; i < filtered.length; i += downsampleFactor) {
    downsampled.push(filtered[i])
  }
  
  const downsampledSampleRate = sampleRate / downsampleFactor
  
  // Calculate autocorrelation for lag values corresponding to 50-300 BPM
  // Extended range for fast tempos (up to 300 BPM, but also check harmonics)
  const minLag = Math.floor((downsampledSampleRate * 60) / 350) // 350 BPM max (for harmonics)
  const maxLag = Math.floor((downsampledSampleRate * 60) / 40)   // 40 BPM min (for half-time detection)
  
  // Store correlation values for peak detection
  const correlations: Array<{ lag: number; value: number }> = []
  
  // Improved autocorrelation with better normalization
  for (let lag = minLag; lag <= maxLag && lag < downsampled.length / 2; lag++) {
    let correlation = 0
    let energy1 = 0
    let energy2 = 0
    const n = Math.min(downsampled.length - lag, downsampled.length)
    
    // Use overlapping windows for better accuracy
    for (let i = 0; i < n; i++) {
      const val1 = downsampled[i]
      const val2 = downsampled[i + lag]
      correlation += val1 * val2
      energy1 += val1 * val1
      energy2 += val2 * val2
    }
    
    // Better normalization (avoid division by zero)
    const norm = Math.sqrt(energy1 * energy2)
    const normalizedCorr = norm > 0 ? correlation / norm : 0
    
    // Apply comb filter weighting to emphasize musical intervals
    const bpm = (downsampledSampleRate * 60) / lag
    const combWeight = getCombFilterWeight(bpm)
    
    correlations.push({ lag, value: normalizedCorr * combWeight })
  }
  
  // Smooth correlations to reduce noise
  const smoothed = smoothCorrelations(correlations)
  
  // Find peaks in correlation (improved peak detection)
  const peaks = findCorrelationPeaks(smoothed, downsampledSampleRate)
  
  // Select best peak considering harmonics, especially for fast tempos
  const bestPeak = selectBestBPM(peaks, downsampledSampleRate)
  
  // Calculate confidence based on peak strength and sharpness
  const confidence = calculatePeakConfidence(bestPeak, peaks, smoothed)
  
  // Validate result - check if it's a harmonic of a better result
  const validatedBPM = validateAndCorrectBPM(bestPeak.bpm, peaks, confidence)
  
  return {
    bpm: Math.max(50, Math.min(300, validatedBPM)),
    confidence: Math.min(0.95, confidence)
  }
}

// Apply envelope follower to emphasize transients
function applyEnvelopeFollower(data: Float32Array, sampleRate: number): Float32Array {
  const attackTime = 0.001 // 1ms attack
  const releaseTime = 0.1  // 100ms release
  const attackCoeff = Math.exp(-1 / (attackTime * sampleRate))
  const releaseCoeff = Math.exp(-1 / (releaseTime * sampleRate))
  
  const envelope = new Float32Array(data.length)
  let envelopeValue = 0
  
  for (let i = 0; i < data.length; i++) {
    const input = Math.abs(data[i])
    if (input > envelopeValue) {
      envelopeValue = input + attackCoeff * (envelopeValue - input)
    } else {
      envelopeValue = input + releaseCoeff * (envelopeValue - input)
    }
    envelope[i] = envelopeValue
  }
  
  return envelope
}

// Apply spectral flux for beat emphasis
function applySpectralFlux(data: Float32Array, sampleRate: number): Float32Array {
  const windowSize = Math.floor(sampleRate * 0.05) // 50ms windows
  const hopSize = Math.floor(sampleRate * 0.01)    // 10ms hop
  const flux = new Float32Array(data.length)
  
  let prevMagnitude = 0
  
  for (let i = 0; i < data.length - windowSize; i += hopSize) {
    let magnitude = 0
    for (let j = i; j < i + windowSize && j < data.length; j++) {
      magnitude += Math.abs(data[j])
    }
    magnitude /= windowSize
    
    // Spectral flux is the positive difference
    const diff = Math.max(0, magnitude - prevMagnitude)
    
    // Apply to window
    for (let j = i; j < i + hopSize && j < data.length; j++) {
      flux[j] = diff
    }
    
    prevMagnitude = magnitude
  }
  
  return flux
}

// Get comb filter weight to emphasize musical BPMs
function getCombFilterWeight(bpm: number): number {
  // Emphasize common BPM values
  const commonBPMs = [60, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 140, 150, 160, 170, 180, 190, 200]
  
  for (const commonBPM of commonBPMs) {
    const diff = Math.abs(bpm - commonBPM)
    if (diff <= 2) {
      return 1.0 + (1.0 - diff / 2) * 0.2 // Up to 20% boost
    }
  }
  
  return 1.0
}

// Smooth correlations to reduce noise
function smoothCorrelations(correlations: Array<{ lag: number; value: number }>): Array<{ lag: number; value: number }> {
  const smoothed: Array<{ lag: number; value: number }> = []
  const windowSize = 3 // 3-point moving average
  
  for (let i = 0; i < correlations.length; i++) {
    let sum = 0
    let count = 0
    
    for (let j = Math.max(0, i - Math.floor(windowSize / 2)); 
         j <= Math.min(correlations.length - 1, i + Math.floor(windowSize / 2)); 
         j++) {
      sum += correlations[j].value
      count++
    }
    
    smoothed.push({
      lag: correlations[i].lag,
      value: sum / count
    })
  }
  
  return smoothed
}

// Validate and correct BPM, especially for fast tempos
function validateAndCorrectBPM(
  initialBPM: number, 
  peaks: Array<{ lag: number; value: number; bpm: number }>,
  confidence: number
): number {
  // If confidence is low, check if we're detecting a harmonic
  if (confidence < 0.7 && peaks.length > 1) {
    // Check if initial BPM is exactly half or double of a stronger peak
    for (const peak of peaks.slice(0, 5)) { // Check top 5 peaks
      if (peak.value > 0.3) { // Only consider strong peaks
        const ratio = initialBPM / peak.bpm
        
        // If initial is half of a strong peak, prefer the peak (faster tempo)
        if (ratio >= 0.48 && ratio <= 0.52 && peak.bpm > initialBPM && peak.bpm <= 300) {
          console.log(`Correcting harmonic: ${initialBPM} → ${peak.bpm} BPM (was detecting half-time)`)
          return peak.bpm
        }
        
        // If initial is double of a strong peak, check if peak makes more sense
        if (ratio >= 1.9 && ratio <= 2.1 && peak.bpm < initialBPM && peak.bpm >= 50) {
          // Prefer the peak if it's a common BPM
          const commonBPMs = [60, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 140, 150, 160, 170, 180]
          const isCommon = commonBPMs.some(c => Math.abs(peak.bpm - c) <= 2)
          if (isCommon) {
            console.log(`Correcting harmonic: ${initialBPM} → ${peak.bpm} BPM (was detecting double-time)`)
            return peak.bpm
          }
        }
      }
    }
  }
  
  return initialBPM
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

// Find prominent peaks in autocorrelation with improved detection
function findCorrelationPeaks(correlations: Array<{ lag: number; value: number }>, sampleRate: number): Array<{ lag: number; value: number; bpm: number }> {
  const peaks: Array<{ lag: number; value: number; bpm: number }> = []
  
  // Adaptive threshold based on correlation values
  const values = correlations.map(c => c.value)
  const maxValue = Math.max(...values)
  const meanValue = values.reduce((a, b) => a + b, 0) / values.length
  const threshold = Math.max(0.15, Math.min(0.3, meanValue + (maxValue - meanValue) * 0.3))
  
  // Find local maxima with improved peak detection
  for (let i = 2; i < correlations.length - 2; i++) {
    const current = correlations[i].value
    const prev1 = correlations[i - 1].value
    const prev2 = correlations[i - 2].value
    const next1 = correlations[i + 1].value
    const next2 = correlations[i + 2].value
    
    // Check if it's a local maximum (peak)
    const isPeak = current > prev1 && current > next1 && 
                   current > prev2 && current > next2 &&
                   current > threshold
    
    if (isPeak) {
      const bpm = (sampleRate * 60) / correlations[i].lag
      
      // Accept wider range for initial detection (we'll filter later)
      if (bpm >= 40 && bpm <= 350) {
        // Calculate peak prominence (how much it stands out)
        const leftMin = Math.min(...correlations.slice(Math.max(0, i - 10), i).map(c => c.value))
        const rightMin = Math.min(...correlations.slice(i + 1, Math.min(correlations.length, i + 11)).map(c => c.value))
        const prominence = current - Math.max(leftMin, rightMin)
        
        peaks.push({
          lag: correlations[i].lag,
          value: current,
          bpm: bpm
        })
      }
    }
  }
  
  // Sort by value (strength) and return top peaks
  return peaks.sort((a, b) => b.value - a.value).slice(0, 15) // More peaks for better analysis
}

// Select best BPM from peaks, considering harmonics and musical context (improved for fast tempos)
function selectBestBPM(peaks: Array<{ lag: number; value: number; bpm: number }>, sampleRate: number): { lag: number; value: number; bpm: number } {
  if (peaks.length === 0) {
    throw new Error('No peaks found')
  }
  
  // Extended common BPM values including fast tempos
  const commonBPMs = [60, 65, 70, 75, 80, 85, 90, 95, 100, 102, 104, 105, 110, 115, 120, 125, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 230, 240, 250, 260, 270, 280, 290, 300]
  
  // Score each peak with improved algorithm
  const scoredPeaks: Array<{ lag: number; value: number; bpm: number; score: number }> = peaks.map(peak => {
    let score = peak.value // Base score from correlation strength
    
    // Bonus for being close to common BPM (stronger bonus for exact matches)
    for (const commonBPM of commonBPMs) {
      const diff = Math.abs(peak.bpm - commonBPM)
      if (diff <= 3) {
        const bonus = 0.2 * (1 - diff / 3) // Up to 20% bonus
        score += bonus
        break
      }
    }
    
    // For fast tempos (>150 BPM), check if we're detecting half-time
    // Fast songs often have strong sub-harmonics
    if (peak.bpm > 150) {
      // Check if there's a peak at half the BPM with similar strength
      const halfBPM = peak.bpm / 2
      const halfPeak = peaks.find(p => Math.abs(p.bpm - halfBPM) <= 5)
      if (halfPeak && halfPeak.value > peak.value * 0.8) {
        // If half-time peak is almost as strong, prefer the faster tempo
        score += 0.1 // Slight bonus for choosing faster tempo
      }
    }
    
    // Check for harmonic relationships with stronger peaks
    for (const otherPeak of peaks) {
      if (otherPeak.value > peak.value * 0.9) { // Similar strength
        const ratio = peak.bpm / otherPeak.bpm
        
        // If this is exactly half of a similar-strength peak, it might be half-time
        if (ratio >= 0.48 && ratio <= 0.52 && peak.bpm < 120) {
          // Only penalize if the other peak is in a reasonable range
          if (otherPeak.bpm >= 50 && otherPeak.bpm <= 300) {
            score *= 0.6 // Strong penalty for half-time when other is available
          }
        }
        
        // If this is exactly double, it might be double-time (often correct for fast songs)
        if (ratio >= 1.9 && ratio <= 2.1) {
          // For fast songs, double-time might be correct
          if (peak.bpm > 150) {
            score *= 0.9 // Small penalty
          } else {
            score *= 0.7 // Larger penalty for slower songs
          }
        }
      }
    }
    
    // Bonus for peaks in the "sweet spot" (80-180 BPM is most common)
    if (peak.bpm >= 80 && peak.bpm <= 180) {
      score += 0.05
    }
    
    return { ...peak, score }
  })
  
  // Return peak with highest score
  const best = scoredPeaks.sort((a, b) => b.score - a.score)[0]
  
  // Final validation: if best peak is very fast (>250 BPM), check if half-time makes more sense
  if (best.bpm > 250) {
    const halfBPM = best.bpm / 2
    const halfPeak = peaks.find(p => Math.abs(p.bpm - halfBPM) <= 3)
    if (halfPeak && halfPeak.value > best.value * 0.7) {
      // If half-time is almost as strong and in reasonable range, prefer it
      if (halfBPM >= 50 && halfBPM <= 200) {
        console.log(`Preferring half-time: ${best.bpm} → ${halfBPM} BPM`)
        return halfPeak
      }
    }
  }
  
  return best
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

// Onset detection based BPM detection (improved for fast tempos)
function detectBPMWithOnsetDetection(audioBuffer: AudioBuffer): number {
  const channelData = audioBuffer.getChannelData(0)
  const sampleRate = audioBuffer.sampleRate
  
  // Apply preprocessing for better onset detection
  const filtered = applyHighPassFilter(channelData, sampleRate, 60)
  const envelope = applyEnvelopeFollower(filtered, sampleRate)
  
  // Detect onsets with improved algorithm
  const onsets = detectOnsetsImproved(envelope, sampleRate)
  
  if (onsets.length < 6) {
    return 0 // Not enough onsets
  }
  
  // Calculate intervals between onsets
  const intervals: number[] = []
  for (let i = 1; i < onsets.length; i++) {
    intervals.push(onsets[i] - onsets[i - 1])
  }
  
  // Filter out outliers and find most common intervals
  const validIntervals = intervals.filter(i => i > 0.1 && i < 2.0) // 30-600 BPM range
  
  if (validIntervals.length < 3) {
    return 0
  }
  
  // Use histogram with finer resolution for fast tempos
  const intervalCounts = new Map<number, number>()
  for (const interval of validIntervals) {
    // Round to nearest 0.05 seconds for better precision
    const rounded = Math.round(interval * 20) / 20
    intervalCounts.set(rounded, (intervalCounts.get(rounded) || 0) + 1)
  }
  
  // Find intervals with highest counts (top 3)
  const sortedIntervals = Array.from(intervalCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
  
  // Check for harmonic relationships
  let bestInterval = sortedIntervals[0][0]
  let bestCount = sortedIntervals[0][1]
  
  // If we have multiple strong candidates, prefer the one that makes musical sense
  for (const [interval, count] of sortedIntervals) {
    const bpm = 60 / interval
    // Prefer intervals that result in common BPMs
    const commonBPMs = [60, 70, 75, 80, 85, 90, 95, 100, 105, 110, 115, 120, 125, 130, 140, 150, 160, 170, 180, 200]
    const isCommon = commonBPMs.some(c => Math.abs(bpm - c) <= 2)
    
    if (isCommon && count >= bestCount * 0.8) {
      bestInterval = interval
      bestCount = count
    }
  }
  
  if (bestInterval === 0) {
    return 0
  }
  
  // Convert interval to BPM
  const bpm = 60 / bestInterval
  
  // Validate: if BPM is very high, check if half-time makes more sense
  if (bpm > 250) {
    const halfBPM = bpm / 2
    const halfInterval = 60 / halfBPM
    const halfCount = intervalCounts.get(Math.round(halfInterval * 20) / 20) || 0
    
    // If half-time has similar count, prefer it
    if (halfCount >= bestCount * 0.7 && halfBPM >= 50 && halfBPM <= 200) {
      return Math.max(50, Math.min(300, Math.round(halfBPM)))
    }
  }
  
  return Math.max(50, Math.min(300, Math.round(bpm)))
}

// Improved onset detection
function detectOnsetsImproved(audioData: Float32Array, sampleRate: number): number[] {
  const onsets: number[] = []
  const windowSize = Math.floor(sampleRate * 0.05) // 50ms windows
  const hopSize = Math.floor(sampleRate * 0.01)    // 10ms hop
  
  let prevEnergy = 0
  let prevDiff = 0
  
  for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
    // Calculate energy in window
    let energy = 0
    for (let j = i; j < i + windowSize && j < audioData.length; j++) {
      energy += audioData[j] * audioData[j]
    }
    energy = Math.sqrt(energy / windowSize)
    
    // Detect sudden increase in energy (onset)
    const diff = energy - prevEnergy
    const diffDiff = diff - prevDiff // Second derivative for sharper detection
    
    // Adaptive threshold
    const threshold = 0.01 + (energy * 0.1)
    
    // Onset if: positive energy change AND positive acceleration
    if (diff > threshold && diffDiff > 0 && energy > 0.05) {
      const time = i / sampleRate
      // Only add if not too close to previous onset (min 50ms apart for fast tempos)
      if (onsets.length === 0 || time - onsets[onsets.length - 1] > 0.05) {
        onsets.push(time)
      }
    }
    
    prevDiff = diff
    prevEnergy = energy
  }
  
  return onsets
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
