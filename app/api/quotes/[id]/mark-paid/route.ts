import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MarkPaidInput } from '@/types'

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const body: MarkPaidInput = await req.json()

  if (!body.paid_via) {
    return NextResponse.json({ error: 'paid_via is required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('quotes')
    .update({
      status:   'paid',
      paid_via: body.paid_via,
      paid_at:  body.paid_at ?? new Date().toISOString(),
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
