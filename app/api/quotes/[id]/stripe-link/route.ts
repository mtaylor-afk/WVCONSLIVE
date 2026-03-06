import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPaymentLink } from '@/lib/stripe'
import { calcSubtotal, calcTotal, generateInvoiceRef } from '@/lib/utils'

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('*, customer:customers(*), line_items(*)')
    .eq('id', params.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (quote.type !== 'invoice') return NextResponse.json({ error: 'Only invoices can have payment links' }, { status: 400 })

  const customer = quote.customer
  const items = quote.line_items ?? []
  const subtotal = calcSubtotal(items)
  const total = calcTotal(subtotal, quote.vat_rate)
  const ref = generateInvoiceRef(quote.id)

  const url = await createPaymentLink({
    quoteId:       quote.id,
    invoiceRef:    ref,
    amountGBP:     total,
    customerEmail: customer?.email ?? '',
    customerName:  customer?.name ?? '',
    description:   quote.title,
  })

  // Persist the link
  await supabase.from('quotes').update({ stripe_payment_link: url }).eq('id', params.id)

  return NextResponse.json({ url })
}
