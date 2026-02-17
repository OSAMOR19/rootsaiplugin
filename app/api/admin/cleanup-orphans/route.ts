import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * API to clean up orphan packs (packs with no associated samples).
 * These can appear when sample insertion fails after pack creation.
 * 
 * GET  - List orphan packs (preview what would be deleted)
 * POST - Delete orphan packs
 */

export async function GET() {
    try {
        // Find packs that have no samples associated with them
        const { data: allPacks, error: packsError } = await supabaseAdmin
            .from('packs')
            .select('id, title, cover_image, created_at')

        if (packsError) throw packsError

        const orphanPacks = []

        for (const pack of allPacks || []) {
            const { count } = await supabaseAdmin
                .from('samples')
                .select('id', { count: 'exact', head: true })
                .eq('category', pack.title)

            if (count === 0) {
                orphanPacks.push(pack)
            }
        }

        return NextResponse.json({
            success: true,
            orphanPacks,
            count: orphanPacks.length,
            message: orphanPacks.length > 0
                ? `Found ${orphanPacks.length} orphan pack(s) with no samples`
                : 'No orphan packs found'
        })

    } catch (error: any) {
        console.error('Cleanup check error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to check for orphan packs' },
            { status: 500 }
        )
    }
}

export async function POST() {
    try {
        // Find and delete packs that have no samples
        const { data: allPacks, error: packsError } = await supabaseAdmin
            .from('packs')
            .select('id, title')

        if (packsError) throw packsError

        const deletedPacks = []

        for (const pack of allPacks || []) {
            const { count } = await supabaseAdmin
                .from('samples')
                .select('id', { count: 'exact', head: true })
                .eq('category', pack.title)

            if (count === 0) {
                // Delete orphan pack
                const { error: deleteError } = await supabaseAdmin
                    .from('packs')
                    .delete()
                    .eq('id', pack.id)

                if (!deleteError) {
                    deletedPacks.push(pack)
                    console.log(`[Cleanup] Deleted orphan pack: "${pack.title}" (${pack.id})`)
                } else {
                    console.error(`[Cleanup] Failed to delete pack "${pack.title}":`, deleteError)
                }
            }
        }

        return NextResponse.json({
            success: true,
            deleted: deletedPacks,
            count: deletedPacks.length,
            message: deletedPacks.length > 0
                ? `Successfully deleted ${deletedPacks.length} orphan pack(s)`
                : 'No orphan packs found to clean up'
        })

    } catch (error: any) {
        console.error('Cleanup error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Cleanup failed' },
            { status: 500 }
        )
    }
}
