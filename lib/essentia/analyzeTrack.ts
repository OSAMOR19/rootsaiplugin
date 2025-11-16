/**
 * Track Analysis Module using Essentia.js
 * 
 * Provides comprehensive audio feature extraction including:
 * - BPM detection (TempoCNN or RhythmExtractor2013)
 * - Beat timestamps
 * - Key and scale detection
 * - Danceability, energy, valence
 * - Mood metrics
 * - MFCC coefficients
 */

import { initEssentia, getEssentiaInstance } from './initEssentia';

export type AnalysisResult = {
  bpm: number | null;
  alternatives: Array<{ bpm: number; confidence: number }>;
  beats: number[];
  confidence: number | null;
  key: { tonic: string | null; scale: string | null; strength: number | null };
  danceability: number | null;
  energy: number | null;
  valence: number | null;
  moods: { [k: string]: number };
  mfcc: { mean: number[]; std: number[] } | null;
};

/**
 * Safely normalize a value to 0-1 range
 */
function safeNorm(x: number | undefined | null): number | null {
  if (x === null || x === undefined || Number.isNaN(x)) return null;
  return Math.max(0, Math.min(1, x));
}

/**
 * Calculate mean of an array
 */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

/**
 * Calculate standard deviation of an array
 */
function std(arr: number[], meanVal: number): number {
  if (arr.length === 0) return 0;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - meanVal, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

/**
 * Analyze an audio track and extract comprehensive features
 * 
 * @param float32Array - Audio samples as Float32Array
 * @param sampleRate - Sample rate of the audio (should be 44100 Hz)
 * @returns Complete analysis results
 */
export async function analyzeTrack(
  float32Array: Float32Array,
  sampleRate: number
): Promise<AnalysisResult> {
  console.log(`📊 Starting track analysis (${float32Array.length} samples at ${sampleRate}Hz)`);
  
  await initEssentia();
  const essentia = getEssentiaInstance();

  // Convert Float32Array to Essentia's vector format
  const audioVector = essentia.arrayToVector(float32Array);

  // Initialize result object
  let bpm: number | null = null;
  let alternatives: Array<{ bpm: number; confidence: number }> = [];
  let beats: number[] = [];
  let confidence: number | null = null;
  let key = { tonic: null as string | null, scale: null as string | null, strength: null as number | null };
  let danceability: number | null = null;
  let energy: number | null = null;
  let valence: number | null = null;
  const moods: { [k: string]: number } = {};
  let mfccResult: { mean: number[]; std: number[] } | null = null;

  // ==================== BPM & BEAT DETECTION ====================
  console.log('🎵 Detecting tempo and beats...');
  try {
    // Use RhythmExtractor2013 algorithm from Essentia
    // This returns an object with bpm, beats, confidence, etc.
    const rhythm = essentia.RhythmExtractor2013(audioVector);
    
    console.log('🔍 Rhythm extraction result:', {
      type: typeof rhythm,
      keys: rhythm ? Object.keys(rhythm) : 'null',
      bpm: rhythm?.bpm
    });
    
    if (rhythm && rhythm.bpm) {
      bpm = Math.round(rhythm.bpm);
      confidence = safeNorm(rhythm.confidence || rhythm.bpmConfidence || 1.0);
      beats = rhythm.ticks || rhythm.beats || [];
      
      console.log(`✅ BPM detected: ${bpm} (confidence: ${confidence})`);
      
      // Generate alternatives (half tempo and double tempo)
      alternatives = [
        { bpm: bpm, confidence: confidence || 1.0 },
        { bpm: Math.round(bpm / 2), confidence: (confidence || 0.5) * 0.7 },
        { bpm: Math.round(bpm * 2), confidence: (confidence || 0.5) * 0.7 },
      ];
    } else {
      console.warn('⚠️ RhythmExtractor2013 did not return BPM');
    }
  } catch (error) {
    console.error('⚠️ Tempo extraction error (non-fatal):', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
  }

  // ==================== KEY DETECTION ====================
  console.log('🎹 Detecting key and scale...');
  try {
    if (typeof essentia.KeyExtractor === 'function') {
      const keyResult = essentia.KeyExtractor(audioVector);
      
      if (keyResult) {
        key.tonic = keyResult.key || keyResult.tonic || null;
        key.scale = keyResult.scale || keyResult.mode || null;
        key.strength = safeNorm(keyResult.strength || keyResult.confidence || null);
        
        console.log(`✅ Key detected: ${key.tonic} ${key.scale} (strength: ${key.strength})`);
      }
    } else if (typeof essentia.Key === 'function') {
      const keyResult = essentia.Key(audioVector);
      
      if (keyResult) {
        key.tonic = keyResult.key || null;
        key.scale = keyResult.scale || null;
        key.strength = safeNorm(keyResult.strength || null);
        
        console.log(`✅ Key detected: ${key.tonic} ${key.scale}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Key extraction error (non-fatal):', error);
  }

  // ==================== ENERGY & RMS ====================
  console.log('⚡ Computing energy metrics...');
  try {
    if (typeof essentia.Energy === 'function') {
      const energyResult = essentia.Energy(audioVector);
      energy = safeNorm(energyResult.energy || energyResult);
    } else {
      // Compute RMS as energy approximation
      const rms = Math.sqrt(audioVector.reduce((sum, val) => sum + val * val, 0) / audioVector.length);
      energy = safeNorm(rms * 2); // Normalize to 0-1 range
    }
    
    console.log(`✅ Energy: ${energy}`);
  } catch (error) {
    console.warn('⚠️ Energy computation error (non-fatal):', error);
  }

  // ==================== DANCEABILITY ====================
  console.log('💃 Computing danceability...');
  try {
    if (typeof essentia.Danceability === 'function') {
      const danceResult = essentia.Danceability(audioVector);
      danceability = safeNorm(danceResult.danceability || danceResult);
      console.log(`✅ Danceability: ${danceability}`);
    } else if (bpm !== null) {
      // Approximate danceability based on BPM (dance music is typically 120-130 BPM)
      const optimalBpm = 125;
      const bpmDistance = Math.abs(bpm - optimalBpm);
      danceability = safeNorm(Math.max(0, 1 - (bpmDistance / 50)));
      console.log(`✅ Danceability (estimated): ${danceability}`);
    }
  } catch (error) {
    console.warn('⚠️ Danceability computation error (non-fatal):', error);
  }

  // ==================== MFCC COEFFICIENTS ====================
  console.log('🎼 Computing MFCCs...');
  try {
    if (typeof essentia.MFCC === 'function') {
      const mfccData = essentia.MFCC(audioVector);
      
      if (mfccData && mfccData.mfcc) {
        // mfccData.mfcc is typically a 2D array [frames][coefficients]
        const numCoeffs = 13;
        const coefficients: number[][] = [];
        
        // Extract first 13 coefficients
        for (let i = 0; i < numCoeffs && i < mfccData.mfcc.length; i++) {
          coefficients.push(mfccData.mfcc[i]);
        }
        
        // Compute mean and std for each coefficient across frames
        const means: number[] = [];
        const stds: number[] = [];
        
        for (let i = 0; i < numCoeffs; i++) {
          const coef = coefficients[i] || [];
          const m = mean(coef);
          means.push(m);
          stds.push(std(coef, m));
        }
        
        mfccResult = { mean: means, std: stds };
        console.log(`✅ MFCCs computed: ${numCoeffs} coefficients`);
      }
    }
  } catch (error) {
    console.warn('⚠️ MFCC computation error (non-fatal):', error);
  }

  // ==================== MOOD & VALENCE ====================
  console.log('😊 Estimating mood metrics...');
  try {
    // Valence estimation (positive/negative emotional content)
    // This is a simplified estimation - proper valence needs trained models
    if (energy !== null && key.scale) {
      // Major keys tend to be more positive, minor more negative
      const scaleModifier = key.scale.toLowerCase().includes('major') ? 0.6 : 0.4;
      valence = safeNorm((energy * 0.5) + (scaleModifier * 0.5));
      
      // Estimate moods based on available features
      moods.happy = valence || 0.5;
      moods.sad = 1 - (valence || 0.5);
      moods.energetic = energy || 0.5;
      moods.relaxed = 1 - (energy || 0.5);
      moods.aggressive = energy && energy > 0.7 ? energy : 0.3;
      moods.engagement = danceability || 0.5;
      
      console.log(`✅ Valence: ${valence}, Moods estimated`);
    }
  } catch (error) {
    console.warn('⚠️ Mood estimation error (non-fatal):', error);
  }

  // ==================== BUILD FINAL RESULT ====================
  const result: AnalysisResult = {
    bpm: bpm,
    alternatives,
    beats,
    confidence,
    key,
    danceability,
    energy,
    valence,
    moods,
    mfcc: mfccResult,
  };

  console.log('✅ Analysis complete!');
  console.log(`   BPM: ${bpm}, Key: ${key.tonic} ${key.scale}, Energy: ${energy}`);
  
  return result;
}

