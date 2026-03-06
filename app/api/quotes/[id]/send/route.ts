import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM, BUSINESS_NAME, APP_URL } from '@/lib/resend'
import { calcSubtotal, calcTotal, generateQuoteRef, generateInvoiceRef } from '@/lib/utils'
import { renderQuoteEmail, renderInvoiceEmail } from '@/emails/render'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, customer:customers(*), line_items(*)')
    .eq('id', params.id)
    .single()

  if (error || !quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

  const customer = quote.customer
  if (!customer?.email) return NextResponse.json({ error: 'Customer has no email' }, { status: 400 })

  const items = quote.line_items ?? []
  const subtotal = calcSubtotal(items)
  const total = calcTotal(subtotal, quote.vat_rate)
  const ref = quote.type === 'invoice' ? generateInvoiceRef(quote.id) : generateQuoteRef(quote.id)

  const subject = quote.type === 'invoice'
    ? `Invoice ${ref} from ${BUSINESS_NAME}`
    : `Quote ${ref} from ${BUSINESS_NAME}`

  const html = quote.type === 'invoice'
    ? renderInvoiceEmail({ quote, customer, total, ref, businessName: BUSINESS_NAME, appUrl: APP_URL })
    : renderQuoteEmail({ quote, customer, total, ref, businessName: BUSINESS_NAME, appUrl: APP_URL })

  const { data: sent, error: emailErr } = await getResend().emails.send({
    from: FROM,
    to: customer.email,
    subject,
    html,
  })

  if (emailErr) return NextResponse.json({ error: emailErr.message }, { status: 500 })

  // Update status to 'sent' if still draft
  const newStatus = quote.status === 'draft' ? 'sent' : quote.status
  await supabase.from('quotes').update({ status: newStatus }).eq('id', params.id)

  // Log
  await supabase.from('email_logs').insert({
    quote_id:        params.id,
    type:            quote.type,
    recipient_email: customer.email,
    resend_id:       sent?.id ?? null,
  })

  return NextResponse.json({ success: true })
}
