import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (event.type === 'checkout.session.completed' || event.type === 'payment_intent.succeeded') {
    const obj = event.data.object as Stripe.PaymentIntent | Stripe.Checkout.Session
    const quoteId = obj.metadata?.quoteId

    if (quoteId) {
      await supabase
        .from('quotes')
        .update({
          status:   'paid',
          paid_via: 'card',
          paid_at:  new Date().toISOString(),
          stripe_payment_intent_id: 'id' in obj ? obj.id : null,
        })
        .eq('id', quoteId)
    }
  }

  return NextResponse.json({ received: true })
}
