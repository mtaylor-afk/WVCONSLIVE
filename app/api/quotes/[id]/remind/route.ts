import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM, BUSINESS_NAME, APP_URL } from '@/lib/resend'
import { calcSubtotal, calcTotal, generateInvoiceRef, formatDate, formatCurrency } from '@/lib/utils'
import { renderReminderEmail } from '@/emails/render'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, customer:customers(*), line_items(*)')
    .eq('id', params.id)
    .single()

  if (error || !quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (quote.type !== 'invoice') return NextResponse.json({ error: 'Reminders are for invoices only' }, { status: 400 })

  const customer = quote.customer
  if (!customer?.email) return NextResponse.json({ error: 'No customer email' }, { status: 400 })

  const items = quote.line_items ?? []
  const subtotal = calcSubtotal(items)
  const total = calcTotal(subtotal, quote.vat_rate)
  const ref = generateInvoiceRef(quote.id)

  const html = renderReminderEmail({
    quote,
    customer,
    total,
    ref,
    businessName: BUSINESS_NAME,
    appUrl: APP_URL,
  })

  const { data: sent, error: emailErr } = await getResend().emails.send({
    from: FROM,
    to: customer.email,
    subject: `Payment reminder: Invoice ${ref} — ${formatCurrency(total)}`,
    html,
  })

  if (emailErr) return NextResponse.json({ error: emailErr.message }, { status: 500 })

  // Mark overdue if past due date
  if (quote.due_date && new Date(quote.due_date) < new Date() && quote.status !== 'overdue') {
    await supabase.from('quotes').update({ status: 'overdue' }).eq('id', params.id)
  }

  await supabase.from('email_logs').insert({
    quote_id:        params.id,
    type:            'reminder',
    recipient_email: customer.email,
    resend_id:       sent?.id ?? null,
  })

  return NextResponse.json({ success: true })
}
