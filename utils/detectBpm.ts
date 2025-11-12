/**
 * Backend BPM Detection Utility
 * Uses the Python backend on Render with librosa for accurate BPM detection
 */

// ✅ BACKEND URL - Your Python backend with librosa for ACCURATE BPM detection
const BACKEND_URL = 'https://rootsaibackend.onrender.com';
const USE_MOCK_BPM = false; // ✅ Using REAL backend BPM detection with librosa

export interface BPMDetectionResponse {
  bpm: number;
}

export interface BPMDetectionError {
  error: string;
  message?: string;
}

/**
 * Detect BPM from an audio file using the Python backend
 * @param file - Audio file (File object or Blob)
 * @returns Promise with detected BPM
 */
export async function detectBPMFromFile(file: File | Blob): Promise<number> {
  // TEMPORARY: Mock BPM while backend is broken (remove this later!)
  if (USE_MOCK_BPM) {
    console.warn('⚠️ Using MOCK BPM detection - backend is disabled');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
    return Math.floor(Math.random() * 40) + 100; // Random BPM 100-140
  }
  
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Create FormData for file upload
    const formData = new FormData();
    
    // If it's a Blob without a name, give it a default name
    if (file instanceof Blob && !(file instanceof File)) {
      formData.append('file', file, 'audio.wav');
    } else {
      formData.append('file', file);
    }

    console.log('🎵 ===== BACKEND BPM DETECTION STARTING =====');
    console.log('🔗 Backend:', BACKEND_URL);
    console.log('📍 Endpoint:', `${BACKEND_URL}/detect-bpm`);
    console.log('📁 Audio file:', {
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      type: file.type || 'audio/wav',
      format: file instanceof File ? 'File' : 'Blob'
    });
    console.log('⚡ This will use your backend with librosa for ACCURATE BPM detection');

    // Create abort controller for timeout (60 seconds for cold start + processing)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    console.log('📤 Sending audio to backend for analysis...');
    
    try {
      // Send request to backend
      const response = await fetch(`${BACKEND_URL}/detect-bpm`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
        // Don't set Content-Type header - browser will set it with boundary for FormData
      });

      console.log('✅ Backend responded!');

      clearTimeout(timeoutId);

      console.log('📊 Status:', response.status, response.statusText);

      // Check if request was successful
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || 
          errorData?.error || 
          `Backend request failed with status ${response.status}`
        );
      }

      // Parse response
      const data: BPMDetectionResponse = await response.json();

      // Validate response
      if (typeof data.bpm !== 'number' || isNaN(data.bpm)) {
        throw new Error('Invalid BPM value received from backend');
      }

      console.log('🎉 ===== BPM DETECTION SUCCESSFUL =====');
      console.log('🎯 Detected BPM:', data.bpm);
      console.log('✅ This is REAL, ACCURATE BPM from your librosa backend!');
      console.log('==========================================');

      return Math.round(data.bpm);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Handle specific error types
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          throw new Error('Backend request timed out. The server may be starting up (cold start). Please try again in a moment.');
        }
        throw fetchError;
      }
      throw new Error('Failed to connect to BPM detection backend');
    }
  } catch (error) {
    console.error('BPM detection error:', error);
    
    // Provide helpful error message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Could not connect to BPM detection backend. Please check your internet connection.');
    }
    
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
 * Convert AudioBuffer to WAV Blob for backend processing
 */
function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const length = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const numberOfChannels = audioBuffer.numberOfChannels;
  
  // Create WAV file header (44 bytes)
  const header = new ArrayBuffer(44);
  const view = new DataView(header);
  
  // Helper to write string to DataView
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  // WAV file header structure
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length * numberOfChannels * 2, true); // File size
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true); // ByteRate
  view.setUint16(32, numberOfChannels * 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, length * numberOfChannels * 2, true); // Data chunk size
  
  // Convert audio data to interleaved 16-bit PCM
  const audioData = new ArrayBuffer(length * numberOfChannels * 2);
  const audioView = new Int16Array(audioData);
  
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      // Clamp and convert to 16-bit integer
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      audioView[i * numberOfChannels + channel] = sample * 32767;
    }
  }
  
  // Combine header and audio data into a Blob
  return new Blob([header, audioData], { type: 'audio/wav' });
}

/**
 * Check if the backend is available
 * @returns Promise<boolean>
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
}

