/**
 * BPM Detection Utility using Essentia.js (Server-Side)
 * 
 * This utility provides a clean interface for BPM detection using our
 * Essentia.js-powered backend API route.
 */

export interface BPMDetectionResponse {
  bpm: number;
  confidence?: number;
  alternatives?: Array<{ bpm: number; confidence: number }>;
  beats?: number[];
  key?: { tonic: string | null; scale: string | null; strength: number | null };
  danceability?: number | null;
  energy?: number | null;
  valence?: number | null;
}

export interface BPMDetectionError {
  error: string;
  message?: string;
}

/**
 * Detect BPM from an audio file using Essentia.js backend
 * @param file - Audio file (File object or Blob)
 * @returns Promise with detected BPM and additional features
 */
export async function detectBPMFromFile(file: File | Blob): Promise<number> {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('🎵 Starting BPM detection with Essentia.js');
    console.log('📁 Audio file:', {
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type || 'audio/wav',
      format: file instanceof File ? 'File' : 'Blob'
    });

    // Create FormData with audio file
    const formData = new FormData();
    
    // If it's a Blob without a name, give it a default name
    if (file instanceof Blob && !(file instanceof File)) {
      formData.append('file', file, 'audio.wav');
    } else {
      formData.append('file', file);
    }

    console.log('📤 Sending audio to /api/analyze...');
    
    // Send request to our Essentia.js API route
    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    console.log('✅ API responded with status:', response.status);

    // Check if request was successful
    if (!response.ok) {
      const errorData: BPMDetectionError = await response.json().catch(() => ({
        error: `Request failed with status ${response.status}`
      }));
      throw new Error(errorData.error || errorData.message || `BPM detection failed with status ${response.status}`);
    }

    // Parse response
    const data = await response.json();

    // Validate response structure
    if (!data.success || !data.analysis) {
      throw new Error('Invalid response format from API');
    }

    const analysis = data.analysis;

    // Validate BPM value
    if (typeof analysis.bpm !== 'number' || isNaN(analysis.bpm) || analysis.bpm === null) {
      throw new Error('Invalid BPM value received from API');
    }

    console.log('🎉 BPM Detection Successful!');
    console.log('🎯 Detected BPM:', analysis.bpm);
    console.log('🎹 Key:', analysis.key?.tonic, analysis.key?.scale);
    console.log('⚡ Energy:', analysis.energy);
    console.log('💃 Danceability:', analysis.danceability);

    return Math.round(analysis.bpm);

  } catch (error) {
    console.error('❌ BPM detection error:', error);
    
    // Provide helpful error message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Could not connect to BPM detection API. Please check your internet connection.');
    }
    
    throw error;
  }
}

/**
 * Detect BPM and get full analysis from an audio file
 * @param file - Audio file (File object or Blob)
 * @returns Promise with complete analysis including BPM, key, mood, etc.
 */
export async function analyzeAudioFile(file: File | Blob): Promise<BPMDetectionResponse> {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    console.log('🔬 Starting full audio analysis with Essentia.js');

    const formData = new FormData();
    
    if (file instanceof Blob && !(file instanceof File)) {
      formData.append('file', file, 'audio.wav');
    } else {
      formData.append('file', file);
    }

    const response = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData: BPMDetectionError = await response.json().catch(() => ({
        error: `Request failed with status ${response.status}`
      }));
      throw new Error(errorData.error || errorData.message || 'Audio analysis failed');
    }

    const data = await response.json();

    if (!data.success || !data.analysis) {
      throw new Error('Invalid response format from API');
    }

    const analysis = data.analysis;

    return {
      bpm: analysis.bpm || 0,
      confidence: analysis.confidence,
      alternatives: analysis.alternatives,
      beats: analysis.beats,
      key: analysis.key,
      danceability: analysis.danceability,
      energy: analysis.energy,
      valence: analysis.valence,
    };

  } catch (error) {
    console.error('❌ Audio analysis error:', error);
    throw error;
  }
}

/**
 * Detect BPM from an AudioBuffer by converting it to WAV blob first
 * @param audioBuffer - Web Audio API AudioBuffer
 * @returns Promise with detected BPM
 */
export async function detectBPMFromAudioBuffer(audioBuffer: AudioBuffer): Promise<number> {
  try {
    // Convert AudioBuffer to WAV blob
    const wavBlob = audioBufferToWavBlob(audioBuffer);
    
    // Use the file-based detection
    return await detectBPMFromFile(wavBlob);
  } catch (error) {
    console.error('Error detecting BPM from AudioBuffer:', error);
    throw error;
  }
}

/**
 * Convert AudioBuffer to WAV Blob for API upload
 * ✅ OPTIMIZED: Limits to 60 seconds, mono, 22050 Hz to reduce file size
 */
function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  console.log('🔧 Optimizing audio for API upload:', {
    originalDuration: audioBuffer.duration.toFixed(2) + 's',
    originalSampleRate: audioBuffer.sampleRate + 'Hz',
    originalChannels: audioBuffer.numberOfChannels
  });

  // ✅ OPTIMIZATION 1: Limit to 60 seconds
  const maxDuration = 60;
  const originalSampleRate = audioBuffer.sampleRate;
  const maxSamples = Math.min(audioBuffer.length, Math.floor(maxDuration * originalSampleRate));
  
  // ✅ OPTIMIZATION 2: Resample to 22050 Hz
  const targetSampleRate = 22050;
  const resampleRatio = targetSampleRate / originalSampleRate;
  const resampledLength = Math.floor(maxSamples * resampleRatio);
  
  // ✅ OPTIMIZATION 3: Convert to mono
  const monoData = new Float32Array(maxSamples);
  const numberOfChannels = audioBuffer.numberOfChannels;
  
  for (let i = 0; i < maxSamples; i++) {
    let sum = 0;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      sum += channelData[i];
    }
    monoData[i] = sum / numberOfChannels;
  }
  
  // Simple resampling (linear interpolation)
  const resampledData = new Float32Array(resampledLength);
  for (let i = 0; i < resampledLength; i++) {
    const srcIndex = i / resampleRatio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, maxSamples - 1);
    const fraction = srcIndex - srcIndexFloor;
    
    resampledData[i] = monoData[srcIndexFloor] * (1 - fraction) + monoData[srcIndexCeil] * fraction;
  }
  
  console.log('✅ Audio optimized:', {
    newDuration: (resampledLength / targetSampleRate).toFixed(2) + 's',
    newSampleRate: targetSampleRate + 'Hz',
    newChannels: 1,
    compressionRatio: ((audioBuffer.length * numberOfChannels) / resampledLength).toFixed(2) + 'x smaller'
  });
  
  // Create WAV file header (44 bytes) for MONO, 22050 Hz
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  // WAV file header structure
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + resampledLength * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetSampleRate, true);
  view.setUint32(28, targetSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, resampledLength * 2, true);
  
  // Convert audio data to 16-bit PCM
  const audioData = new ArrayBuffer(resampledLength * 2);
  const audioView = new Int16Array(audioData);
  
  for (let i = 0; i < resampledLength; i++) {
    const sample = Math.max(-1, Math.min(1, resampledData[i]));
    audioView[i] = sample * 32767;
  }
  
  const blob = new Blob([header, audioData], { type: 'audio/wav' });
  
  console.log('📦 Final WAV blob size:', (blob.size / 1024 / 1024).toFixed(2) + ' MB');
  
  return blob;
}
