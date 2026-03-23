import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import stripe from '@/lib/stripe'

const MONTHLY_AMOUNT = Math.round(Number(process.env.NEXT_PUBLIC_STRIPE_PRICE_AMOUNT || 5) * 100)
const YEARLY_AMOUNT = 5000  // $50.00

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json().catch(() => ({}))
    const billingInterval: 'month' | 'year' = body.billing_interval === 'year' ? 'year' : 'month'

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

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('profiles')
        .upsert({ id: user.id, stripe_customer_id: customerId })
    }

    const origin = request.headers.get('origin') || 'http://localhost:3000'
    const unitAmount = billingInterval === 'year' ? YEARLY_AMOUNT : MONTHLY_AMOUNT
    const currency = (process.env.NEXT_PUBLIC_STRIPE_CURRENCY || 'usd').toLowerCase()

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            recurring: { interval: billingInterval },
            product_data: {
              name: billingInterval === 'year'
                ? 'ROOTS Pro — Annual Plan'
                : 'ROOTS Pro — Monthly Plan',
              description: billingInterval === 'year'
                ? 'Full access for 1 year — Save $10 vs monthly!'
                : 'Full access to all samples, genres, and features',
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/browse?upgraded=true`,
      cancel_url: `${origin}/browse?cancelled=true`,
      metadata: { supabase_user_id: user.id, billing_interval: billingInterval },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('[stripe/checkout]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
