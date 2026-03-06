import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const checks: Record<string, string> = {}

  // Stripe
  try {
    await stripe.balance.retrieve()
    checks.stripe = 'ok'
  } catch (e: unknown) {
    checks.stripe = e instanceof Error ? e.message : 'error'
  }

  // Env vars present (values redacted)
  checks.stripe_key_set = process.env.STRIPE_SECRET_KEY?.startsWith('sk_') ? 'yes' : 'no'
  checks.stripe_webhook_set = process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') ? 'yes' : 'no'
  checks.supabase_url_set = !!process.env.NEXT_PUBLIC_SUPABASE_URL ? 'yes' : 'no'
  checks.resend_key_set = process.env.RESEND_API_KEY?.startsWith('re_') ? 'yes' : 'no'

  const allOk = checks.stripe === 'ok'
  return NextResponse.json(checks, { status: allOk ? 200 : 500 })
}
