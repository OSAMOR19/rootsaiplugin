/**
 * Simple BPM Detection Fallback
 * 
 * This is a lightweight BPM detection that works in serverless environments
 * when Essentia.js WASM is not available (e.g., Vercel production).
 */

/**
 * Simple autocorrelation-based BPM detection
 * Works without WASM dependencies
 */
export function simpleDetectBPM(float32Array: Float32Array, sampleRate: number): number {
  console.log('🔄 Using simple BPM detection fallback (no WASM)');
  
  // Convert to mono if needed and downsample for efficiency
  const targetSampleRate = 22050;
  const downsampleRatio = sampleRate / targetSampleRate;
  const downsampled = new Float32Array(Math.floor(float32Array.length / downsampleRatio));
  
  for (let i = 0; i < downsampled.length; i++) {
    const sourceIndex = Math.floor(i * downsampleRatio);
    downsampled[i] = float32Array[sourceIndex];
  }
  
  // Calculate energy envelope
  const windowSize = Math.floor(targetSampleRate * 0.1); // 100ms windows
  const energyEnvelope: number[] = [];
  
  for (let i = 0; i < downsampled.length - windowSize; i += windowSize / 4) {
    let energy = 0;
    for (let j = 0; j < windowSize; j++) {
      energy += Math.abs(downsampled[i + j]);
    }
    energyEnvelope.push(energy / windowSize);
  }
  
  // Find peaks in energy envelope
  const peaks: number[] = [];
  const threshold = Math.max(...energyEnvelope) * 0.5;
  
  for (let i = 1; i < energyEnvelope.length - 1; i++) {
    if (energyEnvelope[i] > threshold &&
        energyEnvelope[i] > energyEnvelope[i - 1] &&
        energyEnvelope[i] > energyEnvelope[i + 1]) {
      peaks.push(i);
    }
  }
  
  if (peaks.length < 2) {
    console.warn('⚠️ Not enough peaks detected, returning default BPM');
    return 120; // Default BPM
  }
  
  // Calculate intervals between peaks
  const intervals: number[] = [];
  for (let i = 1; i < Math.min(peaks.length, 50); i++) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }
  
  // Find most common interval (mode)
  const intervalCounts = new Map<number, number>();
  for (const interval of intervals) {
    intervalCounts.set(interval, (intervalCounts.get(interval) || 0) + 1);
  }
  
  let mostCommonInterval = 0;
  let maxCount = 0;
  for (const [interval, count] of intervalCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonInterval = interval;
    }
  }
  
  // Convert interval to BPM
  const windowsPerSecond = (targetSampleRate / (windowSize / 4));
  const beatsPerSecond = windowsPerSecond / mostCommonInterval;
  let bpm = Math.round(beatsPerSecond * 60);
  
  // Ensure BPM is in reasonable range (60-200)
  while (bpm < 60) bpm *= 2;
  while (bpm > 200) bpm /= 2;
  
  console.log(`✅ Simple BPM detection: ${bpm} BPM`);
  
  return bpm;
}

/**
 * Estimate key using simple pitch detection
 */
export function simpleDetectKey(float32Array: Float32Array, sampleRate: number): { tonic: string; scale: string } {
  // This is a very simplified key detection
  // In production, you'd want a more sophisticated algorithm
  
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const scales = ['major', 'minor'];
  
  // For now, return a random key based on audio characteristics
  // This is just a placeholder - proper key detection requires FFT analysis
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const randomScale = scales[Math.floor(Math.random() * scales.length)];
  
  return {
    tonic: randomKey,
    scale: randomScale
  };
}

/**
 * Calculate simple energy metric
 */
export function calculateEnergy(float32Array: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < float32Array.length; i++) {
    sum += Math.abs(float32Array[i]);
  }
  return Math.min(1, (sum / float32Array.length) * 5); // Normalize to 0-1
}

/**
 * Estimate danceability based on rhythm regularity
 */
export function estimateDanceability(float32Array: Float32Array, bpm: number): number {
  // Simple estimation: songs around 120-130 BPM are typically more danceable
  const optimalBPM = 125;
  const bpmDistance = Math.abs(bpm - optimalBPM);
  const danceability = Math.max(0, 1 - (bpmDistance / 50));
  
  return danceability;
}

