import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parseBuffer } from 'music-metadata'

export const config = {
    api: {
        bodyParser: false,
    },
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { packDetails, samples } = body

        if (!packDetails || !samples) {
            return NextResponse.json(
                { success: false, error: 'Missing pack details or samples metadata' },
                { status: 400 }
            )
        }

        // 1. Insert Pack into DB
        // packDetails.cover_image is already a URL from client upload
        const { data: packData, error: packError } = await supabaseAdmin
            .from('packs')
            .insert({
                title: packDetails.title,
                genre: packDetails.genre,
                description: packDetails.description,
                cover_image: packDetails.cover_image, // URL from client
                allow_cash: packDetails.allowCash || false,
                price: 20
            })
            .select() // return created object
            .single()

        if (packError) throw packError

        console.log("Pack created in DB:", packData.id)

        // 2. Insert Samples into DB
        // samples array already contains audio_url and stems with urls
        const processedSamples = samples.map((sample: any) => ({
            name: sample.name,
            filename: sample.filename,
            category: packDetails.title,
            bpm: sample.bpm,
            key: sample.key,
            time_signature: sample.time_signature,
            genres: sample.genres,
            instruments: sample.instruments,
            drum_type: sample.drum_type,
            keywords: sample.keywords,
            audio_url: sample.audio_url, // URL from client
            image_url: packDetails.cover_image,
            is_featured: sample.is_featured,
            duration: sample.duration,
            stems: sample.stems // Array of {name, url, size, filename} from client
        }))

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
