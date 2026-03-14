/**
 * Audio Analysis Helper
 * Simplified wrapper around Essentia.js for audio analysis
 */

import { analyzeTrack } from './essentia/analyzeTrack'

export interface AudioAnalysisResult {
  bpm?: number
  key?: string
  energy?: number
  danceability?: number
  valence?: number
  moodTag?: string
  error?: string
}

/**
 * Generate mood tag based on audio features
 */
function generateMoodTag(analysis: {
  energy?: number
  danceability?: number
  valence?: number
  key?: string
}): string {
  const { energy = 0, danceability = 0, valence = 0.5, key = '' } = analysis

  // Apply mood logic from requirements
  if (energy > 0.7 && danceability > 0.7) {
    return 'dance'
  } else if (valence > 0.6) {
    return 'happy'
  } else if (valence < 0.3) {
    return 'sad'
  } else if (key && key.toLowerCase().includes('minor')) {
    return 'dark'
  } else {
    return 'neutral'
  }
}

/**
 * Analyze audio buffer and extract features
 * This is a simplified version that works in Node.js environment
 */
export async function analyzeAudioBuffer(
  audioBuffer: Buffer,
  filename: string
): Promise<AudioAnalysisResult> {
  try {
    console.log(`🎵 Analyzing audio: ${filename}`)

    // Try to use Essentia.js analysis
    try {
      // Convert Buffer to Float32Array for Essentia (Mock conversion for now since this is Node)
      // Actual implementation would need standard AudioContext or wav decoder
      const float32Array = new Float32Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 4)
      const sampleRate = 44100 // Default Essentia sample rate expectations
      
      const analysis = await analyzeTrack(float32Array, sampleRate)
      
      const result: AudioAnalysisResult = {
        bpm: analysis.bpm ?? undefined,
        key: analysis.key.tonic ? `${analysis.key.tonic} ${analysis.key.scale || ''}`.trim() : undefined,
        energy: analysis.energy ?? undefined,
        danceability: analysis.danceability ?? undefined,
        valence: analysis.valence ?? undefined,
      }

      // Generate mood tag
      result.moodTag = generateMoodTag(result)

      console.log(`✅ Analysis complete: BPM=${result.bpm}, Key=${result.key}, Mood=${result.moodTag}`)
      
      return result
    } catch (essentiaError) {
      console.warn(`⚠️  Essentia analysis failed, using defaults:`, essentiaError)
      
      // Fallback to default values
      return {
        bpm: 120,
        key: 'C',
        energy: 0.5,
        danceability: 0.5,
        valence: 0.5,
        moodTag: 'neutral',
        error: 'Analysis failed, using defaults'
      }
    }
  } catch (error: any) {
    console.error(`❌ Audio analysis error:`, error)
    
    return {
      bpm: 120,
      key: 'C',
      energy: 0.5,
      danceability: 0.5,
      valence: 0.5,
      moodTag: 'neutral',
      error: error.message || 'Analysis failed'
    }
  }
}

/**
 * Quick BPM detection only (faster than full analysis)
 */
export async function detectBPM(audioBuffer: Buffer, filename: string): Promise<number> {
  try {
    const analysis = await analyzeAudioBuffer(audioBuffer, filename)
    return analysis.bpm || 120
  } catch (error) {
    console.error('BPM detection failed:', error)
    return 120
  }
}

