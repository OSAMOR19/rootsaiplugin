import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { uploadFile } from '@/lib/r2'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const samplesMetadataStr = formData.get('samplesMetadata') as string
        const categoryCallback = formData.get('category') as string // Current pack category name

        const audioFiles = formData.getAll('files') as File[]

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

        // 1. Process Updates (and track which ones were existing)
        const resultingData = existingData.map((item: any) => {
            // Find if there's an update for this item
            const update = updatedSamples.find((s: any) => s.fileName === item.filename)

            if (update) {
                // Determine bpm
                const newBpm = update.tempo ? parseInt(update.tempo) : item.bpm

                return {
                    ...item,
                    name: update.name,
                    bpm: isNaN(newBpm) ? item.bpm : newBpm,
                    key: update.key,
                    timeSignature: update.timeSignature,
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

        // 2. Identify NEW samples (those in updatedSamples that weren't found in existingData by filename)
        const existingFilenames = new Set(existingData.map(d => d.filename))
        const newSamplesMeta = updatedSamples.filter((s: any) => !existingFilenames.has(s.fileName))

        // 3. Upload and Add New Samples
        for (const sampleMeta of newSamplesMeta) {
            const audioFile = audioFiles.find(f => f.name === sampleMeta.fileName)

            if (audioFile) {
                try {
                    const timestamp = Date.now()
                    const safeNameBase = sampleMeta.name.replace(/[^a-z0-9]/gi, '_')
                    const audioExt = audioFile.name.split('.').pop()
                    const categoryFolder = (sampleMeta.category || 'Uncategorized').replace(/[^a-z0-9]/gi, '_')
                    const safeAudioFilename = `packs/${categoryFolder}/${timestamp}_${safeNameBase}.${audioExt}`

                    console.log(`Uploading new sample to R2: ${safeAudioFilename}`)
                    const uploadResult = await uploadFile(
                        Buffer.from(await audioFile.arrayBuffer()),
                        safeAudioFilename,
                        audioFile.type || 'audio/wav'
                    )

                    // Add new entry
                    resultingData.push({
                        id: Math.random().toString(36).substr(2, 9),
                        filename: sampleMeta.fileName,
                        name: sampleMeta.name,
                        bpm: sampleMeta.tempo ? parseInt(sampleMeta.tempo) : 120, // default
                        key: sampleMeta.key,
                        genres: sampleMeta.genres || [],
                        instruments: sampleMeta.instruments || [],
                        drumType: sampleMeta.drumType || "",
                        keywords: sampleMeta.keywords || [],
                        category: sampleMeta.category || 'Uncategorized',
                        url: uploadResult.url, // R2 URL
                        audioUrl: uploadResult.url,
                        imageUrl: '/placeholder.jpg', // Should fetch pack cover if possible, but placeholder for now
                        duration: '0:00', // needs analysis
                        timeSignature: sampleMeta.timeSignature || "4/4",
                        storage: 'r2',
                        uploadedAt: new Date().toISOString(),
                        featured: sampleMeta.featured || false
                    })

                } catch (uploadError) {
                    console.error(`Failed to upload file ${audioFile.name}:`, uploadError)
                }
            }
        }

        // Write back
        await fs.writeFile(metadataPath, JSON.stringify(resultingData, null, 2))

        return NextResponse.json({ success: true, count: updatedSamples.length })

    } catch (error) {
        console.error('Update pack error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
