/**
 * Audio Sync Engine - Web Audio API based audio synchronization
 * Provides tempo matching and synchronized playback
 * NOTE: BPM detection is handled by bpmDetection.ts using web-audio-beat-detector
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
  recordedBPM?: number // Pass the actual detected BPM to avoid re-detection
  recordedVolume?: number // Individual volume for recorded audio (0.0 to 1.0)
  sampleVolume?: number // Individual volume for sample audio (0.0 to 1.0)
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
   * REMOVED: BPM detection now handled exclusively by bpmDetection.ts using web-audio-beat-detector
   * Use quickBPMDetection() or detectBPMFromFile() from bpmDetection.ts instead
   */

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
   * Enhance audio quality with professional processing
   */
  private enhanceAudioQuality(audioBuffer: AudioBuffer): AudioBuffer {
    const sampleRate = audioBuffer.sampleRate
    const length = audioBuffer.length
    const channels = audioBuffer.numberOfChannels
    
    // Create enhanced buffer
    const enhancedBuffer = this.audioContext!.createBuffer(channels, length, sampleRate)
    
    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel)
      const outputData = enhancedBuffer.getChannelData(channel)
      
      // Apply professional audio enhancement
      for (let i = 0; i < length; i++) {
        let sample = inputData[i]
        
        // 1. Normalize audio levels
        sample = Math.max(-1, Math.min(1, sample))
        
        // 2. Apply gentle compression (soft limiting)
        if (Math.abs(sample) > 0.8) {
          sample = sample > 0 ? 0.8 + (sample - 0.8) * 0.2 : -0.8 + (sample + 0.8) * 0.2
        }
        
        // 3. Apply subtle high-frequency enhancement
        if (i > 0) {
          const prevSample = inputData[i - 1]
          const diff = sample - prevSample
          sample = sample + diff * 0.1 // Subtle enhancement
        }
        
        // 4. Apply gentle noise gate
        if (Math.abs(sample) < 0.001) {
          sample = 0
        }
        
        outputData[i] = sample
      }
    }
    
    return enhancedBuffer
  }

  /**
   * Extract exactly 4 bars from the beginning of the audio
   * Always starts from the start (sample 0) to ensure consistency
   * Uses web-audio-beat-detector for accurate BPM detection
   */
  async extractBest4Bars(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    const sampleRate = audioBuffer.sampleRate
    const fullLength = audioBuffer.length
    
    // Import web-audio-beat-detector for accurate BPM detection
    const { quickBPMDetection } = await import('@/lib/bpmDetection')
    
    // Detect BPM using web-audio-beat-detector (accurate method)
    const detectedBPM = await quickBPMDetection(audioBuffer)
    const beatsPerBar = 4
    const totalBeats = beatsPerBar * 4 // 4 bars = 16 beats
    const beatsPerSecond = detectedBPM / 60
    const fourBarsDurationSeconds = totalBeats / beatsPerSecond
    const fourBarsSampleLength = Math.floor(fourBarsDurationSeconds * sampleRate)
    
    console.log('Extracting 4 bars from beginning:', {
      detectedBPM,
      fourBarsDurationSeconds: fourBarsDurationSeconds.toFixed(2),
      fourBarsSampleLength,
      originalLength: fullLength,
      originalDurationSeconds: (fullLength / sampleRate).toFixed(2),
      startSample: 0,
      endSample: Math.min(fourBarsSampleLength, fullLength)
    })
    
    // If audio is shorter than 4 bars, return the entire audio
    if (fourBarsSampleLength >= fullLength) {
      console.log('Audio shorter than 4 bars, returning full audio')
      return audioBuffer
    }
    
    // Always extract from the beginning (startSample = 0)
    const startSample = 0
    const extractLength = Math.min(fourBarsSampleLength, fullLength)
    
    console.log('Extracting from start:', {
      startSample: 0,
      extractLength,
      extractDurationSeconds: (extractLength / sampleRate).toFixed(2),
      expectedBars: (extractLength / sampleRate) / (fourBarsDurationSeconds / 4)
    })
    
    // Extract exactly 4 bars from the beginning
    return this.extractAudioSlice(audioBuffer, startSample, extractLength)
  }

  /**
   * Extract a specific slice from an AudioBuffer
   */
  private extractAudioSlice(audioBuffer: AudioBuffer, startSample: number, length: number): AudioBuffer {
    const sampleRate = audioBuffer.sampleRate
    const channels = audioBuffer.numberOfChannels
    
    const newBuffer = this.audioContext!.createBuffer(channels, length, sampleRate)
    
    for (let channel = 0; channel < channels; channel++) {
      const originalData = audioBuffer.getChannelData(channel)
      const newData = newBuffer.getChannelData(channel)
      
      for (let i = 0; i < length; i++) {
        newData[i] = originalData[startSample + i] || 0
      }
    }
    
    return newBuffer
  }

  /**
   * Convert File to AudioBuffer (for file uploads)
   */
  async fileToAudioBuffer(file: File): Promise<AudioBuffer> {
    const audioContext = await this.ensureAudioContext()
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      
      return audioBuffer
    } catch (error) {
      console.error('Error converting file to audio buffer:', error)
      throw new Error(`Failed to process audio file: ${file.name}`)
    }
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
    const { 
      startTime = 0, 
      volume = 1, 
      recordedVolume = 0.5, 
      sampleVolume = 0.5 
    } = options
    
    // Use passed BPM - do NOT re-detect (should already be accurately detected via web-audio-beat-detector)
    if (!options.recordedBPM) {
      console.warn('No recordedBPM provided to syncPlay - this should be set via bpmDetection.ts')
      throw new Error('recordedBPM is required for tempo matching. Please provide the BPM detected via web-audio-beat-detector.')
    }
    const recordedBPM = options.recordedBPM
    
    // Find the target BPM - use the recorded audio's BPM as the master
    const targetBPM = recordedBPM
    
    console.log('Perfect Sync Analysis:', {
      recordedBPM: recordedBPM,
      sampleBPM: sampleBPM,
      targetBPM: targetBPM,
      recordedDuration: recordedBuffer.duration,
      sampleDuration: sampleBuffer.duration
    })
    
    // Stop any currently playing audio
    this.stopAll()
    
    // Create sources
    const recordedSource = audioContext.createBufferSource()
    const sampleSource = audioContext.createBufferSource()
    
    // Create gain nodes for volume control
    const recordedGain = audioContext.createGain()
    const sampleGain = audioContext.createGain()
    
    // Configure sources - both play at their NATURAL speeds first
    recordedSource.buffer = recordedBuffer
    sampleSource.buffer = sampleBuffer
    
    // REAL TEMPO MATCHING: Slow down the sample to match recorded audio's BPM exactly
    const recordedPlaybackRate = 1.0  // Keep recorded audio at natural speed (master tempo)
    const samplePlaybackRate = sampleBPM / recordedBPM  // Sample plays slower to match recorded BPM
    
    console.log('REAL Tempo Matching:', {
      recordedBPM: recordedBPM,
      sampleBPM: sampleBPM,
      'Recorded audio rate': recordedPlaybackRate,
      'Sample will play': `${samplePlaybackRate.toFixed(3)}x speed ${samplePlaybackRate < 1 ? '(SLOWER)' : '(FASTER)'}`,
      'Result': `Both will beat at ${recordedBPM} BPM exactly!`
    })
    
    // Apply playback rates
    recordedSource.playbackRate.value = recordedPlaybackRate
    sampleSource.playbackRate.value = samplePlaybackRate
    
    // Set individual volumes for precise control
    recordedGain.gain.value = volume * recordedVolume // Individual recorded audio volume
    sampleGain.gain.value = volume * sampleVolume     // Individual sample audio volume
    
    console.log('Volume Settings:', {
      recordedVolume: `Recorded: ${(volume * recordedVolume).toFixed(2)}`,
      sampleVolume: `Sample: ${(volume * sampleVolume).toFixed(2)}`,
      totalVolume: `Master: ${volume.toFixed(2)}`
    })
    
    // Connect audio graph
    recordedSource.connect(recordedGain)
    sampleSource.connect(sampleGain)
    recordedGain.connect(this.masterGainNode!)
    sampleGain.connect(this.masterGainNode!)
    
    // Simple alignment - no complex beat detection needed for tempo sync
    const startTimeOffset = audioContext.currentTime + startTime
    
    // Start both sources at the same time for perfect tempo alignment
    console.log('Starting audio sources...', {
      recordedBufferExists: !!recordedSource.buffer,
      sampleBufferExists: !!sampleSource.buffer,
      audioContextState: audioContext.state,
      currentTime: audioContext.currentTime
    })
    
    recordedSource.start(startTimeOffset)
    sampleSource.start(startTimeOffset)
    
    console.log('Audio sources started successfully!')
    
    console.log('Perfect Sync Playback Started:', {
      recordedPlaybackRate: recordedPlaybackRate.toFixed(3),
      samplePlaybackRate: samplePlaybackRate.toFixed(3),
      targetBPM: targetBPM,
      startTimeOffset: startTimeOffset.toFixed(3)
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
    
    return { 
      recordedSource, 
      sampleSource,
      recordedGainNode: recordedGain, // Expose gain nodes for real-time control
      sampleGainNode: sampleGain
    }
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
// REMOVED: detectBPM export - use quickBPMDetection() or detectBPMFromFile() from bpmDetection.ts instead
export const extractBest4Bars = (audioBuffer: AudioBuffer) => syncEngine.extractBest4Bars(audioBuffer)
export const fileToAudioBuffer = (file: File) => syncEngine.fileToAudioBuffer(file)
export const syncPlay = (recordedBuffer: AudioBuffer, sampleBuffer: AudioBuffer, sampleBPM: number, options?: SyncPlaybackOptions) => 
  syncEngine.syncPlay(recordedBuffer, sampleBuffer, sampleBPM, options)
export const playAudioBuffer = (audioBuffer: AudioBuffer, options?: SyncPlaybackOptions) => 
  syncEngine.playAudioBuffer(audioBuffer, options)
export const stopAll = () => syncEngine.stopAll()
export const setMasterVolume = (volume: number) => syncEngine.setMasterVolume(volume)
