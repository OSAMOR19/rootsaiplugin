import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
    try {
        const payload = await request.json()
        const { event_type, item_type, item_id, pack_id } = payload

        if (!event_type || !item_type || !item_id) {
            return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
        }

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
        const user_id = session?.user?.id || null

        // Insert using service role here directly or anon key. The table has RLS, so anon key insert would fail without a policy.
        // It's safer to use the service_role key to log telemetry reliably.
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

        const { error } = await supabaseAdmin
            .from('analytics_events')
            .insert({
                event_type,
                item_type,
                item_id,
                pack_id: pack_id || null,
                user_id
            })

        if (error) {
            // Fails silently if table doesn't exist yet, we don't want to crash the UI over telemetry
            console.error('Telemetry Insert Error:', error)
            return NextResponse.json({ success: false }) 
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ success: false }, { status: 500 })
    }
}
