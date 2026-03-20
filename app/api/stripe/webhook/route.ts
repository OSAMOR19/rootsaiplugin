import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import stripe from '@/lib/stripe'

// Disable body parsing — Stripe needs the raw body to verify signatures
export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    console.error('[stripe/webhook] Signature verification failed:', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  const getUserId = (obj: any): string | null =>
    obj?.metadata?.supabase_user_id ?? null

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as any
      const userId = getUserId(session)
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      if (userId) {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          is_pro: true,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        console.log(`✅ [stripe/webhook] User ${userId} upgraded to Pro`)
      }
      break
    }

    case 'customer.subscription.deleted':
    case 'customer.subscription.paused': {
      const subscription = event.data.object as any
      const customerId = subscription.customer as string

      // Find the user by stripe_customer_id
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (profile?.id) {
        await supabaseAdmin.from('profiles').update({
          is_pro: false,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        }).eq('id', profile.id)
        console.log(`❌ [stripe/webhook] User ${profile.id} downgraded to Free`)
      }
      break
    }

    case 'invoice.payment_failed': {
      console.warn('[stripe/webhook] Payment failed for event:', event.id)
      break
    }

    default:
      // Unhandled event type — ignore silently
      break
  }

  return NextResponse.json({ received: true })
}
