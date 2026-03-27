import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHmac } from 'crypto'
import { PAYSTACK_SECRET_KEY } from '@/lib/paystack'

// Paystack requires the raw body for signature verification
export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  const body = await request.text()
  const paystackSignature = request.headers.get('x-paystack-signature')

  if (!paystackSignature || !PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY.includes('PASTE_YOUR')) {
    console.error('[paystack/webhook] Missing or placeholder webhook secret in .env');
    return NextResponse.json({ error: 'Missing or placeholder signature or secret key' }, { status: 400 })
  }

  // Verify HMAC-SHA512 signature
  const expectedSignature = createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')

  if (expectedSignature !== paystackSignature) {
    console.error('[paystack/webhook] Signature mismatch — possible spoofed request')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const eventType: string = event.event
  const eventData = event.data

  switch (eventType) {
    /**
     * Fired every time a charge is successfully completed.
     * This is the primary way to grant Pro access for one-time purchases
     * and for recurring subscription renewals.
     */
    case 'charge.success': {
      const userId: string | undefined = eventData.metadata?.supabase_user_id
      const customerCode: string | undefined = eventData.customer?.customer_code
      const reference: string | undefined = eventData.reference

      if (userId) {
        await supabaseAdmin.from('profiles').upsert({
          id: userId,
          is_pro: true,
          plan: 'paid',
          paystack_customer_code: customerCode ?? null,
          paystack_reference: reference ?? null,
        })
        console.log(`✅ [paystack/webhook] charge.success — User ${userId} upgraded to Pro`)
      }
      break
    }

    /**
     * Fired when a Paystack subscription is cancelled or disabled.
     * Revoke Pro access accordingly.
     */
    case 'subscription.disable':
    case 'subscription.not_renew': {
      const customerCode: string | undefined = eventData.customer?.customer_code

      if (customerCode) {
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('paystack_customer_code', customerCode)
          .single()

        if (profile?.id) {
          await supabaseAdmin.from('profiles').update({
            is_pro: false,
            plan: 'free',
          }).eq('id', profile.id)
          console.log(`❌ [paystack/webhook] ${eventType} — User ${profile.id} downgraded to Free`)
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      console.warn('[paystack/webhook] Payment failed for event:', event)
      break
    }

    default:
      // Unhandled event type — ignore silently
      break
  }

  return NextResponse.json({ received: true })
}
