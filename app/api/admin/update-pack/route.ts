import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const samplesMetadataStr = formData.get('samplesMetadata') as string

        if (!samplesMetadataStr) {
            return NextResponse.json({ error: 'Missing samples metadata' }, { status: 400 })
        }

        const updatedSamples = JSON.parse(samplesMetadataStr)

        // Path to metadata.json
        const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')

        // Read existing 
        let existingData: any[] = []
        try {
            const fileContent = await fs.readFile(metadataPath, 'utf8')
            existingData = JSON.parse(fileContent)
        } catch (error) {
            console.error('Error reading metadata:', error)
            return NextResponse.json({ error: 'Failed to read metadata file' }, { status: 500 })
        }

        // Update logic
        const newData = existingData.map((item: any) => {
            // Match by filename
            const update = updatedSamples.find((s: any) => s.fileName === item.filename)

            if (update) {
                // Determine bpm: update.tempo is string, item.bpm is number
                const newBpm = update.tempo ? parseInt(update.tempo) : item.bpm

                return {
                    ...item,
                    name: update.name,
                    bpm: isNaN(newBpm) ? item.bpm : newBpm,
                    key: update.key,
                    genres: update.genres,
                    instruments: update.instruments,
                    drumType: update.drumType,
                    category: update.category || item.category,
                    keywords: update.keywords,
                    featured: update.featured
                }
            }
            return item
        })

        // Write back
        await fs.writeFile(metadataPath, JSON.stringify(newData, null, 2))

        return NextResponse.json({ success: true, count: updatedSamples.length })

    } catch (error) {
        console.error('Update pack error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
