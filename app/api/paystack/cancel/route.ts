import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { paystackHeaders, PAYSTACK_BASE_URL } from '@/lib/paystack'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST() {
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
            .select('paystack_customer_code')
            .eq('id', user.id)
            .single()

        if (profile?.paystack_customer_code) {
            // Fetch subscriptions for this customer and disable them
            const listRes = await fetch(
                `${PAYSTACK_BASE_URL}/subscription?customer=${profile.paystack_customer_code}`,
                { headers: paystackHeaders() }
            )
            const listData = await listRes.json()
            const subscriptions: any[] = listData.data || []

            for (const sub of subscriptions) {
                if (sub.status === 'active') {
                    await fetch(`${PAYSTACK_BASE_URL}/subscription/disable`, {
                        method: 'POST',
                        headers: paystackHeaders(),
                        body: JSON.stringify({
                            code: sub.subscription_code,
                            token: sub.email_token,
                        }),
                    })
                }
            }
        }

        // Update Supabase: revoke Pro access
        await supabaseAdmin
            .from('profiles')
            .update({
                is_pro: false,
                plan: 'free',
                paystack_reference: null,
                paystack_customer_code: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error('[paystack/cancel]', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
