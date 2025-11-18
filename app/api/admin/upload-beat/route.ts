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
    const name = formData.get('name') as string
    const category = formData.get('category') as string
    const bpmStr = formData.get('bpm') as string
    const key = formData.get('key') as string

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Generate a safe filename
    const ext = audioFile.name.split('.').pop()
    const safeFilename = `${name.replace(/[^a-z0-9]/gi, '_')}.${ext}`

    // Determine the category folder
    const categoryFolder = category || 'Full Drums'
    const audioDir = path.join(process.cwd(), 'public', 'audio', categoryFolder)

    // Create directory if it doesn't exist
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true })
    }

    // Save the audio file
    const filePath = path.join(audioDir, safeFilename)
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Auto-detect BPM and key if not provided (you can integrate Essentia.js here)
    let detectedBPM = bpmStr ? parseInt(bpmStr) : undefined
    let detectedKey = key || undefined

    // TODO: If BPM or key not provided, analyze the audio file
    // For now, we'll use defaults or user input
    if (!detectedBPM) {
      detectedBPM = 120 // Default, or analyze with Essentia.js
    }
    if (!detectedKey) {
      detectedKey = 'C' // Default, or analyze with Essentia.js
    }

    // Update metadata.json
    const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')
    let metadata: any[] = []

    if (existsSync(metadataPath)) {
      const metadataContent = await readFile(metadataPath, 'utf-8')
      metadata = JSON.parse(metadataContent)
    }

    // Add new entry
    const newEntry = {
      filename: safeFilename,
      bpm: detectedBPM,
      key: detectedKey,
      category: categoryFolder,
      url: `/audio/${categoryFolder}/${safeFilename}`
    }

    metadata.push(newEntry)

    // Save updated metadata
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    // Also update mockData.ts (optional - for development)
    // You would need to regenerate the mockData array or make it read from metadata.json

    return NextResponse.json({
      success: true,
      message: 'Beat uploaded successfully',
      filename: safeFilename,
      bpm: detectedBPM,
      key: detectedKey,
      category: categoryFolder,
      url: `/audio/${categoryFolder}/${safeFilename}`
    })

  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
