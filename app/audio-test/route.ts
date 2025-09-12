import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    // Test loading metadata
    const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')
    const metadataContent = fs.readFileSync(metadataPath, 'utf-8')
    const loops = JSON.parse(metadataContent)
    
    return NextResponse.json({
      success: true,
      totalLoops: loops.length,
      sampleLoops: loops.slice(0, 3)
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load metadata', details: error },
      { status: 500 }
    )
  }
}
