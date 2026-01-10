import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
    try {
        console.log('[API] Update pack request received')
        const body = await request.json()
        console.log('[API] Request body parsed:', {
            hasOriginalCategory: !!body.originalCategory,
            hasPackDetails: !!body.packDetails,
            samplesCount: body.samples?.length || 0
        })

        const { originalCategory, packDetails, samples } = body

        if (!packDetails || !samples) {
            console.error('[API] Missing required data:', { hasPackDetails: !!packDetails, hasSamples: !!samples })
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
        }

        const newCategoryName = packDetails.title || originalCategory || 'Uncategorized'
        console.log(`[API] Updating pack: "${originalCategory}" -> "${newCategoryName}"`)

        // 1. Update Pack Metadata
        const packUpdatePayload: any = {
            title: newCategoryName,
            genre: packDetails.genre,
            description: packDetails.description,
            allow_cash: packDetails.allowCash,
            cover_image: packDetails.cover_image
        }

        // Update based on original title
        const { error: packUpdateError } = await supabaseAdmin
            .from('packs')
            .update(packUpdatePayload)
            .eq('title', originalCategory)

        if (packUpdateError) {
            console.error("[API] Error updating pack:", packUpdateError)
        }

        // 2. Fetch Existing Samples (to handle deletions and diffs)
        const { data: existingSamples, error: fetchError } = await supabaseAdmin
            .from('samples')
            .select('*')
            .eq('category', originalCategory)

        if (fetchError) {
            console.error('[API] Error fetching existing samples:', fetchError)
            throw fetchError
        }

        console.log(`[API] Found ${existingSamples?.length || 0} existing samples`)

        // 3. Handle Deletions
        const payloadIds = new Set(samples.filter((s: any) => s.id && !s.id.toString().startsWith('new-')).map((s: any) => s.id))

        const samplesToDelete = existingSamples
            ? existingSamples.filter((s: any) => !payloadIds.has(s.id)).map((s: any) => s.id)
            : []

        if (samplesToDelete.length > 0) {
            console.log(`[API] Deleting ${samplesToDelete.length} removed samples...`)
            const { error: deleteError } = await supabaseAdmin
                .from('samples')
                .delete()
                .in('id', samplesToDelete)

            if (deleteError) {
                console.error('[API] Error deleting samples:', deleteError)
            }
        }

        // 4. Update Existing & Insert New Samples
        const samplesToUpsert = samples.map((sample: any) => {
            const isNew = sample.id && sample.id.toString().startsWith('new-')

            return {
                id: isNew ? undefined : sample.id,
                name: sample.name,
                category: newCategoryName,
                bpm: sample.bpm || 0,
                key: sample.key || '',
                time_signature: sample.time_signature || '4/4',
                genres: sample.genres || [],
                instruments: sample.instruments || [],
                drum_type: sample.drum_type || '',
                keywords: sample.keywords || [],
                is_featured: sample.is_featured || false,
                audio_url: sample.audio_url,
                image_url: packDetails.cover_image || sample.image_url,
                duration: sample.duration || '0:00',
                stems: sample.stems || [],
                filename: sample.fileName || sample.name
            }
        })

        console.log(`[API] Upserting ${samplesToUpsert.length} samples`)

        if (samplesToUpsert.length > 0) {
            const { error: upsertError } = await supabaseAdmin
                .from('samples')
                .upsert(samplesToUpsert)

            if (upsertError) {
                console.error("[API] Error upserting samples:", upsertError)
                throw upsertError
            }
        }

        console.log('[API] Update successful')
        return NextResponse.json({ success: true, count: samplesToUpsert.length })

    } catch (error) {
        console.error('[API] Update pack error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json({
            error: 'Internal server error',
            details: errorMessage
        }, { status: 500 })
    }
}
