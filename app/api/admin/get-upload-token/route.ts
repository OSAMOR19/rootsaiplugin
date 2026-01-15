import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
    try {
        const { bucket, path } = await request.json()

        if (!bucket || !path) {
            return NextResponse.json(
                { success: false, error: 'Bucket and path are required' },
                { status: 400 }
            )
        }

        const { data, error } = await supabaseAdmin
            .storage
            .from(bucket)
            .createSignedUploadUrl(path)

        if (error) {
            console.error('Error creating signed upload URL:', error)
            throw error
        }

        return NextResponse.json({
            success: true,
            data
        })

    } catch (error: any) {
        console.error('Get upload token error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to get upload token' },
            { status: 500 }
        )
    }
}
