import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateQuoteInput } from '@/types'

export async function GET(req: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)

  let query = supabase
    .from('quotes')
    .select('*, customer:customers(*), line_items(*)')
    .order('created_at', { ascending: false })

  if (searchParams.get('status')) query = query.eq('status', searchParams.get('status')!)
  if (searchParams.get('type'))   query = query.eq('type', searchParams.get('type')!)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createClient()
  const body: CreateQuoteInput = await req.json()

  if (!body.customer_id || !body.title?.trim()) {
    return NextResponse.json({ error: 'customer_id and title are required' }, { status: 400 })
  }
  if (!body.line_items?.length) {
    return NextResponse.json({ error: 'At least one line item is required' }, { status: 400 })
  }

  // Create quote
  const { data: quote, error: qErr } = await supabase
    .from('quotes')
    .insert({
      customer_id:  body.customer_id,
      title:        body.title.trim(),
      description:  body.description?.trim() || null,
      type:         body.type ?? 'quote',
      issue_date:   body.issue_date ?? new Date().toISOString().slice(0, 10),
      due_date:     body.due_date || null,
      vat_rate:     body.vat_rate ?? 20,
      notes:        body.notes?.trim() || null,
    })
    .select()
    .single()

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 })

  // Insert line items
  const lineItems = body.line_items.map(li => ({
    quote_id:    quote.id,
    description: li.description.trim(),
    quantity:    li.quantity,
    unit_price:  li.unit_price,
  }))

  const { error: liErr } = await supabase.from('line_items').insert(lineItems)
  if (liErr) return NextResponse.json({ error: liErr.message }, { status: 500 })

  return NextResponse.json({ id: quote.id }, { status: 201 })
}
