import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { paystackConfigured, paystackHeaders, PAYSTACK_BASE_URL } from '@/lib/paystack'

export async function POST(request: Request) {
  if (!paystackConfigured) {
    return NextResponse.json(
      { error: 'Paystack is not configured. Please add PAYSTACK_SECRET_KEY to your environment variables.' },
      { status: 503 }
    )
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

    const origin = request.headers.get('origin') || 'http://localhost:3000'

    // Base USD amount from Stripe env var
    const usdAmount = Number(process.env.NEXT_PUBLIC_STRIPE_PRICE_AMOUNT ?? 5)
    const currency = process.env.NEXT_PUBLIC_PAYSTACK_CURRENCY ?? 'NGN'

    // Default fallback amount (from env) if API fails
    let amount = Number(process.env.NEXT_PUBLIC_PAYSTACK_AMOUNT ?? 500000)

    try {
      // Fetch live exchange rate, cache for 1 hour to respect limits
      const rateRes = await fetch('https://open.er-api.com/v6/latest/USD', {
        next: { revalidate: 3600 }
      })
      const rateData = await rateRes.json()
      
      if (rateData?.rates?.[currency]) {
        // Calculate exact equivalent (e.g. 5 USD * 1356 NGN/USD = 6780 NGN)
        const localAmount = usdAmount * rateData.rates[currency]
        // Convert to smallest unit (kobo/pesewas) and round to nearest whole number
        amount = Math.round(localAmount * 100)
      }
    } catch (e) {
      console.warn('[paystack/checkout] Failed to fetch live exchange rate, using fallback amount')
    }

    const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: paystackHeaders(),
      body: JSON.stringify({
        email: user.email,
        amount,
        currency,
        metadata: {
          supabase_user_id: user.id,
          cancel_action: `${origin}/browse?cancelled=true`,
        },
        callback_url: `${origin}/api/paystack/verify`,
        channels: ['card', 'bank', 'ussd', 'mobile_money'],
      }),
    })

    const data = await res.json()

    if (!data.status) {
      throw new Error(data.message ?? 'Failed to initialize Paystack transaction')
    }

    // Persist the Paystack reference so we can verify it later
    await supabase
      .from('profiles')
      .upsert({ id: user.id, paystack_reference: data.data.reference })

    return NextResponse.json({ authorization_url: data.data.authorization_url })
  } catch (err: any) {
    console.error('[paystack/checkout]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
