'use client'

import Link from 'next/link'
import { formatCurrency, formatDate, calcSubtotal, calcTotal, generateQuoteRef, generateInvoiceRef } from '@/lib/utils'
import { QuoteStatusBadge } from './status-badge'
import { FileText } from 'lucide-react'
import type { Quote } from '@/types'

interface QuoteTableProps {
  quotes: Quote[]
}

export function QuoteTable({ quotes }: QuoteTableProps) {
  if (quotes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="w-12 h-12 mx-auto mb-3 text-border" strokeWidth={1.5} />
        <p className="text-sm">No quotes found</p>
      </div>
    )
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-border">
              <th className="pb-3 pr-4 font-medium">Ref</th>
              <th className="pb-3 pr-4 font-medium">Customer</th>
              <th className="pb-3 pr-4 font-medium">Title</th>
              <th className="pb-3 pr-4 font-medium">Status</th>
              <th className="pb-3 pr-4 font-medium">Issued</th>
              <th className="pb-3 pr-4 font-medium">Due</th>
              <th className="pb-3 font-medium text-right">Total (inc. VAT)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {quotes.map(quote => {
              const items = quote.line_items ?? []
              const subtotal = calcSubtotal(items)
              const total = calcTotal(subtotal, quote.vat_rate)
              const ref = quote.type === 'invoice'
                ? generateInvoiceRef(quote.id)
                : generateQuoteRef(quote.id)

              return (
                <tr key={quote.id} className="hover:bg-accent/50 transition-colors">
                  <td className="py-3 pr-4">
                    <Link href={`/quotes/${quote.id}`} className="font-mono text-xs text-primary hover:text-primary/80 font-medium">
                      {ref}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-foreground/80">
                    {quote.customer?.name ?? '\u2014'}
                  </td>
                  <td className="py-3 pr-4 text-foreground max-w-[200px] truncate">
                    <Link href={`/quotes/${quote.id}`} className="hover:text-primary transition-colors">
                      {quote.title}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <QuoteStatusBadge status={quote.status} />
                  </td>
                  <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                    {formatDate(quote.issue_date)}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {quote.due_date ? (
                      <span className={
                        quote.status !== 'paid' && new Date(quote.due_date) < new Date()
                          ? 'text-destructive font-medium'
                          : 'text-muted-foreground'
                      }>
                        {formatDate(quote.due_date)}
                      </span>
                    ) : '\u2014'}
                  </td>
                  <td className="py-3 text-right font-medium font-mono text-foreground">
                    {formatCurrency(total)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile list */}
      <div className="lg:hidden flex flex-col divide-y divide-border/50">
        {quotes.map(quote => {
          const items = quote.line_items ?? []
          const subtotal = calcSubtotal(items)
          const total = calcTotal(subtotal, quote.vat_rate)
          const ref = quote.type === 'invoice'
            ? generateInvoiceRef(quote.id)
            : generateQuoteRef(quote.id)

          return (
            <Link
              key={quote.id}
              href={`/quotes/${quote.id}`}
              className="flex items-center justify-between py-3 min-h-[56px] active:bg-accent/50 transition-colors"
            >
              <div className="min-w-0 flex-1 pr-3">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs text-primary font-medium">{ref}</span>
                  <QuoteStatusBadge status={quote.status} />
                </div>
                <p className="text-sm font-medium text-foreground truncate">{quote.title}</p>
                <p className="text-xs text-muted-foreground">{quote.customer?.name ?? '\u2014'}</p>
              </div>
              <div className="text-right flex-none">
                <p className="text-sm font-semibold font-mono text-foreground">{formatCurrency(total)}</p>
                <p className="text-xs text-muted-foreground">{formatDate(quote.issue_date)}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}
