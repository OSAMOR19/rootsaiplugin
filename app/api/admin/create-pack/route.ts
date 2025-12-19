import { NextRequest, NextResponse } from 'next/server'
import { readFile, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { uploadFile } from '@/lib/r2'

export const config = {
    api: {
        bodyParser: false,
    },
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const coverImage = formData.get('coverImage') as File
        const packDetailsStr = formData.get('packDetails') as string
        const samplesMetadataStr = formData.get('samplesMetadata') as string

        // Get all audio files
        const audioFiles = formData.getAll('files') as File[]

        if (!packDetailsStr || !samplesMetadataStr) {
            return NextResponse.json(
                { success: false, error: 'Missing pack details or samples metadata' },
                { status: 400 }
            )
        }

        const packDetails = JSON.parse(packDetailsStr)
        const samplesMetadata = JSON.parse(samplesMetadataStr)

        // 1. Upload Cover Image
        let coverImageUrl = '/placeholder.jpg'
        if (coverImage) {
            const timestamp = Date.now()
            const safeNameBase = packDetails.title.replace(/[^a-z0-9]/gi, '_')
            const imageExt = coverImage.name.split('.').pop()
            const safeImageFilename = `packs/${timestamp}_${safeNameBase}_cover.${imageExt}`

            console.log(`Uploading pack cover to R2: ${safeImageFilename}`)
            const imageUploadResult = await uploadFile(
                Buffer.from(await coverImage.arrayBuffer()),
                safeImageFilename,
                coverImage.type || 'image/jpeg'
            )
            coverImageUrl = imageUploadResult.url
        }

        // 2. Process Samples & Upload Audio
        const processedSamples = []

        for (const sampleMeta of samplesMetadata) {
            // Find the corresponding file
            // We assume sampleMeta.name or some ID links to the file. 
            // In EditSamplesStep, we used `sample.file` but we can't pass File objects in JSON.
            // We'll match by filename.
            const audioFile = audioFiles.find(f => f.name === sampleMeta.fileName)

            if (audioFile) {
                const timestamp = Date.now()
                const safeNameBase = sampleMeta.name.replace(/[^a-z0-9]/gi, '_')
                const audioExt = audioFile.name.split('.').pop()
                const categoryFolder = packDetails.title.replace(/[^a-z0-9]/gi, '_') // Use pack title as folder
                const safeAudioFilename = `packs/${categoryFolder}/${timestamp}_${safeNameBase}.${audioExt}`

                console.log(`Uploading sample to R2: ${safeAudioFilename}`)
                const audioUploadResult = await uploadFile(
                    Buffer.from(await audioFile.arrayBuffer()),
                    safeAudioFilename,
                    audioFile.type || 'audio/wav'
                )

                processedSamples.push({
                    ...sampleMeta,
                    id: Math.random().toString(36).substr(2, 9),
                    audioUrl: audioUploadResult.url,
                    packId: packDetails.id, // Link to pack
                    uploadedAt: new Date().toISOString(),
                    storage: 'r2',
                    imageUrl: coverImageUrl, // Ensure sample has pack cover
                    category: packDetails.title // Force category to match pack title
                })
            } else {
                console.warn(`File not found for sample: ${sampleMeta.name}`)
            }
        }

        // 3. Update Metadata Files
        const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')
        const packsPath = path.join(process.cwd(), 'public', 'audio', 'packs.json')

        // Update Samples Metadata
        let metadata: any[] = []
        if (existsSync(metadataPath)) {
            const content = await readFile(metadataPath, 'utf-8')
            metadata = JSON.parse(content)
        }
        metadata.push(...processedSamples)
        await writeFile(metadataPath, JSON.stringify(metadata, null, 2))

        // Update Packs Metadata
        let packs: any[] = []
        if (existsSync(packsPath)) {
            const content = await readFile(packsPath, 'utf-8')
            packs = JSON.parse(content)
        }

        const newPack = {
            ...packDetails,
            id: Math.random().toString(36).substr(2, 9),
            coverImage: coverImageUrl,
            sampleCount: processedSamples.length,
            createdAt: new Date().toISOString(),
            samples: processedSamples.map(s => s.id), // Store IDs
            featuredSampleId: processedSamples.find(s => s.featured)?.id || processedSamples[0]?.id // Default to first if none featured
        }

        packs.push(newPack)
        await writeFile(packsPath, JSON.stringify(packs, null, 2))

        return NextResponse.json({
            success: true,
            message: 'Pack created successfully',
            pack: newPack,
            samplesCount: processedSamples.length
        })

    } catch (error: any) {
        console.error('Pack creation error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Pack creation failed' },
            { status: 500 }
        )
    }
}
