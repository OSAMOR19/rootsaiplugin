import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parseBuffer } from 'music-metadata'

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const samplesMetadataStr = formData.get('samplesMetadata') as string
        const packDetailsStr = formData.get('packDetails') as string
        const originalCategory = formData.get('originalCategory') as string // The original pack title
        const coverImage = formData.get('coverImage') as File
        const audioFiles = formData.getAll('files') as File[]

        if (!samplesMetadataStr) {
            return NextResponse.json({ error: 'Missing samples metadata' }, { status: 400 })
        }

        const updatedSamples = JSON.parse(samplesMetadataStr)
        const packDetails = packDetailsStr ? JSON.parse(packDetailsStr) : {}

        const newCategoryName = packDetails.title || originalCategory || updatedSamples[0]?.category || 'Uncategorized'

        console.log(`Updating pack: "${originalCategory}" -> "${newCategoryName}"`)

        // 1. Handle Cover Image Upload
        let coverImageUrl: string | null = null
        if (coverImage && coverImage.size > 0) {
            try {
                const timestamp = Date.now()
                const safeNameBase = newCategoryName.replace(/[^a-z0-9]/gi, '_')
                const imageExt = coverImage.name.split('.').pop()
                const imagePath = `packs/${timestamp}_${safeNameBase}_cover.${imageExt}`

                console.log(`Uploading new cover image to Supabase: ${imagePath}`)
                const { error: uploadError } = await supabaseAdmin
                    .storage
                    .from('audio')
                    .upload(imagePath, coverImage, {
                        contentType: coverImage.type || 'image/jpeg',
                        upsert: true
                    })

                if (uploadError) throw uploadError

                const { data: publicUrlData } = supabaseAdmin
                    .storage
                    .from('audio')
                    .getPublicUrl(imagePath)

                coverImageUrl = publicUrlData.publicUrl

            } catch (uploadError) {
                console.error(`Failed to upload cover image ${coverImage.name}:`, uploadError)
            }
        }

        // 2. Update Packs Metadata (DB)
        const packUpdatePayload: any = {
            title: newCategoryName,
            genre: packDetails.genre,
            description: packDetails.description,
            allow_cash: packDetails.allowCash
        }
        if (coverImageUrl) {
            packUpdatePayload.cover_image = coverImageUrl
        }
        // Assuming title matches originalCategory for lookup
        const { error: packUpdateError } = await supabaseAdmin
            .from('packs')
            .update(packUpdatePayload)
            .eq('title', originalCategory) // Match by old title

        if (packUpdateError) console.error("Error updating pack:", packUpdateError)


        // 3. Update Existing Samples Metadata (DB)
        const { data: existingSamples, error: fetchError } = await supabaseAdmin
            .from('samples')
            .select('*')
            .eq('category', originalCategory) // Fetch all samples in this pack

        if (fetchError) throw fetchError

        // Prepare bulk update operations?
        // Supabase doesn't have a simple bulk upsert for different values (except upsert which inserts if missing)
        // We will loop and update for now, or use upsert if we have IDs.

        // Strategy: First update ALL samples in this category to have the new Category Name (if changed)
        // and new Cover Image (if changed)
        if (newCategoryName !== originalCategory || coverImageUrl) {
            const bulkUpdate: any = {}
            if (newCategoryName !== originalCategory) bulkUpdate.category = newCategoryName
            if (coverImageUrl) bulkUpdate.image_url = coverImageUrl

            await supabaseAdmin.from('samples').update(bulkUpdate).eq('category', originalCategory)
        }

        // Now update specific fields for each modified sample
        if (existingSamples) {
            const updatedSampleIds = new Set(updatedSamples.map((s: any) => s.id).filter((id: any) => id));
            const samplesToDelete = existingSamples
                .filter((s: any) => !updatedSampleIds.has(s.id))
                .map((s: any) => s.id);

            if (samplesToDelete.length > 0) {
                console.log(`Deleting ${samplesToDelete.length} removed samples...`);
                await supabaseAdmin
                    .from('samples')
                    .delete()
                    .in('id', samplesToDelete);
            }

            for (const sampleData of updatedSamples) {
                // Determine if this is an existing sample update
                const existing = existingSamples.find((s: any) => s.filename === sampleData.fileName)

                if (existing) {
                    const updatePayload = {
                        name: sampleData.name,
                        bpm: sampleData.tempo ? parseInt(sampleData.tempo) : 0,
                        key: sampleData.key,
                        time_signature: sampleData.timeSignature,
                        genres: sampleData.genres,
                        instruments: sampleData.instruments,
                        drum_type: sampleData.drumType,
                        keywords: sampleData.keywords,
                        is_featured: sampleData.featured
                        // category and imageUrl are already bulk updated above if needed
                    }

                    await supabaseAdmin
                        .from('samples')
                        .update(updatePayload)
                        .eq('id', existing.id)
                }
            }
        }

        // 4. Identify and Add NEW samples
        const existingFilenames = new Set(existingSamples?.map((d: any) => d.filename) || [])
        const newSamplesMeta = updatedSamples.filter((s: any) => !existingFilenames.has(s.fileName))

        const newSamplesToInsert = []

        for (const sampleMeta of newSamplesMeta) {
            const audioFile = audioFiles.find(f => f.name === sampleMeta.fileName)

            if (audioFile) {
                try {
                    const timestamp = Date.now()
                    const safeNameBase = sampleMeta.name.replace(/[^a-z0-9]/gi, '_')
                    const audioExt = audioFile.name.split('.').pop()
                    const audioPath = `samples/${newCategoryName.replace(/[^a-z0-9]/gi, '_')}/${timestamp}_${safeNameBase}.${audioExt}`

                    console.log(`Uploading new sample to Supabase: ${audioPath}`)

                    // Calculate duration
                    const arrayBuffer = await audioFile.arrayBuffer()
                    const buffer = Buffer.from(arrayBuffer)
                    let duration = '0:00'
                    try {
                        const metadata = await parseBuffer(buffer)
                        if (metadata.format.duration) {
                            const minutes = Math.floor(metadata.format.duration / 60)
                            const seconds = Math.floor(metadata.format.duration % 60)
                            duration = `${minutes}:${seconds.toString().padStart(2, '0')}`
                        }
                    } catch (e) {
                        console.error("Failed to parse audio duration", e)
                    }

                    const { error: uploadError } = await supabaseAdmin
                        .storage
                        .from('audio')
                        .upload(audioPath, audioFile, {
                            contentType: audioFile.type || 'audio/wav',
                            upsert: true
                        })

                    if (uploadError) throw uploadError

                    const { data: publicUrlData } = supabaseAdmin
                        .storage
                        .from('audio')
                        .getPublicUrl(audioPath)

                    const finalImageUrl = coverImageUrl || existingSamples?.[0]?.image_url || '/placeholder.jpg'

                    newSamplesToInsert.push({
                        filename: sampleMeta.fileName,
                        name: sampleMeta.name,
                        bpm: sampleMeta.tempo ? parseInt(sampleMeta.tempo) : 120,
                        key: sampleMeta.key,
                        genres: sampleMeta.genres || [],
                        instruments: sampleMeta.instruments || [],
                        drum_type: sampleMeta.drumType || "",
                        keywords: sampleMeta.keywords || [],
                        category: newCategoryName,
                        audio_url: publicUrlData.publicUrl,
                        image_url: finalImageUrl,
                        duration: duration,
                        time_signature: sampleMeta.timeSignature || "4/4",
                        is_featured: sampleMeta.featured || false
                    })

                } catch (uploadError) {
                    console.error(`Failed to upload new file ${audioFile.name}:`, uploadError)
                }
            }
        }

        if (newSamplesToInsert.length > 0) {
            await supabaseAdmin.from('samples').insert(newSamplesToInsert)
        }

        return NextResponse.json({ success: true, count: updatedSamples.length })

    } catch (error) {
        console.error('Update pack error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
