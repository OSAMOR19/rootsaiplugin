import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { paystackConfigured, paystackHeaders, PAYSTACK_BASE_URL } from '@/lib/paystack'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const reference = searchParams.get('reference')

  if (!reference) {
    return NextResponse.redirect(`${origin}/browse?cancelled=true`)
  }

  if (!paystackConfigured) {
    return NextResponse.redirect(`${origin}/browse?error=paystack_not_configured`)
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      headers: paystackHeaders(),
    })
    const data = await res.json()

    if (!data.status || data.data.status !== 'success') {
      console.error('[paystack/verify] Transaction not successful:', data)
      return NextResponse.redirect(`${origin}/browse?error=payment_failed`)
    }

    const userId: string | undefined = data.data.metadata?.supabase_user_id
    const billingInterval: 'month' | 'year' = data.data.metadata?.billing_interval === 'year' ? 'year' : 'month'

    if (userId) {
      // Calculate subscription end date
      const endDate = new Date()
      if (billingInterval === 'year') {
        endDate.setFullYear(endDate.getFullYear() + 1)
      } else {
        endDate.setMonth(endDate.getMonth() + 1)
      }

      await supabaseAdmin.from('profiles').upsert({
        id: userId,
        is_pro: true,
        plan: 'paid',
        billing_interval: billingInterval,
        subscription_end_date: endDate.toISOString(),
        paystack_reference: reference,
        paystack_customer_code: data.data.customer?.customer_code ?? null,
        updated_at: new Date().toISOString(),
      })
      console.log(`✅ [paystack/verify] User ${userId} upgraded to Pro (${billingInterval})`)
    }

    return NextResponse.redirect(`${origin}/browse?upgraded=true`)
  } catch (err: any) {
    console.error('[paystack/verify]', err)
    return NextResponse.redirect(`${origin}/browse?error=server_error`)
  }
}
