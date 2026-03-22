import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
    try {
        // 1. Fetch total counts from analytics_events
        const { count: totalPlaysCount } = await supabaseAdmin
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'play')

        const { count: totalDownloadsCount } = await supabaseAdmin
            .from('analytics_events')
            .select('*', { count: 'exact', head: true })
            .eq('event_type', 'download')

        // 2. Fetch last 30 days of data for the chart
        // Instead of complex SQL grouping which PostgREST limits slightly, we can grab recent events 
        // and bucket them in memory.
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { data: recentEvents, error: eventsError } = await supabaseAdmin
            .from('analytics_events')
            .select('event_type, created_at')
            .gte('created_at', thirtyDaysAgo.toISOString())

        if (eventsError) throw eventsError

        // Group by day ('MMM DD')
        const chartMap = new Map<string, { name: string, plays: number, downloads: number }>()

        // Pre-fill the last 30 days to ensure continuous graph
        for (let i = 30; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
            chartMap.set(dateStr, { name: dateStr, plays: 0, downloads: 0 })
        }

        (recentEvents || []).forEach(evt => {
            const date = new Date(evt.created_at)
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
            const bucket = chartMap.get(dateStr)
            if (bucket) {
                if (evt.event_type === 'play') bucket.plays++
                if (evt.event_type === 'download') bucket.downloads++
            }
        })

        const chartData = Array.from(chartMap.values())

        // 3. Overall Conversion Rate (Downloads / Plays)
        const plays = totalPlaysCount || 1 // prevent div by zero
        const downloads = totalDownloadsCount || 0
        const conversionRate = ((downloads / plays) * 100).toFixed(2) + '%'

        // 4. Top Performing Packs (group by pack_id)
        // Since we can't easily do advanced GROUP BY with raw supabase JS without RPC, we'll fetch all pack events and count.
        // For performance at scale, an RPC is better. But this works for a startup.
        const { data: packEvents, error: packEventsError } = await supabaseAdmin
            .from('analytics_events')
            .select('pack_id, event_type')
            .not('pack_id', 'is', null)

        if (packEventsError) throw packEventsError

        const packStats = new Map<string, { plays: number, downloads: number }>()
        ;(packEvents || []).forEach(evt => {
            if (!evt.pack_id) return
            const stats = packStats.get(evt.pack_id) || { plays: 0, downloads: 0 }
            if (evt.event_type === 'play') stats.plays++
            if (evt.event_type === 'download') stats.downloads++
            packStats.set(evt.pack_id, stats)
        })

        // Sort by total engagement (plays + downloads)
        const sortedPackIds = Array.from(packStats.entries())
            .sort((a, b) => ((b[1].plays + b[1].downloads) - (a[1].plays + a[1].downloads)))
            .slice(0, 5)
            .map(entry => entry[0])

        let topPacks: any[] = []
        if (sortedPackIds.length > 0) {
            // Fetch names for these pack IDs
            const { data: packsMetadata } = await supabaseAdmin
                .from('packs')
                .select('id, name')
                .in('id', sortedPackIds)

            topPacks = sortedPackIds.map(packId => {
                const stats = packStats.get(packId)!
                const meta = packsMetadata?.find(p => p.id === packId)
                const conv = stats.plays > 0 ? ((stats.downloads / stats.plays) * 100).toFixed(2) : "0.00"
                return {
                    id: packId,
                    name: meta?.name || 'Unknown Pack',
                    plays: stats.plays,
                    downloads: stats.downloads,
                    conv: `${conv}%`,
                }
            })
        }

        return NextResponse.json({
            success: true,
            totalPlays: totalPlaysCount || 0,
            totalDownloads: totalDownloadsCount || 0,
            conversionRate,
            chartData,
            topPacks
        })
    } catch (e: any) {
        console.error('Metrics Error:', e)
        return NextResponse.json({ success: false, error: e.message }, { status: 500 })
    }
}
