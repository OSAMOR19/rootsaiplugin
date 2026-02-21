import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { id } = body // pack category ID (pack title)

        if (!id) {
            // If id refers to pack ID not title, we need to handle that. 
            // In current logic, id passed from PacksPage is the category name.
            return NextResponse.json({ error: 'Missing pack ID' }, { status: 400 })
        }

        const categoryName = decodeURIComponent(id)

        console.log(`Deleting pack: ${categoryName}`)

        // 1. Delete Samples
        // Supabase foreign key constraints might cascade, but let's be explicit
        const { error: samplesError } = await supabaseAdmin
            .from('samples')
            .delete()
            .eq('category', categoryName)

        if (samplesError) {
            console.error("Error deleting samples:", samplesError)
            return NextResponse.json({ error: 'Failed to delete samples' }, { status: 500 })
        }

        // 2. Delete Pack Metadata
        const { error: packError } = await supabaseAdmin
            .from('packs')
            .delete()
            .eq('title', categoryName) // Assuming title matching

        if (packError) {
            console.error("Error deleting pack:", packError)
            // Try deleting by ID if categoryName doesn't work (in case logic changes)
        }

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Delete pack error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
