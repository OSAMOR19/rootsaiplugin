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
function detectBPM(audioData: Float32Array, sampleRate: number): number {
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

// Calculate similarity score between detected and loop metadata
function calculateScore(
  detectedBPM: number,
  detectedKey: string,
  loopBPM: number,
  loopKey: string
): number {
  // BPM score (closer BPM = higher score)
  const bpmDiff = Math.abs(detectedBPM - loopBPM)
  const bpmScore = Math.max(0, 100 - bpmDiff)
  
  // Key score
  let keyScore = 0
  if (detectedKey === loopKey) {
    keyScore = 50
  } else {
    // Check for relative keys (e.g., Am is relative to C)
    const relativeKeys: { [key: string]: string[] } = {
      'C': ['Am'],
      'Am': ['C', 'F', 'G'],
      'F': ['Am', 'Dm'],
      'G': ['Am', 'Em'],
      'Dm': ['F', 'Bb'],
      'F#m': ['A', 'D']
    }
    
    if (relativeKeys[detectedKey]?.includes(loopKey)) {
      keyScore = 25
    }
  }
  
  return bpmScore + keyScore
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }
    
    // Convert audio file to ArrayBuffer
    const arrayBuffer = await audioFile.arrayBuffer()
    const audioData = new Float32Array(arrayBuffer)
    
    // For demo purposes, we'll use sample rate 44100
    // In a real implementation, you'd extract this from the audio file
    const sampleRate = 44100
    
    // Detect BPM and key
    const detectedBPM = detectBPM(audioData, sampleRate)
    const detectedKey = detectKey(audioData, sampleRate)
    
    // Load loop metadata
    const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')
    const metadataContent = fs.readFileSync(metadataPath, 'utf-8')
    const loops: LoopMetadata[] = JSON.parse(metadataContent)
    
    // Calculate scores for all loops
    const scoredLoops: Recommendation[] = loops.map(loop => ({
      filename: loop.filename,
      bpm: loop.bpm,
      key: loop.key,
      url: loop.url,
      score: calculateScore(detectedBPM, detectedKey, loop.bpm, loop.key)
    }))
    
    // Sort by score and return top 5
    const recommendations = scoredLoops
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
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
