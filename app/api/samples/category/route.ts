import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function PATCH(request: NextRequest) {
  try {
    const { sampleId, newCategory } = await request.json()

    if (!sampleId || !newCategory) {
      return NextResponse.json(
        { success: false, error: 'sampleId and newCategory are required' },
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

    // Find and update the sample
    const sampleIndex = metadata.findIndex((item: any) => item.id === sampleId)
    
    if (sampleIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Sample not found' },
        { status: 404 }
      )
    }

    // Update category
    metadata[sampleIndex].category = newCategory
    metadata[sampleIndex].updatedAt = new Date().toISOString()

    // Save updated metadata
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2))

    console.log(`✅ Updated category for ${metadata[sampleIndex].name} to ${newCategory}`)

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      sample: metadata[sampleIndex]
    })

  } catch (error: any) {
    console.error('Category update error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Update failed' },
      { status: 500 }
    )
  }
}

