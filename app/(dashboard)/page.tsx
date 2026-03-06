import { createClient } from '@/lib/supabase/server'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { QuoteTable } from '@/components/quotes/quote-table'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Plus, AlertTriangle } from 'lucide-react'
import { startOfMonth } from 'date-fns'
import type { DashboardStats, Quote } from '@/types'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, customer:customers(*), line_items(*)')
    .order('created_at', { ascending: false })

  const allQuotes = (quotes ?? []) as Quote[]

  const now = new Date()
  const monthStart = startOfMonth(now).toISOString()

  const outstanding = allQuotes
    .filter(q => q.type === 'invoice' && q.status !== 'paid' && q.status !== 'cancelled')
    .reduce((sum, q) => {
      const items = q.line_items ?? []
      const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
      return sum + subtotal * (1 + q.vat_rate / 100)
    }, 0)

  const paidThisMonth = allQuotes
    .filter(q => q.status === 'paid' && q.paid_at && q.paid_at >= monthStart)
    .reduce((sum, q) => {
      const items = q.line_items ?? []
      const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)
      return sum + subtotal * (1 + q.vat_rate / 100)
    }, 0)

  const overdueCount = allQuotes.filter(
    q => q.type === 'invoice' && q.status !== 'paid' && q.status !== 'cancelled'
      && q.due_date && new Date(q.due_date) < now,
  ).length

  const awaitingApproval = allQuotes.filter(
    q => q.status === 'sent' || q.status === 'viewed',
  ).length

  const stats: DashboardStats = {
    total_outstanding: outstanding,
    total_paid_this_month: paidThisMonth,
    overdue_count: overdueCount,
    quotes_awaiting_approval: awaitingApproval,
  }

  const recent = allQuotes.slice(0, 10)

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground text-balance">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium px-4 py-2.5 rounded-lg transition-all shadow-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Quote</span>
        </Link>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="bg-destructive/8 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-none mt-0.5" />
          <div>
            <p className="font-medium text-destructive">
              {overdueCount} overdue invoice{overdueCount > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-destructive/80 mt-0.5">
              Open the invoice and send a payment reminder.{' '}
              <Link href="/quotes?status=overdue" className="underline font-medium">View overdue</Link>
            </p>
          </div>
        </div>
      )}

      {/* Recent Quotes */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="px-4 lg:px-6 pt-5 pb-4 border-b border-border">
          <CardTitle>Recent Quotes & Invoices</CardTitle>
          <Link href="/quotes" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
            {'View all ->'}
          </Link>
        </CardHeader>
        <div className="px-4 lg:px-6 py-4">
          <QuoteTable quotes={recent} />
        </div>
      </Card>
    </div>
  )
}
