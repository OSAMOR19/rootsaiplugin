import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

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

    // Generate a safe filename base
    const safeNameBase = name.replace(/[^a-z0-9]/gi, '_')

    // --- Audio Processing ---
    const audioExt = audioFile.name.split('.').pop()
    const safeAudioFilename = `${safeNameBase}.${audioExt}`

    // Determine the category folder
    const categoryFolder = category || 'Full Drums'
    const audioDir = path.join(process.cwd(), 'public', 'audio', categoryFolder)

    // Create audio directory if it doesn't exist
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true })
    }

    // Save the audio file
    const audioFilePath = path.join(audioDir, safeAudioFilename)
    const audioBytes = await audioFile.arrayBuffer()
    await writeFile(audioFilePath, Buffer.from(audioBytes))

    // --- Image Processing ---
    let imageUrl = '/placeholder.jpg' // Default
    if (imageFile) {
      const imageExt = imageFile.name.split('.').pop()
      const safeImageFilename = `${safeNameBase}_art.${imageExt}`
      const imageDir = path.join(process.cwd(), 'public', 'images', 'uploads')

      // Create image directory if it doesn't exist
      if (!existsSync(imageDir)) {
        await mkdir(imageDir, { recursive: true })
      }

      // Save the image file
      const imageFilePath = path.join(imageDir, safeImageFilename)
      const imageBytes = await imageFile.arrayBuffer()
      await writeFile(imageFilePath, Buffer.from(imageBytes))

      imageUrl = `/images/uploads/${safeImageFilename}`
    }

    // Auto-detect BPM if not provided
    let detectedBPM = bpmStr ? parseInt(bpmStr) : 120
    let selectedTimeSignature = timeSignature || '4/4'

    // Update metadata.json
    const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')
    let metadata: any[] = []

    if (existsSync(metadataPath)) {
      const metadataContent = await readFile(metadataPath, 'utf-8')
      metadata = JSON.parse(metadataContent)
    }

    // Add new entry
    const newEntry = {
      id: Math.random().toString(36).substr(2, 9),
      name: name,
      filename: safeAudioFilename,
      bpm: detectedBPM,
      timeSignature: selectedTimeSignature,
      category: categoryFolder,
      audioUrl: `/audio/${categoryFolder}/${safeAudioFilename}`,
      imageUrl: imageUrl,
      duration: "0:00" // Placeholder, would need analysis to get real duration
    }

    metadata.push(newEntry)

    // Save updated metadata
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    return NextResponse.json({
      success: true,
      message: 'Beat uploaded successfully',
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
