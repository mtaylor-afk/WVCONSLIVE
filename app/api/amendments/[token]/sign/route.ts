import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getResend, FROM, BUSINESS_NAME, OWNER_EMAIL } from '@/lib/resend'
import { formatCurrency } from '@/lib/utils'

export async function POST(req: Request, { params }: { params: { token: string } }) {
  // Use service client — this is a public endpoint (no auth cookie)
  const supabase = createServiceClient()

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'

  // Load amendment
  const { data: amendment } = await supabase
    .from('amendments')
    .select('*, quote:quotes(*, customer:customers(*))')
    .eq('token', params.token)
    .single()

  if (!amendment) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  if (amendment.status !== 'pending') {
    return NextResponse.json({ error: 'This amendment has already been processed' }, { status: 409 })
  }

  const customerEmail = amendment.quote?.customer?.email ?? 'unknown'

  // Record approval
  const { error } = await supabase
    .from('amendments')
    .update({
      status:         'approved',
      approved_at:    new Date().toISOString(),
      approved_ip:    ip,
      approved_email: customerEmail,
    })
    .eq('id', amendment.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update quote total isn't stored directly — totals are always computed
  // But we update quote status back to 'invoiced' if it was pending amendment
  await supabase
    .from('quotes')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', amendment.quote_id)

  // Notify business owner
  if (OWNER_EMAIL) {
    await getResend().emails.send({
      from: FROM,
      to: OWNER_EMAIL,
      subject: `Amendment approved by ${customerEmail}`,
      html: `
        <p>The customer <strong>${customerEmail}</strong> has approved an amendment.</p>
        <ul>
          <li>Original total: ${formatCurrency(amendment.original_total)}</li>
          <li>New total: ${formatCurrency(amendment.new_total)}</li>
          <li>Approved at: ${new Date().toLocaleString('en-GB')}</li>
          <li>IP: ${ip}</li>
        </ul>
        <p>${amendment.description}</p>
      `,
    })
  }

  return NextResponse.json({ success: true })
}

/** GET — load amendment details for the signing page */
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const supabase = createServiceClient()

  const { data: amendment } = await supabase
    .from('amendments')
    .select('*, quote:quotes(title, vat_rate, customer:customers(name, email)), line_items(*)')
    .eq('token', params.token)
    .single()

  if (!amendment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(amendment)
}
