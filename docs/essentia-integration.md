# Essentia.js Audio Analysis Integration

## Overview

This project uses **Essentia.js** for professional server-side audio analysis. Essentia is a powerful audio analysis library compiled to WebAssembly, providing high-quality BPM detection, key detection, and mood analysis.

## Features

The analysis extracts comprehensive audio features including:

- **Tempo Analysis**: BPM detection with alternatives and confidence scores
- **Beat Detection**: Precise beat timestamps
- **Key Detection**: Musical key (tonic + scale) with strength
- **Mood Analysis**: Danceability, energy, valence, and emotional metrics
- **Advanced Features**: MFCC coefficients for machine learning applications

## API Endpoint

### `POST /api/analyze`

Upload an audio file for comprehensive analysis.

**Endpoint**: `https://yourdomain.com/api/analyze`

**Method**: `POST`

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (or `audio`, `audio_file`): Audio file to analyze

**Supported Formats**:
- MP3 (`.mp3`)
- WAV (`.wav`)
- M4A (`.m4a`)
- OGG (`.ogg`)
- FLAC (`.flac`)
- AAC (`.aac`)

**File Size Limit**: 30 MB

### Example Request

```bash
curl -X POST \
  -F "file=@/path/to/your/song.mp3" \
  https://yourdomain.com/api/analyze
```

### Example Response

```json
{
  "success": true,
  "filename": "song.mp3",
  "size": 5242880,
  "duration": "180.45",
  "analysis": {
    "bpm": 128,
    "confidence": 0.95,
    "alternatives": [
      { "bpm": 128, "confidence": 0.95 },
      { "bpm": 64, "confidence": 0.67 },
      { "bpm": 256, "confidence": 0.67 }
    ],
    "beats": [0.0, 0.468, 0.937, 1.406, ...],
    "key": {
      "tonic": "A",
      "scale": "minor",
      "strength": 0.83
    },
    "danceability": 0.78,
    "energy": 0.85,
    "valence": 0.62,
    "moods": {
      "happy": 0.62,
      "sad": 0.38,
      "energetic": 0.85,
      "relaxed": 0.15,
      "aggressive": 0.72,
      "engagement": 0.78
    },
    "mfcc": {
      "mean": [-145.2, 32.1, -8.4, ...],
      "std": [28.5, 12.3, 8.7, ...]
    }
  }
}
```

## Response Schema

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Whether the analysis succeeded |
| `filename` | string | Original filename |
| `size` | number | File size in bytes |
| `duration` | string | Audio duration in seconds |
| `analysis` | object | Analysis results (see below) |

### Analysis Object

| Field | Type | Description |
|-------|------|-------------|
| `bpm` | number \| null | Detected beats per minute |
| `confidence` | number \| null | BPM detection confidence (0-1) |
| `alternatives` | array | Alternative BPM values with confidence |
| `beats` | number[] | Beat timestamps in seconds |
| `key.tonic` | string \| null | Musical key (e.g., "A", "C#") |
| `key.scale` | string \| null | Scale type (e.g., "major", "minor") |
| `key.strength` | number \| null | Key detection confidence (0-1) |
| `danceability` | number \| null | How suitable for dancing (0-1) |
| `energy` | number \| null | Energy level (0-1) |
| `valence` | number \| null | Musical positiveness (0-1) |
| `moods` | object | Emotional characteristics |
| `mfcc` | object | Mel-frequency cepstral coefficients |

## Usage in Your App

### Using the Utility Function

```typescript
import { detectBPMFromFile, analyzeAudioFile } from '@/utils/detectBpm';

// Simple BPM detection
const bpm = await detectBPMFromFile(audioFile);
console.log('BPM:', bpm);

// Full analysis
const analysis = await analyzeAudioFile(audioFile);
console.log('Full analysis:', analysis);
```

### From AudioBuffer

```typescript
import { detectBPMFromAudioBuffer } from '@/utils/detectBpm';

const audioContext = new AudioContext();
const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
const bpm = await detectBPMFromAudioBuffer(audioBuffer);
```

## Architecture

```
Audio File
    ↓
Frontend (Browser)
    ↓
POST /api/analyze (FormData)
    ↓
Next.js API Route (Server-Side)
    ↓
ffmpeg (Decode to PCM)
    ↓
Essentia.js WASM (Analysis)
    ↓
JSON Response
    ↓
Frontend receives complete analysis
```

## Technical Details

### Audio Processing Pipeline

1. **Upload**: Audio file uploaded via multipart/form-data
2. **Validation**: File size and format checks
3. **Decoding**: ffmpeg converts to 44.1kHz mono PCM
4. **Analysis**: Essentia.js extracts features from PCM data
5. **Response**: JSON with comprehensive analysis

### Performance

- **Analysis Time**: Typically 2-5 seconds for a 3-minute song
- **Memory Usage**: ~50-100MB peak during analysis
- **Supported Environments**: Next.js (Node.js runtime)

### Dependencies

- `essentia.js` - Audio analysis library (WASM)
- `ffmpeg-static` - Audio decoding
- Native Node.js modules for file handling

## Installation

```bash
# Install dependencies
npm install essentia.js ffmpeg-static

# or with yarn
yarn add essentia.js ffmpeg-static
```

## Testing

Run the test script to verify the installation:

```bash
# Start dev server
npm run dev

# In another terminal, run the test
node tests/check-analysis.js path/to/test-audio.mp3
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK` - Analysis successful
- `400 Bad Request` - No file provided or invalid format
- `413 Payload Too Large` - File exceeds 30MB limit
- `415 Unsupported Media Type` - Unsupported audio format
- `500 Internal Server Error` - Analysis or processing error

## Deployment

### Vercel / Netlify

The Essentia.js integration works on serverless platforms:

1. Ensure `ffmpeg-static` is included in dependencies
2. Set appropriate timeout (recommended: 60s for API routes)
3. Increase memory limit if needed (512MB recommended)

### Docker / VPS

No special configuration needed. The WASM module works in any Node.js environment.

## Migration from Old System

If you're migrating from the old Python/librosa backend or SoundStat API:

1. Run the cleanup script:
   ```bash
   bash scripts/cleanup-old-bpm.sh
   ```

2. Install new dependencies:
   ```bash
   npm install
   ```

3. Update your code to use `/api/analyze` instead of the old endpoints

4. All existing `detectBPMFromFile()` calls will automatically use the new system!

## Support

For issues or questions:
- Check Essentia.js documentation: https://essentia.upf.edu/
- Essentia.js GitHub: https://github.com/MTG/essentia.js
- File an issue in your project repository

## License

Essentia.js is licensed under AGPLv3. Please review the license before commercial use.

