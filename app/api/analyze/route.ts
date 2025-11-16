/**
 * Audio Analysis API Route using Essentia.js
 * 
 * POST /api/analyze
 * 
 * Accepts audio file uploads (MP3, WAV, M4A, OGG, FLAC)
 * Returns comprehensive analysis including BPM, key, mood, and more
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { analyzeTrack } from '@/lib/essentia/analyzeTrack';

// Get ffmpeg path - ffmpeg-static exports the path as a string
// In Next.js, we need to handle this carefully
function getFFmpegPath(): string {
  try {
    // ffmpeg-static exports the path directly as a string
    const ffmpegStatic = require('ffmpeg-static');
    
    // It might be a string or an object with a default property
    if (typeof ffmpegStatic === 'string') {
      return ffmpegStatic;
    }
    if (ffmpegStatic && typeof ffmpegStatic.default === 'string') {
      return ffmpegStatic.default;
    }
    
    // If we can't get the path, use system ffmpeg
    console.warn('⚠️ ffmpeg-static returned unexpected format, using system ffmpeg');
    return 'ffmpeg';
  } catch (error) {
    console.warn('⚠️ ffmpeg-static not found, using system ffmpeg');
    return 'ffmpeg';
  }
}

// Maximum file size: 30MB
const MAX_FILE_SIZE = 30 * 1024 * 1024;

// Supported audio formats
const SUPPORTED_FORMATS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.wma'];

/**
 * Decode audio file to Float32Array using ffmpeg
 * Outputs 44.1kHz mono PCM
 */
async function decodeAudioFile(inputPath: string): Promise<{ audioData: Float32Array; sampleRate: number }> {
  return new Promise((resolve, reject) => {
    const ffmpegPath = getFFmpegPath();
    
    console.log(`🎧 Decoding audio with ffmpeg: ${inputPath}`);
    console.log(`🔧 Using ffmpeg at: ${ffmpegPath}`);

    // ffmpeg command to decode to raw PCM: 44.1kHz, mono, f32le (32-bit float little-endian)
    const args = [
      '-i', inputPath,
      '-f', 'f32le',          // 32-bit float PCM output
      '-acodec', 'pcm_f32le', // PCM codec
      '-ar', '44100',         // 44.1kHz sample rate
      '-ac', '1',             // Mono
      'pipe:1'                // Output to stdout
    ];

    const ffmpeg = spawn(ffmpegPath, args);

    const chunks: Buffer[] = [];
    let stderrOutput = '';

    ffmpeg.stdout.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    ffmpeg.stderr.on('data', (data: Buffer) => {
      stderrOutput += data.toString();
    });

    ffmpeg.on('error', (error) => {
      console.error('❌ ffmpeg spawn error:', error);
      reject(new Error(`ffmpeg spawn failed: ${error.message}`));
    });

    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        console.error('❌ ffmpeg stderr:', stderrOutput);
        return reject(new Error(`ffmpeg exited with code ${code}`));
      }

      try {
        // Combine all chunks into single buffer
        const buffer = Buffer.concat(chunks);
        
        // Convert buffer to Float32Array
        // f32le is 4 bytes per sample
        const float32Array = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);

        console.log(`✅ Audio decoded: ${float32Array.length} samples at 44100Hz (${(float32Array.length / 44100).toFixed(2)}s)`);

        resolve({
          audioData: float32Array,
          sampleRate: 44100
        });
      } catch (error) {
        reject(new Error(`Failed to convert audio data: ${error}`));
      }
    });
  });
}

/**
 * Save uploaded file to temporary location
 */
async function saveUploadedFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create temp file
  const tempDir = os.tmpdir();
  const ext = path.extname(file.name) || '.tmp';
  const tempFile = path.join(tempDir, `audio-upload-${Date.now()}${ext}`);

  await fs.writeFile(tempFile, buffer);
  
  console.log(`💾 Saved upload to: ${tempFile} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

  return tempFile;
}

/**
 * Clean up temporary file
 */
async function cleanupTempFile(filePath: string) {
  try {
    await fs.unlink(filePath);
    console.log(`🗑️  Cleaned up temp file: ${filePath}`);
  } catch (error) {
    console.warn(`⚠️ Failed to clean up temp file: ${filePath}`, error);
  }
}

/**
 * POST /api/analyze
 * Handle audio file upload and analysis
 */
export async function POST(request: NextRequest) {
  let tempFilePath: string | null = null;

  try {
    console.log('📥 Received audio analysis request');

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('audio') || formData.get('audio_file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No audio file provided', message: 'Please upload an audio file' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: 'File too large',
          message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          size: file.size
        },
        { status: 413 }
      );
    }

    // Validate file format
    const ext = path.extname(file.name).toLowerCase();
    if (!SUPPORTED_FORMATS.includes(ext) && ext !== '.tmp') {
      return NextResponse.json(
        {
          error: 'Unsupported format',
          message: `Supported formats: ${SUPPORTED_FORMATS.join(', ')}`,
          format: ext
        },
        { status: 415 }
      );
    }

    console.log(`📁 Processing file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Save file to temp location
    tempFilePath = await saveUploadedFile(file);

    // Decode audio to PCM
    const { audioData, sampleRate } = await decodeAudioFile(tempFilePath);

    // Analyze audio with Essentia
    console.log('🔬 Starting Essentia analysis...');
    const analysis = await analyzeTrack(audioData, sampleRate);

    // Clean up temp file
    await cleanupTempFile(tempFilePath);
    tempFilePath = null;

    console.log('✅ Analysis complete, returning results');

    // Return analysis results
    return NextResponse.json({
      success: true,
      filename: file.name,
      size: file.size,
      duration: (audioData.length / sampleRate).toFixed(2),
      analysis
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);

    // Clean up temp file on error
    if (tempFilePath) {
      await cleanupTempFile(tempFilePath);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analyze
 * Return API information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/analyze',
    method: 'POST',
    description: 'Audio analysis using Essentia.js - extracts BPM, key, mood, and more',
    usage: {
      contentType: 'multipart/form-data',
      field: 'file (or audio, audio_file)',
      maxSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
      supportedFormats: SUPPORTED_FORMATS
    },
    response: {
      success: 'boolean',
      filename: 'string',
      size: 'number',
      duration: 'string',
      analysis: {
        bpm: 'number | null',
        alternatives: 'Array<{ bpm: number, confidence: number }>',
        beats: 'number[] (timestamps in seconds)',
        confidence: 'number | null',
        key: '{ tonic: string, scale: string, strength: number }',
        danceability: 'number (0-1)',
        energy: 'number (0-1)',
        valence: 'number (0-1)',
        moods: '{ happy, sad, energetic, relaxed, aggressive, engagement }',
        mfcc: '{ mean: number[], std: number[] }'
      }
    }
  });
}

