/**
 * Simple test script to verify the /api/analyze endpoint
 * 
 * Usage:
 *   1. Start your Next.js dev server: npm run dev
 *   2. Run this script: node tests/check-analysis.js [path-to-audio-file]
 * 
 * If no file path is provided, it will test with a small generated WAV file.
 */

const fs = require('fs');
const path = require('path');

// Create a minimal WAV file for testing (1 second of 440Hz sine wave)
function createTestWAV() {
  const sampleRate = 22050;
  const duration = 1; // seconds
  const numSamples = sampleRate * duration;
  const frequency = 440; // A4 note
  
  // Generate sine wave
  const samples = new Int16Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const value = Math.sin(2 * Math.PI * frequency * t);
    samples[i] = Math.floor(value * 32767);
  }
  
  // Create WAV header
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + samples.length * 2, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(samples.length * 2, 40);
  
  return Buffer.concat([header, Buffer.from(samples.buffer)]);
}

async function testAnalyzeEndpoint(audioFilePath) {
  try {
    console.log('🧪 Testing /api/analyze endpoint...\n');
    
    let audioBuffer;
    let filename;
    
    if (audioFilePath && fs.existsSync(audioFilePath)) {
      console.log(`📁 Using audio file: ${audioFilePath}`);
      audioBuffer = fs.readFileSync(audioFilePath);
      filename = path.basename(audioFilePath);
    } else {
      console.log('📁 No file provided, generating test WAV file...');
      audioBuffer = createTestWAV();
      filename = 'test-sine-440hz.wav';
    }
    
    console.log(`📊 File size: ${(audioBuffer.length / 1024).toFixed(2)} KB\n`);
    
    // Create FormData equivalent for Node.js
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: filename,
      contentType: 'audio/wav'
    });
    
    console.log('📤 Sending POST request to http://localhost:3000/api/analyze...\n');
    
    // Use node-fetch or native fetch (Node 18+)
    const fetch = globalThis.fetch || require('node-fetch');
    
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders ? formData.getHeaders() : {}
    });
    
    console.log(`✅ Response status: ${response.status} ${response.statusText}\n`);
    
    const json = await response.json();
    
    if (json.success) {
      console.log('🎉 SUCCESS! Analysis results:\n');
      console.log('📄 File:', json.filename);
      console.log('⏱️  Duration:', json.duration, 'seconds');
      console.log('');
      console.log('🎵 Analysis:');
      console.log('  BPM:', json.analysis.bpm || 'Not detected');
      console.log('  Confidence:', json.analysis.confidence || 'N/A');
      console.log('  Alternatives:', json.analysis.alternatives?.map(a => `${a.bpm} (${(a.confidence * 100).toFixed(0)}%)`).join(', ') || 'None');
      console.log('  Beats:', json.analysis.beats?.length || 0, 'beat markers');
      console.log('');
      console.log('🎹 Key:', json.analysis.key?.tonic || 'Unknown', json.analysis.key?.scale || '');
      console.log('  Strength:', json.analysis.key?.strength ? (json.analysis.key.strength * 100).toFixed(1) + '%' : 'N/A');
      console.log('');
      console.log('💃 Features:');
      console.log('  Danceability:', json.analysis.danceability !== null ? (json.analysis.danceability * 100).toFixed(1) + '%' : 'N/A');
      console.log('  Energy:', json.analysis.energy !== null ? (json.analysis.energy * 100).toFixed(1) + '%' : 'N/A');
      console.log('  Valence:', json.analysis.valence !== null ? (json.analysis.valence * 100).toFixed(1) + '%' : 'N/A');
      console.log('');
      console.log('😊 Moods:');
      if (json.analysis.moods) {
        Object.entries(json.analysis.moods).forEach(([mood, value]) => {
          console.log(`  ${mood}: ${(value * 100).toFixed(1)}%`);
        });
      }
      console.log('');
      console.log('🎼 MFCCs:', json.analysis.mfcc ? 'Available' : 'Not computed');
      if (json.analysis.mfcc) {
        console.log('  Mean:', json.analysis.mfcc.mean.slice(0, 3).map(v => v.toFixed(2)).join(', '), '...');
        console.log('  Std:', json.analysis.mfcc.std.slice(0, 3).map(v => v.toFixed(2)).join(', '), '...');
      }
      console.log('');
      console.log('✅ Test passed!');
    } else {
      console.error('❌ Analysis failed:');
      console.error(JSON.stringify(json, null, 2));
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('');
    console.error('Make sure:');
    console.error('  1. Your Next.js dev server is running (npm run dev)');
    console.error('  2. The server is accessible at http://localhost:3000');
    console.error('  3. Essentia.js dependencies are installed (npm install)');
    console.error('');
    process.exit(1);
  }
}

// Get audio file path from command line args
const audioFilePath = process.argv[2];

testAnalyzeEndpoint(audioFilePath);

