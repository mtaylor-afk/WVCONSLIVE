import { createClient } from '@/lib/supabase/server'
import { QuoteTable } from '@/components/quotes/quote-table'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { Quote, QuoteStatus } from '@/types'

const STATUSES: { value: QuoteStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'All' },
  { value: 'draft',     label: 'Drafts' },
  { value: 'sent',      label: 'Sent' },
  { value: 'accepted',  label: 'Accepted' },
  { value: 'invoiced',  label: 'Invoiced' },
  { value: 'paid',      label: 'Paid' },
  { value: 'overdue',   label: 'Overdue' },
]

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string; q?: string }
}) {
  const supabase = createClient()

  let query = supabase
    .from('quotes')
    .select('*, customer:customers(*), line_items(*)')
    .order('created_at', { ascending: false })

  if (searchParams.status && searchParams.status !== 'all') {
    query = query.eq('status', searchParams.status)
  }
  if (searchParams.type) {
    query = query.eq('type', searchParams.type)
  }

  const { data } = await query
  const quotes = (data ?? []) as Quote[]

  const activeStatus = (searchParams.status as QuoteStatus | 'all') ?? 'all'

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Quotes & Invoices</h1>
        <Link
          href="/quotes/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Quote</span>
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <Link
            key={s.value}
            href={s.value === 'all' ? '/quotes' : `/quotes?status=${s.value}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all min-h-[36px] flex items-center ${
              activeStatus === s.value
                ? 'bg-foreground text-background'
                : 'bg-card text-muted-foreground border border-border hover:border-foreground/30'
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {/* Type toggle */}
      <div className="flex gap-2">
        {[
          { href: '/quotes', label: 'All' },
          { href: '/quotes?type=quote', label: 'Quotes only' },
          { href: '/quotes?type=invoice', label: 'Invoices only' },
        ].map(t => (
          <Link
            key={t.href}
            href={t.href}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-accent text-secondary-foreground transition-all min-h-[32px] flex items-center"
          >
            {t.label}
          </Link>
        ))}
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="px-4 lg:px-6 py-4">
          <QuoteTable quotes={quotes} />
        </div>
      </Card>
    </div>
  )
}
