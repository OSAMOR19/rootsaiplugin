import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function PATCH(request: NextRequest) {
  try {
    const { sampleIds, edits } = await request.json()

    if (!sampleIds || !Array.isArray(sampleIds) || sampleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'sampleIds array is required' },
        { status: 400 }
      )
    }

    if (!edits || typeof edits !== 'object') {
      return NextResponse.json(
        { success: false, error: 'edits object is required' },
        { status: 400 }
      )
    }

    // Read metadata
    const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')
    
    if (!existsSync(metadataPath)) {
      return NextResponse.json(
        { success: false, error: 'Metadata file not found' },
        { status: 404 }
      )
    }

    const metadataContent = await readFile(metadataPath, 'utf-8')
    const metadata = JSON.parse(metadataContent)

    // Update selected samples
    let updatedCount = 0
    metadata.forEach((item: any) => {
      if (sampleIds.includes(item.id)) {
        // Apply edits
        if (edits.genres) item.genres = edits.genres
        if (edits.instruments) item.instruments = edits.instruments
        if (edits.keywords) item.keywords = edits.keywords
        if (edits.tempo) item.bpm = edits.tempo
        if (edits.key) item.key = edits.key
        
        item.updatedAt = new Date().toISOString()
        updatedCount++
      }
    })

    // Save updated metadata
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    console.log(`✅ Bulk edit applied to ${updatedCount} samples`)

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${updatedCount} sample${updatedCount !== 1 ? 's' : ''}`,
      updatedCount
    })

  } catch (error: any) {
    console.error('Bulk edit error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Bulk edit failed' },
      { status: 500 }
    )
  }
}

