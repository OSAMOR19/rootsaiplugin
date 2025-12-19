import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { uploadFile } from '@/lib/r2'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const samplesMetadataStr = formData.get('samplesMetadata') as string
        const packDetailsStr = formData.get('packDetails') as string
        const originalCategory = formData.get('originalCategory') as string // The original category name (pack name)
        const coverImage = formData.get('coverImage') as File // New cover image file
        const audioFiles = formData.getAll('files') as File[]

        if (!samplesMetadataStr) {
            return NextResponse.json({ error: 'Missing samples metadata' }, { status: 400 })
        }

        const updatedSamples = JSON.parse(samplesMetadataStr)
        const packDetails = packDetailsStr ? JSON.parse(packDetailsStr) : {}

        // Determine the new category name (pack title)
        // It could come from packDetails.title, or default to originalCategory
        // If originalCategory is also missing (e.g., brand new pack), it might be in the first sample's category
        const newCategoryName = packDetails.title || originalCategory || updatedSamples[0]?.category || 'Uncategorized'

        console.log(`Updating pack: "${originalCategory}" -> "${newCategoryName}"`)

        // 1. Handle Cover Image Upload
        let coverImageUrl: string | null = null
        if (coverImage && coverImage.size > 0) {
            try {
                const timestamp = Date.now()
                const safeNameBase = newCategoryName.replace(/[^a-z0-9]/gi, '_')
                const imageExt = coverImage.name.split('.').pop()
                const safeImageFilename = `packs/${safeNameBase}/${timestamp}_cover.${imageExt}`

                console.log(`Uploading new cover image to R2: ${safeImageFilename}`)
                const imageUploadResult = await uploadFile(
                    Buffer.from(await coverImage.arrayBuffer()),
                    safeImageFilename,
                    coverImage.type || 'image/jpeg'
                )
                coverImageUrl = imageUploadResult.url
            } catch (uploadError) {
                console.error(`Failed to upload cover image ${coverImage.name}:`, uploadError)
            }
        }

        // 2. Update Packs Metadata (packs.json)
        const packsPath = path.join(process.cwd(), 'public', 'audio', 'packs.json')
        try {
            const packsContent = await fs.readFile(packsPath, 'utf8')
            const packs = JSON.parse(packsContent)

            // Find the pack by its original name (category)
            const packIndex = packs.findIndex((p: any) => p.name === originalCategory || p.title === originalCategory)

            if (packIndex !== -1) {
                // Merge updates from packDetails
                packs[packIndex] = {
                    ...packs[packIndex],
                    ...packDetails, // This includes description, genre, etc.
                    name: newCategoryName, // Ensure the internal name matches the new title
                    title: newCategoryName, // Update the display title
                    ...(coverImageUrl ? { coverImage: coverImageUrl } : {}) // Update cover image if a new one was uploaded
                }

                await fs.writeFile(packsPath, JSON.stringify(packs, null, 2))
                console.log('Updated packs.json successfully.')
            } else {
                console.warn(`Pack with original category "${originalCategory}" not found in packs.json.Skipping pack metadata update.`)
            }
        } catch (e: any) {
            if (e.code === 'ENOENT') {
                console.warn('packs.json not found. Skipping pack metadata update.')
            } else {
                console.error('Error updating packs.json:', e)
            }
        }

        // 3. Update Samples Metadata (metadata.json)
        const metadataPath = path.join(process.cwd(), 'public', 'audio', 'metadata.json')

        // Read existing metadata
        let existingData: any[] = []
        try {
            const fileContent = await fs.readFile(metadataPath, 'utf8')
            existingData = JSON.parse(fileContent)
        } catch (error) {
            console.error('Error reading metadata:', error)
            return NextResponse.json({ error: 'Failed to read metadata file' }, { status: 500 })
        }

        const resultingData = existingData.map((item: any) => {
            // Determine if this sample belongs to the pack being updated
            const belongsToPack = item.category === originalCategory

            // Find if there's a specific update input for this item from the frontend
            const specificUpdate = updatedSamples.find((s: any) => s.fileName === item.filename)

            let newItem = { ...item }

            // Apply global pack updates (Category Rename & Cover Art)
            if (belongsToPack) {
                newItem.category = newCategoryName // Update category to the new pack title
                if (coverImageUrl) {
                    newItem.imageUrl = coverImageUrl // Update image URL if a new cover was uploaded
                }
                // Update pack-level metadata fields if provided in packDetails
                if (packDetails.genre) {
                    newItem.genres = [packDetails.genre] // Assuming packDetails.genre is a single string
                }
                // Add other pack-level fields if they should propagate to samples
                // e.g., if (packDetails.description) newItem.description = packDetails.description;
            }

            // Apply specific item updates (these override global pack changes if conflicting)
            if (specificUpdate) {
                const newBpm = specificUpdate.tempo ? parseInt(specificUpdate.tempo) : item.bpm

                newItem = {
                    ...newItem,
                    name: specificUpdate.name,
                    bpm: isNaN(newBpm) ? item.bpm : newBpm,
                    key: specificUpdate.key,
                    timeSignature: specificUpdate.timeSignature,
                    genres: specificUpdate.genres || newItem.genres, // Specific update takes precedence, else keep current (potentially updated by pack)
                    instruments: specificUpdate.instruments,
                    drumType: specificUpdate.drumType,
                    keywords: specificUpdate.keywords,
                    featured: specificUpdate.featured,
                    // If specificUpdate has a category, use it. Otherwise, use the category derived from pack logic.
                    category: specificUpdate.category || newItem.category,
                    // If specificUpdate has an imageUrl, use it. Otherwise, use the imageUrl derived from pack logic.
                    imageUrl: specificUpdate.imageUrl || newItem.imageUrl,
                }
            }

            return newItem
        })

        // 4. Identify and Add NEW samples
        const existingFilenames = new Set(existingData.map(d => d.filename))
        const newSamplesMeta = updatedSamples.filter((s: any) => !existingFilenames.has(s.fileName))

        for (const sampleMeta of newSamplesMeta) {
            const audioFile = audioFiles.find(f => f.name === sampleMeta.fileName)

            if (audioFile) {
                try {
                    const timestamp = Date.now()
                    const safeNameBase = sampleMeta.name.replace(/[^a-z0-9]/gi, '_')
                    const audioExt = audioFile.name.split('.').pop()
                    const categoryFolder = newCategoryName.replace(/[^a-z0-9]/gi, '_') // Use the new pack name for folder
                    const safeAudioFilename = `packs / ${categoryFolder}/${timestamp}_${safeNameBase}.${audioExt}`

                    console.log(`Uploading new sample to R2: ${safeAudioFilename}`)
                    const uploadResult = await uploadFile(
                        Buffer.from(await audioFile.arrayBuffer()),
                        safeAudioFilename,
                        audioFile.type || 'audio/wav'
                    )

                    // Determine the image URL for the new sample: new cover -> existing pack cover (if any) -> placeholder
                    // For new samples, we use the new cover image URL if available, otherwise a placeholder.
                    const finalImageUrl = coverImageUrl || '/placeholder.jpg'

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
                        category: newCategoryName, // New samples belong to the new pack category
                        url: uploadResult.url, // R2 URL
                        audioUrl: uploadResult.url,
                        imageUrl: finalImageUrl, // Use the new pack cover or placeholder
                        duration: '0:00', // needs analysis
                        timeSignature: sampleMeta.timeSignature || "4/4",
                        storage: 'r2',
                        uploadedAt: new Date().toISOString(),
                        featured: sampleMeta.featured || false
                    })

                } catch (uploadError) {
                    console.error(`Failed to upload new file ${audioFile.name}:`, uploadError)
                }
            }
        }

        // Write back the updated metadata.json
        await fs.writeFile(metadataPath, JSON.stringify(resultingData, null, 2))
        console.log('Updated metadata.json successfully.')

        return NextResponse.json({ success: true, count: updatedSamples.length })

    } catch (error) {
        console.error('Update pack error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
