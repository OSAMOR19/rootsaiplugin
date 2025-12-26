import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
        const audioFiles = formData.getAll('files') as File[]

        if (!packDetailsStr || !samplesMetadataStr) {
            return NextResponse.json(
                { success: false, error: 'Missing pack details or samples metadata' },
                { status: 400 }
            )
        }

        const packDetails = JSON.parse(packDetailsStr)
        const samplesMetadata = JSON.parse(samplesMetadataStr)

        // 1. Upload Cover Image to Supabase Storage
        let coverImageUrl = '/placeholder.jpg'
        if (coverImage) {
            const timestamp = Date.now()
            const safeNameBase = packDetails.title.replace(/[^a-z0-9]/gi, '_')
            const imageExt = coverImage.name.split('.').pop()
            const imagePath = `packs/${timestamp}_${safeNameBase}_cover.${imageExt}`

            console.log(`Uploading cover to Supabase: ${imagePath}`)
            const { data: uploadData, error: uploadError } = await supabaseAdmin
                .storage
                .from('audio')
                .upload(imagePath, coverImage, {
                    contentType: coverImage.type || 'image/jpeg',
                    upsert: true
                })

            if (uploadError) throw uploadError

            // Get Public URL
            const { data: publicUrlData } = supabaseAdmin
                .storage
                .from('audio')
                .getPublicUrl(imagePath)

            coverImageUrl = publicUrlData.publicUrl
        }

        // 2. Insert Pack into DB
        const { data: packData, error: packError } = await supabaseAdmin
            .from('packs')
            .insert({
                title: packDetails.title,
                genre: packDetails.genre,
                description: packDetails.description,
                cover_image: coverImageUrl,
                allow_cash: packDetails.allowCash || false,
                price: 20
            })
            .select() // return created object
            .single()

        if (packError) throw packError

        console.log("Pack created in DB:", packData.id)

        // 3. Upload Audio Files & Insert Samples
        const processedSamples = []

        for (const sampleMeta of samplesMetadata) {
            const audioFile = audioFiles.find(f => f.name === sampleMeta.fileName)

            if (audioFile) {
                const timestamp = Date.now()
                const safeNameBase = sampleMeta.name.replace(/[^a-z0-9]/gi, '_')
                const audioExt = audioFile.name.split('.').pop()
                const audioPath = `samples/${packDetails.title.replace(/[^a-z0-9]/gi, '_')}/${timestamp}_${safeNameBase}.${audioExt}`

                console.log(`Uploading sample to Supabase: ${audioPath}`)

                const { error: audioUploadError } = await supabaseAdmin
                    .storage
                    .from('audio')
                    .upload(audioPath, audioFile, {
                        contentType: audioFile.type || 'audio/wav',
                        upsert: true
                    })

                if (audioUploadError) {
                    console.error("Audio upload failed", audioUploadError)
                    continue
                }

                const { data: publicUrlData } = supabaseAdmin
                    .storage
                    .from('audio')
                    .getPublicUrl(audioPath)

                const sampleRecord = {
                    name: sampleMeta.name,
                    filename: sampleMeta.fileName,
                    category: packDetails.title,
                    bpm: sampleMeta.tempo ? parseInt(sampleMeta.tempo) : 0,
                    key: sampleMeta.key || '',
                    time_signature: sampleMeta.timeSignature || '4/4',
                    genres: sampleMeta.genres || [],
                    instruments: sampleMeta.instruments || [],
                    drum_type: sampleMeta.drumType || '',
                    keywords: sampleMeta.keywords || [],
                    audio_url: publicUrlData.publicUrl,
                    image_url: coverImageUrl,
                    is_featured: sampleMeta.featured || false,
                    duration: '0:00' // Placeholder
                }

                processedSamples.push(sampleRecord)
            }
        }

        if (processedSamples.length > 0) {
            const { error: samplesError } = await supabaseAdmin
                .from('samples')
                .insert(processedSamples)

            if (samplesError) throw samplesError
        }

        return NextResponse.json({
            success: true,
            message: 'Pack created successfully in Supabase',
            pack: packData
        })

    } catch (error: any) {
        console.error('Pack creation error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Pack creation failed' },
            { status: 500 }
        )
    }
}
