import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import stripe from '@/lib/stripe'

export async function POST() {
    if (!stripe) {
        return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
    }

    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll: () => cookieStore.getAll(),
                    setAll: () => {},
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        if (!profile?.stripe_customer_id) {
            return NextResponse.json({ error: 'No Stripe subscription found' }, { status: 404 })
        }

        const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const session = await stripe.billingPortal.sessions.create({
            customer: profile.stripe_customer_id,
            return_url: `${origin}/settings`,
        })

        return NextResponse.json({ url: session.url })
    } catch (err: any) {
        console.error('[stripe/portal]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
