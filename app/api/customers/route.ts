import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateCustomerInput } from '@/types'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase.from('customers').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createClient()
  const body: CreateCustomerInput = await req.json()

  if (!body.name?.trim() || !body.email?.trim()) {
    return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      address: body.address?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
