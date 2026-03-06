import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResend, FROM, BUSINESS_NAME, APP_URL } from '@/lib/resend'
import { calcSubtotal, calcTotal } from '@/lib/utils'
import { renderAmendmentEmail } from '@/emails/render'
import type { CreateAmendmentInput } from '@/types'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const body: CreateAmendmentInput = await req.json()

  if (!body.description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }
  if (!body.line_items?.length) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
  }

  // Fetch current quote + existing items
  const { data: quote } = await supabase
    .from('quotes')
    .select('*, customer:customers(*), line_items(*)')
    .eq('id', params.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })

  const customer = quote.customer
  const existingItems = quote.line_items ?? []
  const originalSubtotal = calcSubtotal(existingItems)
  const originalTotal = calcTotal(originalSubtotal, quote.vat_rate)

  const addedSubtotal = calcSubtotal(body.line_items)
  const newTotal = originalTotal + addedSubtotal * (1 + quote.vat_rate / 100)

  // Create amendment record
  const { data: amendment, error: aErr } = await supabase
    .from('amendments')
    .insert({
      quote_id:       params.id,
      description:    body.description.trim(),
      original_total: originalTotal,
      new_total:      newTotal,
    })
    .select()
    .single()

  if (aErr) return NextResponse.json({ error: aErr.message }, { status: 500 })

  // Insert amendment line items
  const lineItems = body.line_items.map(li => ({
    quote_id:     params.id,
    amendment_id: amendment.id,
    description:  li.description.trim(),
    quantity:     li.quantity,
    unit_price:   li.unit_price,
  }))

  await supabase.from('line_items').insert(lineItems)

  // Send approval email to customer
  const approvalUrl = `${APP_URL}/sign/${amendment.token}`

  const html = renderAmendmentEmail({
    amendment,
    lineItems: body.line_items,
    quote,
    customer,
    originalTotal,
    newTotal,
    approvalUrl,
    businessName: BUSINESS_NAME,
    vatRate: quote.vat_rate,
  })

  const { data: sent, error: emailErr } = await getResend().emails.send({
    from: FROM,
    to: customer.email,
    subject: `Action required: Amendment to your quote/invoice from ${BUSINESS_NAME}`,
    html,
  })

  if (emailErr) {
    // Don't fail — amendment is saved, email can be resent
    console.error('Amendment email failed:', emailErr)
  }

  await supabase.from('email_logs').insert({
    quote_id:        params.id,
    amendment_id:    amendment.id,
    type:            'amendment',
    recipient_email: customer.email,
    resend_id:       sent?.id ?? null,
  })

  return NextResponse.json({ id: amendment.id }, { status: 201 })
}
