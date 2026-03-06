import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Convert a quote to an invoice. Sets type='invoice' and status='invoiced'. */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: quote } = await supabase
    .from('quotes')
    .select('type, status')
    .eq('id', params.id)
    .single()

  if (!quote) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (quote.type === 'invoice') return NextResponse.json({ error: 'Already an invoice' }, { status: 400 })

  const { error } = await supabase
    .from('quotes')
    .update({ type: 'invoice', status: 'invoiced' })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
