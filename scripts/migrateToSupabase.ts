
import { supabaseAdmin } from '@/lib/supabase-admin'
import packsData from '@/public/audio/packs.json'
import samplesData from '@/public/audio/metadata.json'

export async function migrateData() {
    console.log('Starting migration...')

    // 1. Migrate Packs
    console.log(`Migrating ${packsData.length} packs...`)
    for (const pack of packsData) {
        const { error } = await supabaseAdmin
            .from('packs')
            .upsert({
                title: pack.title,
                genre: pack.genre || '',
                description: pack.description || '',
                cover_image: pack.coverImage,
                allow_cash: pack.allowCash || false,
                price: 20, // Default price
                created_at: pack.createdAt || new Date().toISOString()
            }, { onConflict: 'title' })

        if (error) console.error(`Error migrating pack ${pack.title}:`, error)
    }

    // 2. Migrate Samples
    console.log(`Migrating ${samplesData.length} samples...`)
    // Process in chunks to avoid timeouts
    const chunkSize = 50
    for (let i = 0; i < samplesData.length; i += chunkSize) {
        const chunk = samplesData.slice(i, i + chunkSize)

        const validSamples = chunk.map((sample: any) => ({
            name: sample.name,
            filename: sample.filename,
            category: sample.category || 'Uncategorized', // This links to pack title
            bpm: typeof sample.bpm === 'string' ? parseInt(sample.bpm) || 0 : sample.bpm || 0,
            key: sample.key || '',
            time_signature: sample.timeSignature || '4/4',
            genres: sample.genres || [],
            instruments: sample.instruments || [],
            drum_type: sample.drumType || '',
            keywords: sample.keywords || [],
            audio_url: sample.audioUrl || sample.url, // Handle legacy field
            image_url: sample.imageUrl,
            duration: sample.duration, // Keep as string for now
            is_featured: sample.featured || false,
            created_at: sample.uploadedAt || new Date().toISOString()
        }))

        const { error } = await supabaseAdmin
            .from('samples')
            .upsert(validSamples, { onConflict: 'filename' }) // Assuming filename is unique enough for upsert logic

        if (error) console.error(`Error migrating sample chunk ${i}:`, error)
    }

    console.log('Migration complete!')
}

// Run if called directly (CLI)
if (require.main === module) {
    migrateData()
}
