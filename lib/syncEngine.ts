/**
 * Audio Sync Engine - Web Audio API based audio synchronization
 * Provides BPM detection, tempo matching, and synchronized playback
 */

export interface AudioSyncData {
  recordedBuffer: AudioBuffer
  recordedBPM: number
  sampleBuffer: AudioBuffer
  sampleBPM: number
}

export interface SyncPlaybackOptions {
  startTime?: number
  loop?: boolean
  volume?: number
}

class AudioSyncEngine {
  private audioContext: AudioContext | null = null
  private masterGainNode: GainNode | null = null
  private activeSources: AudioBufferSourceNode[] = []

  constructor() {
    this.initializeAudioContext()
  }

  private initializeAudioContext() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGainNode = this.audioContext.createGain()
      this.masterGainNode.connect(this.audioContext.destination)
    }
  }

  private async ensureAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      this.initializeAudioContext()
    }
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume()
    }
    
    if (!this.audioContext) {
      throw new Error('Failed to initialize AudioContext')
    }
    
    return this.audioContext
  }

  /**
   * Load audio file and convert to AudioBuffer
   */
  async loadAudioBuffer(filePath: string): Promise<AudioBuffer> {
    const audioContext = await this.ensureAudioContext()
    
    try {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`Failed to load audio file: ${response.statusText}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      return audioBuffer
    } catch (error) {
      console.error('Error loading audio buffer:', error)
      throw new Error(`Failed to load audio file: ${filePath}`)
    }
  }

  /**
   * Convert Blob to AudioBuffer
   */
  async blobToAudioBuffer(blob: Blob): Promise<AudioBuffer> {
    const audioContext = await this.ensureAudioContext()
    
    try {
      const arrayBuffer = await blob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      return audioBuffer
    } catch (error) {
      console.error('Error converting blob to audio buffer:', error)
      throw new Error('Failed to convert blob to audio buffer')
    }
  }

  /**
   * Simple BPM detection using autocorrelation
   */
  detectBPM(audioBuffer: AudioBuffer): number {
    const sampleRate = audioBuffer.sampleRate
    const channelData = audioBuffer.getChannelData(0) // Use first channel
    
    // Parameters for BPM detection
    const minBPM = 60
    const maxBPM = 200
    const minPeriod = Math.floor(sampleRate * 60 / maxBPM)
    const maxPeriod = Math.floor(sampleRate * 60 / minBPM)
    
    // Downsample for efficiency (reduced factor for better accuracy)
    const downsampleFactor = Math.max(1, Math.floor(sampleRate / 44100)) // Better quality
    const downsampledLength = Math.floor(channelData.length / downsampleFactor)
    const downsampled = new Float32Array(downsampledLength)
    
    for (let i = 0; i < downsampledLength; i++) {
      let sum = 0
      for (let j = 0; j < downsampleFactor; j++) {
        sum += channelData[i * downsampleFactor + j]
      }
      downsampled[i] = sum / downsampleFactor
    }
    
    // Apply improved high-pass filter to emphasize transients
    const filtered = this.highPassFilter(downsampled, 0.05) // Lower cutoff for better transient detection
    
    // Autocorrelation
    let bestPeriod = 0
    let bestCorrelation = 0
    
    for (let period = minPeriod; period <= maxPeriod; period += Math.floor(period * 0.01)) {
      let correlation = 0
      const correlationLength = Math.min(downsampledLength - period, 10000)
      
      for (let i = 0; i < correlationLength; i++) {
        correlation += filtered[i] * filtered[i + period]
      }
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation
        bestPeriod = period
      }
    }
    
    const detectedBPM = Math.round((sampleRate * 60) / (bestPeriod * downsampleFactor))
    return Math.max(minBPM, Math.min(maxBPM, detectedBPM))
  }

  /**
   * Detect precise beat positions using onset detection
   */
  private detectBeatPositions(audioBuffer: AudioBuffer): number[] {
    const sampleRate = audioBuffer.sampleRate
    const data = audioBuffer.getChannelData(0)
    
    // Downsample for efficiency
    const downsampleFactor = Math.max(1, Math.floor(sampleRate / 22050))
    const downsampledLength = Math.floor(data.length / downsampleFactor)
    const downsampled = new Float32Array(downsampledLength)
    
    for (let i = 0; i < downsampledLength; i++) {
      downsampled[i] = data[i * downsampleFactor]
    }
    
    // Apply high-pass filter for transient detection
    const filtered = this.highPassFilter(downsampled, 0.1)
    
    // Calculate onset strength (energy difference)
    const onsetStrength = new Float32Array(downsampledLength)
    const windowSize = Math.floor(sampleRate * 0.01 / downsampleFactor) // 10ms window
    
    for (let i = windowSize; i < downsampledLength - windowSize; i++) {
      let energyBefore = 0
      let energyAfter = 0
      
      for (let j = 0; j < windowSize; j++) {
        energyBefore += filtered[i - windowSize + j] * filtered[i - windowSize + j]
        energyAfter += filtered[i + j] * filtered[i + j]
      }
      
      onsetStrength[i] = Math.max(0, energyAfter - energyBefore)
    }
    
    // Find peaks (beat positions)
    const beatPositions: number[] = []
    const threshold = this.calculateThreshold(onsetStrength)
    const minBeatInterval = Math.floor(sampleRate * 0.2 / downsampleFactor) // 200ms minimum
    
    let lastBeat = -minBeatInterval
    
    for (let i = 0; i < downsampledLength; i++) {
      if (onsetStrength[i] > threshold && i - lastBeat > minBeatInterval) {
        beatPositions.push(i * downsampleFactor) // Convert back to original sample rate
        lastBeat = i
      }
    }
    
    return beatPositions
  }
  
  /**
   * Calculate adaptive threshold for beat detection
   */
  private calculateThreshold(onsetStrength: Float32Array): number {
    // Calculate mean and standard deviation
    let sum = 0
    let sumSquares = 0
    
    for (let i = 0; i < onsetStrength.length; i++) {
      sum += onsetStrength[i]
      sumSquares += onsetStrength[i] * onsetStrength[i]
    }
    
    const mean = sum / onsetStrength.length
    const variance = (sumSquares / onsetStrength.length) - (mean * mean)
    const stdDev = Math.sqrt(variance)
    
    return mean + (stdDev * 1.5) // Adaptive threshold
  }
  
  /**
   * Find the best beat to align with (closest to start)
   */
  private findAlignmentBeat(beatPositions: number[], sampleRate: number): number {
    if (beatPositions.length === 0) return 0
    
    // Find beat closest to 1 second mark (typical for music)
    const targetTime = sampleRate * 1.0 // 1 second
    let bestBeat = beatPositions[0]
    let minDistance = Math.abs(beatPositions[0] - targetTime)
    
    for (const beat of beatPositions) {
      const distance = Math.abs(beat - targetTime)
      if (distance < minDistance) {
        minDistance = distance
        bestBeat = beat
      }
    }
    
    return bestBeat
  }
  
  /**
   * Quantize BPM to nearest standard value
   */
  private quantizeBPM(bpm: number): number {
    const standardBPMs = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180]
    let closestBPM = standardBPMs[0]
    let minDifference = Math.abs(bpm - standardBPMs[0])
    
    for (const standardBPM of standardBPMs) {
      const difference = Math.abs(bpm - standardBPM)
      if (difference < minDifference) {
        minDifference = difference
        closestBPM = standardBPM
      }
    }
    
    return closestBPM
  }

  /**
   * Simple high-pass filter
   */
  private highPassFilter(data: Float32Array, cutoff: number): Float32Array {
    const filtered = new Float32Array(data.length)
    let prevInput = 0
    let prevOutput = 0
    
    for (let i = 0; i < data.length; i++) {
      const input = data[i]
      const output = cutoff * (prevOutput + input - prevInput)
      filtered[i] = output
      prevInput = input
      prevOutput = output
    }
    
    return filtered
  }

  /**
   * Stop all currently playing audio
   */
  stopAll(): void {
    this.activeSources.forEach(source => {
      try {
        source.stop()
      } catch (error) {
        // Source might already be stopped
      }
    })
    this.activeSources = []
  }

  /**
   * Play single audio buffer
   */
  async playAudioBuffer(
    audioBuffer: AudioBuffer, 
    options: SyncPlaybackOptions = {}
  ): Promise<AudioBufferSourceNode> {
    const audioContext = await this.ensureAudioContext()
    const { startTime = 0, loop = false, volume = 1 } = options
    
    const source = audioContext.createBufferSource()
    const gainNode = audioContext.createGain()
    
    source.buffer = audioBuffer
    source.loop = loop
    gainNode.gain.value = volume
    
    source.connect(gainNode)
    gainNode.connect(this.masterGainNode!)
    
    const scheduleTime = audioContext.currentTime + startTime
    source.start(scheduleTime)
    
    this.activeSources.push(source)
    
    // Clean up when finished
    source.onended = () => {
      const index = this.activeSources.indexOf(source)
      if (index > -1) {
        this.activeSources.splice(index, 1)
      }
    }
    
    return source
  }

  /**
   * Sync play recorded audio with library sample
   */
  async syncPlay(
    recordedBuffer: AudioBuffer,
    sampleBuffer: AudioBuffer,
    sampleBPM: number,
    options: SyncPlaybackOptions = {}
  ): Promise<{ recordedSource: AudioBufferSourceNode; sampleSource: AudioBufferSourceNode }> {
    const audioContext = await this.ensureAudioContext()
    const { startTime = 0, volume = 1 } = options
    
    // Detect precise BPM and beat positions
    const recordedBPM = this.detectBPM(recordedBuffer)
    const quantizedBPM = this.quantizeBPM(recordedBPM)
    const beatPositions = this.detectBeatPositions(recordedBuffer)
    
    console.log('Sync Analysis:', {
      detectedBPM: recordedBPM,
      quantizedBPM: quantizedBPM,
      sampleBPM: sampleBPM,
      beatPositions: beatPositions.length
    })
    
    // Calculate precise playback rate
    const playbackRate = quantizedBPM / sampleBPM
    
    // Stop any currently playing audio
    this.stopAll()
    
    // Create sources
    const recordedSource = audioContext.createBufferSource()
    const sampleSource = audioContext.createBufferSource()
    
    // Create gain nodes for volume control
    const recordedGain = audioContext.createGain()
    const sampleGain = audioContext.createGain()
    
    // Configure sources
    recordedSource.buffer = recordedBuffer
    sampleSource.buffer = sampleBuffer
    sampleSource.playbackRate.value = playbackRate
    
    // Set volumes with better balance
    recordedGain.gain.value = volume * 0.5 // Recorded audio quieter
    sampleGain.gain.value = volume * 1.0   // Sample at full volume
    
    // Connect audio graph
    recordedSource.connect(recordedGain)
    sampleSource.connect(sampleGain)
    recordedGain.connect(this.masterGainNode!)
    sampleGain.connect(this.masterGainNode!)
    
    // Calculate precise alignment
    let alignmentOffset = 0
    if (beatPositions.length > 0) {
      const alignmentBeat = this.findAlignmentBeat(beatPositions, recordedBuffer.sampleRate)
      alignmentOffset = alignmentBeat / recordedBuffer.sampleRate // Convert to seconds
    }
    
    // Add small latency compensation
    const latencyCompensation = 0.01 // 10ms compensation
    
    // Schedule playback with precise alignment
    const scheduleTime = audioContext.currentTime + startTime + latencyCompensation
    recordedSource.start(scheduleTime)
    sampleSource.start(scheduleTime + alignmentOffset)
    
    console.log('Sync Playback:', {
      playbackRate: playbackRate,
      alignmentOffset: alignmentOffset,
      scheduleTime: scheduleTime
    })
    
    // Track active sources
    this.activeSources.push(recordedSource, sampleSource)
    
    // Clean up when finished
    const cleanup = () => {
      const recordedIndex = this.activeSources.indexOf(recordedSource)
      const sampleIndex = this.activeSources.indexOf(sampleSource)
      
      if (recordedIndex > -1) this.activeSources.splice(recordedIndex, 1)
      if (sampleIndex > -1) this.activeSources.splice(sampleIndex, 1)
    }
    
    recordedSource.onended = cleanup
    sampleSource.onended = cleanup
    
    console.log(`Sync Play: Recorded BPM: ${recordedBPM}, Sample BPM: ${sampleBPM}, Playback Rate: ${playbackRate.toFixed(2)}`)
    
    return { recordedSource, sampleSource }
  }

  /**
   * Get current audio context time
   */
  getCurrentTime(): number {
    return this.audioContext?.currentTime || 0
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number): void {
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = Math.max(0, Math.min(1, volume))
    }
  }

  /**
   * Dispose of audio context
   */
  dispose(): void {
    this.stopAll()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

// Export singleton instance
export const syncEngine = new AudioSyncEngine()

// Export utility functions
export const loadAudioBuffer = (filePath: string) => syncEngine.loadAudioBuffer(filePath)
export const blobToAudioBuffer = (blob: Blob) => syncEngine.blobToAudioBuffer(blob)
export const detectBPM = (audioBuffer: AudioBuffer) => syncEngine.detectBPM(audioBuffer)
export const syncPlay = (recordedBuffer: AudioBuffer, sampleBuffer: AudioBuffer, sampleBPM: number, options?: SyncPlaybackOptions) => 
  syncEngine.syncPlay(recordedBuffer, sampleBuffer, sampleBPM, options)
export const playAudioBuffer = (audioBuffer: AudioBuffer, options?: SyncPlaybackOptions) => 
  syncEngine.playAudioBuffer(audioBuffer, options)
export const stopAll = () => syncEngine.stopAll()
export const setMasterVolume = (volume: number) => syncEngine.setMasterVolume(volume)
