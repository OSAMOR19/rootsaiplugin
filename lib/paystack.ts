/**
 * Paystack helper — holds the secret key and base URL.
 * All API calls are plain fetch() requests to https://api.paystack.co
 * No SDK needed.
 */

if (!process.env.PAYSTACK_SECRET_KEY) {
  console.warn('⚠️  PAYSTACK_SECRET_KEY is not set. Paystack features will be disabled.')
}

export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? ''
export const PAYSTACK_BASE_URL = 'https://api.paystack.co'

/** Returns headers required for every Paystack API request. */
export function paystackHeaders() {
  return {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  }
}

export const paystackConfigured = Boolean(PAYSTACK_SECRET_KEY)
