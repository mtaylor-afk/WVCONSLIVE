import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate, formatDateTime, calcSubtotal, calcVat, calcTotal, generateQuoteRef, generateInvoiceRef } from '@/lib/utils'
import { QuoteStatusBadge, AmendmentStatusBadge } from '@/components/quotes/status-badge'
import { LineItemsEditor } from '@/components/quotes/line-items-editor'
import { QuoteActions } from './quote-actions'
import type { Quote, Amendment } from '@/types'

export default async function QuoteDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data } = await supabase
    .from('quotes')
    .select('*, customer:customers(*), line_items(*), amendments(*, line_items(*))')
    .eq('id', params.id)
    .single()

  if (!data) notFound()

  const quote = data as Quote
  const items = quote.line_items ?? []
  const subtotal = calcSubtotal(items)
  const vat = calcVat(subtotal, quote.vat_rate)
  const total = calcTotal(subtotal, quote.vat_rate)
  const ref = quote.type === 'invoice' ? generateInvoiceRef(quote.id) : generateQuoteRef(quote.id)

  return (
    <div className="max-w-3xl flex flex-col gap-5 lg:gap-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="font-mono text-sm text-muted-foreground">{ref}</span>
            <QuoteStatusBadge status={quote.status} />
            {quote.type === 'invoice' && (
              <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-medium">Invoice</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground text-balance">{quote.title}</h1>
        </div>
        <QuoteActions quote={quote} total={total} />
      </div>

      {/* Customer + dates */}
      <div className="card p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Bill to</p>
          <p className="font-semibold text-foreground">{quote.customer?.name}</p>
          <p className="text-sm text-muted-foreground">{quote.customer?.email}</p>
          {quote.customer?.phone && <p className="text-sm text-muted-foreground">{quote.customer.phone}</p>}
          {quote.customer?.address && <p className="text-sm text-muted-foreground mt-1">{quote.customer.address}</p>}
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Dates</p>
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issued</span>
              <span className="text-foreground">{formatDate(quote.issue_date)}</span>
            </div>
            {quote.due_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Due</span>
                <span className={
                  quote.status !== 'paid' && new Date(quote.due_date) < new Date()
                    ? 'text-destructive font-semibold'
                    : 'text-foreground'
                }>
                  {formatDate(quote.due_date)}
                </span>
              </div>
            )}
            {quote.paid_at && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-success font-medium">{formatDate(quote.paid_at)}</span>
              </div>
            )}
            {quote.paid_via && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Via</span>
                <span className="text-foreground capitalize">{quote.paid_via.replace('_', ' ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {quote.description && (
        <div className="card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Description</p>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{quote.description}</p>
        </div>
      )}

      {/* Line items */}
      <div className="card p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-foreground">Line items</h2>
        <LineItemsEditor items={items} onChange={() => {}} readOnly />

        {/* Totals */}
        <div className="flex justify-end border-t border-border pt-4">
          <div className="w-64 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT ({quote.vat_rate}%)</span>
              <span className="font-mono">{formatCurrency(vat)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-border pt-2 text-foreground">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="card p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Notes</p>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{quote.notes}</p>
        </div>
      )}

      {/* Amendments */}
      {(quote.amendments ?? []).length > 0 && (
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-foreground">Amendments</h2>
          {(quote.amendments as Amendment[]).map(amendment => (
            <div key={amendment.id} className="border border-border rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{amendment.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Created {formatDateTime(amendment.created_at)}
                  </p>
                </div>
                <AmendmentStatusBadge status={amendment.status} />
              </div>

              <div className="flex gap-6 text-sm flex-wrap">
                <div>
                  <span className="text-muted-foreground">Original total: </span>
                  <span className="text-foreground font-mono">{formatCurrency(amendment.original_total)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">New total: </span>
                  <span className="font-semibold text-foreground font-mono">{formatCurrency(amendment.new_total)}</span>
                </div>
              </div>

              {(amendment.line_items ?? []).length > 0 && (
                <LineItemsEditor items={amendment.line_items!} onChange={() => {}} readOnly />
              )}

              {amendment.status === 'approved' && amendment.approved_at && (
                <div className="bg-success/8 border border-success/20 rounded-lg p-3 text-xs text-success flex flex-col gap-1">
                  <p className="font-semibold">Signed by customer</p>
                  <p>Approved: {formatDateTime(amendment.approved_at)}</p>
                  {amendment.approved_email && <p>Email: {amendment.approved_email}</p>}
                  {amendment.approved_ip && <p>IP: {amendment.approved_ip}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
