import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const FREE_DOWNLOAD_LIMIT = 5

export async function GET() {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value },
                    set(name, value, options) { cookieStore.set({ name, value, ...options }) },
                    remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
                },
            }
        )

        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user) {
            return NextResponse.json({
                downloadCount: 0,
                limit: FREE_DOWNLOAD_LIMIT,
                canDownload: false,
                isPro: false,
                error: 'Not authenticated',
            })
        }

        const userId = session.user.id

        // Check if user is Pro
        const supabaseAdmin = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                cookies: {
                    get() { return undefined },
                    set() { },
                    remove() { },
                },
            }
        )

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('is_pro')
            .eq('id', userId)
            .single()

        const isPro = profile?.is_pro ?? false

        if (isPro) {
            return NextResponse.json({
                downloadCount: 0,
                limit: FREE_DOWNLOAD_LIMIT,
                canDownload: true,
                isPro: true,
            })
        }

        // Count downloads from analytics_events for this user (LAST 30 DAYS ONLY)
        // ROOTS LITE: Free users get 5 downloads that renew every month
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count, error } = await supabaseAdmin
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('event_type', 'download')
            .gte('created_at', thirtyDaysAgo.toISOString())

        if (error) {
            console.error('Error counting downloads:', error)
            // Fail-open: allow download if we can't count (don't punish user for DB errors)
            return NextResponse.json({
                downloadCount: 0,
                limit: FREE_DOWNLOAD_LIMIT,
                canDownload: true,
                isPro: false,
            })
        }

        const downloadCount = count || 0

        return NextResponse.json({
            downloadCount,
            limit: FREE_DOWNLOAD_LIMIT,
            canDownload: downloadCount < FREE_DOWNLOAD_LIMIT,
            isPro: false,
        })

    } catch (e) {
        console.error('Download check error:', e)
        return NextResponse.json({
            downloadCount: 0,
            limit: FREE_DOWNLOAD_LIMIT,
            canDownload: true,
            isPro: false,
        }, { status: 500 })
    }
}
