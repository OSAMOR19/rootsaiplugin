import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { uploadFile } from '@/lib/r2'
import { analyzeAudioBuffer } from '@/lib/audioAnalysis'

export const config = {
  api: {
    bodyParser: false,
  },
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const imageFile = formData.get('image') as File
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const bpmStr = formData.get('bpm') as string
    const timeSignature = formData.get('timeSignature') as string

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Generate a safe filename base with timestamp to prevent conflicts
    const timestamp = Date.now()
    const safeNameBase = name.replace(/[^a-z0-9]/gi, '_')
    const audioExt = audioFile.name.split('.').pop()
    
    // Determine the category folder
    const categoryFolder = category || 'Full Drums'
    const safeAudioFilename = `${categoryFolder}/${timestamp}_${safeNameBase}.${audioExt}`

    // Upload audio to Cloudflare R2
    const audioBytes = await audioFile.arrayBuffer()
    const audioBuffer = Buffer.from(audioBytes)
    
    console.log(`Uploading audio to R2: ${safeAudioFilename}`)
    const audioUploadResult = await uploadFile(
      audioBuffer,
      safeAudioFilename,
      audioFile.type || 'audio/wav'
    )

    // --- Image Processing ---
    let imageUrl = '/placeholder.jpg' // Default
    if (imageFile) {
      const imageExt = imageFile.name.split('.').pop()
      const safeImageFilename = `artwork/${timestamp}_${safeNameBase}_art.${imageExt}`

      // Upload image to Cloudflare R2
      const imageBytes = await imageFile.arrayBuffer()
      const imageBuffer = Buffer.from(imageBytes)
      
      console.log(`Uploading image to R2: ${safeImageFilename}`)
      const imageUploadResult = await uploadFile(
        imageBuffer,
        safeImageFilename,
        imageFile.type || 'image/jpeg'
      )

      imageUrl = imageUploadResult.url
    }

    // Analyze audio with Essentia.js
    console.log('🎵 Analyzing audio with Essentia.js...')
    const analysis = await analyzeAudioBuffer(audioBuffer, audioFile.name)
    
    // Use analyzed BPM if not manually provided
    let detectedBPM = bpmStr ? parseInt(bpmStr) : (analysis.bpm || 120)
    let selectedTimeSignature = timeSignature || '4/4'
    
    console.log(`✅ Analysis: BPM=${detectedBPM}, Key=${analysis.key}, Mood=${analysis.moodTag}`)

    // Update metadata.json
    const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')
    let metadata: any[] = []

    if (existsSync(metadataPath)) {
      const metadataContent = await readFile(metadataPath, 'utf-8')
      metadata = JSON.parse(metadataContent)
    }

    // Add new entry with AI analysis
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      filename: safeAudioFilename.split('/').pop(), // Just the filename part
      bpm: detectedBPM,
      key: analysis.key || 'C',
      timeSignature: selectedTimeSignature,
      category: categoryFolder,
      audioUrl: audioUploadResult.url, // R2 URL!
      imageUrl: imageUrl, // R2 URL or placeholder
      duration: "0:00", // Placeholder, would need analysis to get real duration
      uploadedAt: new Date().toISOString(),
      storage: 'r2', // Mark as R2 storage
      // AI Analysis features
      energy: analysis.energy,
      danceability: analysis.danceability,
      valence: analysis.valence,
      moodTag: analysis.moodTag,
      // Metadata tags (can be edited later via bulk edit)
      genres: [],
      instruments: [],
      keywords: [],
    }

    metadata.push(newEntry)

    // Save updated metadata
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    console.log(`✅ Successfully uploaded to R2: ${name}`)

    return NextResponse.json({
      success: true,
      message: 'Beat uploaded successfully to Cloudflare R2',
      ...newEntry
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
