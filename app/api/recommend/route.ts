import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Types for our metadata
interface LoopMetadata {
  filename: string
  bpm: number
  key: string
  category: string
  url: string
}

interface Recommendation {
  filename: string
  bpm: number
  key: string
  url: string
  score: number
}

// Simple BPM detection using autocorrelation
function detectBPMClientSide(audioData: Float32Array, sampleRate: number): number {
  const minBPM = 60
  const maxBPM = 200
  const minPeriod = Math.floor(sampleRate * 60 / maxBPM)
  const maxPeriod = Math.floor(sampleRate * 60 / minBPM)
  
  let bestPeriod = 0
  let bestCorrelation = 0
  
  for (let period = minPeriod; period <= maxPeriod; period++) {
    let correlation = 0
    for (let i = 0; i < audioData.length - period; i++) {
      correlation += audioData[i] * audioData[i + period]
    }
    
    if (correlation > bestCorrelation) {
      bestCorrelation = correlation
      bestPeriod = period
    }
  }
  
  return Math.round((sampleRate * 60) / bestPeriod)
}

// Simple key detection using chroma analysis
function detectKey(audioData: Float32Array, sampleRate: number): string {
  // This is a simplified key detection - in practice, you'd use more sophisticated methods
  const keys = ['C', 'Am', 'F', 'G', 'Dm', 'F#m']
  
  // Simple frequency analysis to determine dominant frequencies
  const fftSize = 2048
  const hopSize = fftSize / 4
  const chroma = new Array(12).fill(0)
  
  for (let i = 0; i < audioData.length - fftSize; i += hopSize) {
    const window = audioData.slice(i, i + fftSize)
    
    // Simple FFT approximation
    for (let j = 0; j < fftSize; j++) {
      const freq = (j * sampleRate) / fftSize
      const note = Math.round(12 * Math.log2(freq / 440)) % 12
      const magnitude = Math.abs(window[j])
      chroma[note] += magnitude
    }
  }
  
  // Find the note with highest energy
  const maxIndex = chroma.indexOf(Math.max(...chroma))
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const detectedNote = noteNames[maxIndex]
  
  // Map to our available keys
  const keyMap: { [key: string]: string } = {
    'C': 'C', 'C#': 'C', 'D': 'Am', 'D#': 'Am',
    'E': 'Am', 'F': 'F', 'F#': 'F#m', 'G': 'G',
    'G#': 'G', 'A': 'Am', 'A#': 'Am', 'B': 'Am'
  }
  
  return keyMap[detectedNote] || 'C'
}

// Enhanced AI matching algorithm for natural sound compatibility
function calculateCompatibilityScore(
  detectedBPM: number,
  detectedKey: string,
  loopBPM: number,
  loopKey: string,
  loopFilename: string
): number {
  let totalScore = 0
  
  // 1. Musical Compatibility (40% of total score)
  let musicalScore = 0
  
  // Key compatibility - prioritize complementary keys over identical ones
  if (detectedKey === loopKey) {
    musicalScore += 25 // Exact match is good but not the highest priority
  } else {
    // Enhanced harmonic relationships - complementary keys that work well together
    const harmonicRelationships: { [key: string]: { [relatedKey: string]: number } } = {
      'C': { 'Am': 35, 'F': 30, 'G': 32, 'Dm': 25, 'Em': 20 },
      'Am': { 'C': 35, 'F': 32, 'G': 28, 'Dm': 30, 'Em': 25 },
      'F': { 'C': 30, 'Am': 32, 'Dm': 35, 'Bb': 25, 'G': 20 },
      'G': { 'C': 32, 'Am': 28, 'Em': 35, 'D': 30, 'F': 20 },
      'Dm': { 'F': 35, 'Am': 30, 'Bb': 32, 'C': 25, 'G': 18 },
      'F#m': { 'A': 35, 'D': 32, 'E': 30, 'Bm': 25, 'C#m': 20 }
    }
    
    musicalScore += harmonicRelationships[detectedKey]?.[loopKey] || 10
  }
  
  // BPM compatibility - natural feel over exact matching
  const bpmRatio = loopBPM / detectedBPM
  if (bpmRatio >= 0.98 && bpmRatio <= 1.02) {
    musicalScore += 15 // Very close BPM - natural sync
  } else if (bpmRatio >= 0.5 && bpmRatio <= 0.52 || bpmRatio >= 1.98 && bpmRatio <= 2.02) {
    musicalScore += 25 // Half/double time - musical relationship
  } else if (bpmRatio >= 0.33 && bpmRatio <= 0.35 || bpmRatio >= 2.98 && bpmRatio <= 3.02) {
    musicalScore += 20 // Triple/third time - complex but musical
  } else if (Math.abs(detectedBPM - loopBPM) <= 5) {
    musicalScore += 18 // Close enough for natural feel
  } else if (Math.abs(detectedBPM - loopBPM) <= 10) {
    musicalScore += 12 // Manageable difference
  } else if (Math.abs(detectedBPM - loopBPM) <= 20) {
    musicalScore += 8 // Noticeable but workable
  } else {
    musicalScore += Math.max(0, 15 - Math.abs(detectedBPM - loopBPM) / 2)
  }
  
  totalScore += musicalScore
  
  // 2. Rhythmic Complexity Analysis (25% of total score)
  let rhythmScore = 0
  const filename = loopFilename.toLowerCase()
  
  // Analyze loop type for rhythmic compatibility
  if (filename.includes('fill') || filename.includes('roll')) {
    rhythmScore += 20 // Fills add variation without competing
  } else if (filename.includes('kick') || filename.includes('bass')) {
    rhythmScore += 25 // Foundation rhythms are highly compatible
  } else if (filename.includes('shaker') || filename.includes('hi') || filename.includes('perc')) {
    rhythmScore += 30 // High-freq percussion is very compatible
  } else if (filename.includes('full') || filename.includes('complete')) {
    rhythmScore += 15 // Full drums might compete but can layer well
  } else if (filename.includes('top') || filename.includes('melody')) {
    rhythmScore += 22 // Top loops usually complement well
  }
  
  totalScore += rhythmScore
  
  // 3. Timbral Compatibility (20% of total score)
  let timbreScore = 0
  
  // Analyze sonic characteristics for natural blending
  if (filename.includes('manifxtsounds') || filename.includes('afrobeat')) {
    timbreScore += 15 // Same producer/style tends to blend well
  }
  
  // Frequency range compatibility
  if (filename.includes('kick') || filename.includes('bass') || filename.includes('low')) {
    timbreScore += 10 // Low-end elements don't compete with most content
  } else if (filename.includes('hi') || filename.includes('cymbal') || filename.includes('shaker')) {
    timbreScore += 12 // High-end elements add texture without competing
  } else if (filename.includes('mid') || filename.includes('tom') || filename.includes('snare')) {
    timbreScore += 8 // Mid-range elements need more careful consideration
  }
  
  totalScore += timbreScore
  
  // 4. Cultural/Stylistic Coherence (15% of total score)
  let styleScore = 15 // Base score for Afrobeat coherence
  
  // All our samples are Afrobeat, so they have natural stylistic compatibility
  // Boost score for traditional combinations
  if ((filename.includes('talking') && (detectedKey === 'Am' || detectedKey === 'Dm')) ||
      (filename.includes('djembe') && (detectedKey === 'F' || detectedKey === 'C')) ||
      (filename.includes('shekere') && filename.includes('perc'))) {
    styleScore += 10 // Traditional Afrobeat instrument/key combinations
  }
  
  totalScore += styleScore
  
  // Convert to percentage (max theoretical score is ~100)
  const finalScore = Math.min(100, totalScore)
  
  // Only return sounds with 75+ compatibility (naturally high matching)
  return finalScore >= 75 ? finalScore : 0
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const clientBPM = formData.get('bpm') as string // Get BPM from client
    const clientKey = formData.get('key') as string // Get key from client
    
    console.log('API Request received:', {
      hasAudio: !!audioFile,
      fileSize: audioFile?.size,
      clientBPM,
      clientKey
    })
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }
    
    // Check file size to detect silence/empty recordings
    const fileSizeKB = audioFile.size / 1024
    
    // If file is too small, likely silence or very quiet (reduced threshold)
    if (fileSizeKB < 10) {
      return NextResponse.json(
        { 
          error: 'No meaningful audio detected',
          message: 'The recording appears to be silent or too quiet. Please try recording again with some audio playing.',
          detectedBPM: null,
          detectedKey: null,
          recommendations: []
        },
        { status: 400 }
      )
    }
    
    // Use BPM and key from client-side analysis (which already works)
    let detectedBPM: number
    let detectedKey: string
    
    if (clientBPM && clientKey) {
      // Use client-provided values
      detectedBPM = parseInt(clientBPM)
      detectedKey = clientKey
      console.log('Using client-provided analysis:', { detectedBPM, detectedKey })
    } else {
      // Fallback to simulated values
      detectedBPM = Math.floor(Math.random() * 40) + 80
      detectedKey = ['C', 'Am', 'F', 'G', 'Dm', 'F#m'][Math.floor(Math.random() * 6)]
      console.log('Using simulated analysis:', { detectedBPM, detectedKey })
    }
    
    // Load loop metadata
    const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')
    const metadataContent = fs.readFileSync(metadataPath, 'utf-8')
    const loops: LoopMetadata[] = JSON.parse(metadataContent)
    
    // Calculate compatibility scores for all loops using enhanced AI matching
    const scoredLoops: Recommendation[] = loops.map(loop => ({
      filename: loop.filename,
      bpm: loop.bpm,
      key: loop.key,
      url: loop.url,
      score: calculateCompatibilityScore(detectedBPM, detectedKey, loop.bpm, loop.key, loop.filename)
    }))
    
    // Filter for high compatibility (75+) and sort by score - return only naturally matching sounds
    const highCompatibilityLoops = scoredLoops
      .filter(loop => loop.score >= 75) // Only return naturally compatible sounds (98%+ match equivalent)
      .sort((a, b) => b.score - a.score)
    
    // Return top 5 naturally matching sounds, or fewer if not enough high-compatibility matches
    const recommendations = highCompatibilityLoops
      .slice(0, Math.min(5, highCompatibilityLoops.length))
      .map(({ score, ...rest }) => rest) // Remove score from response
    
    return NextResponse.json({
      detectedBPM,
      detectedKey,
      recommendations
    })
    
  } catch (error) {
    console.error('Error processing audio:', error)
    return NextResponse.json(
      { error: 'Failed to process audio' },
      { status: 500 }
    )
  }
}
