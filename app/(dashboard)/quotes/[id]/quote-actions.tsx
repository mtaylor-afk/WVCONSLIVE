'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Mail, Bell, CreditCard, CheckCircle, Pencil, ExternalLink } from 'lucide-react'
import type { Quote, PaidVia } from '@/types'

export function QuoteActions({ quote, total }: { quote: Quote; total: number }) {
  const router = useRouter()
  const [markPaidOpen, setMarkPaidOpen] = useState(false)
  const [paidVia, setPaidVia] = useState<PaidVia>('bank_transfer')
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')

  async function post(path: string, body?: object) {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? 'Request failed')
    }
    return res.json()
  }

  async function handle(action: string, fn: () => Promise<void>) {
    setLoading(action)
    setMsg('')
    try {
      await fn()
      router.refresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(null)
    }
  }

  const isPaid = quote.status === 'paid'

  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      {/* Send quote/invoice */}
      {!isPaid && (
        <Button
          variant="primary"
          loading={loading === 'send'}
          onClick={() => handle('send', () => post(`/api/quotes/${quote.id}/send`))}
        >
          <Mail className="w-4 h-4" />
          Send {quote.type === 'invoice' ? 'Invoice' : 'Quote'}
        </Button>
      )}

      {/* Send payment reminder */}
      {quote.type === 'invoice' && !isPaid && (
        <Button
          variant="secondary"
          loading={loading === 'remind'}
          onClick={() => handle('remind', () => post(`/api/quotes/${quote.id}/remind`))}
        >
          <Bell className="w-4 h-4" />
          Send Reminder
        </Button>
      )}

      {/* Convert quote -> invoice */}
      {quote.type === 'quote' && quote.status !== 'cancelled' && !isPaid && (
        <Button
          variant="secondary"
          loading={loading === 'convert'}
          onClick={() => handle('convert', () => post(`/api/quotes/${quote.id}/convert`))}
        >
          Convert to Invoice
        </Button>
      )}

      {/* Stripe payment link */}
      {quote.type === 'invoice' && !isPaid && (
        quote.stripe_payment_link ? (
          <a
            href={quote.stripe_payment_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 font-medium text-sm px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/15 transition-all min-h-[40px]"
          >
            <ExternalLink className="w-4 h-4" />
            Open Payment Link
          </a>
        ) : (
          <Button
            variant="ghost"
            className="border border-primary/30 text-primary hover:bg-primary/8"
            loading={loading === 'stripe'}
            onClick={() => handle('stripe', () => post(`/api/quotes/${quote.id}/stripe-link`))}
          >
            <CreditCard className="w-4 h-4" />
            Generate Payment Link
          </Button>
        )
      )}

      {/* Mark as paid */}
      {!isPaid && quote.type === 'invoice' && (
        <Button
          variant="success"
          onClick={() => setMarkPaidOpen(true)}
        >
          <CheckCircle className="w-4 h-4" />
          Mark as Paid
        </Button>
      )}

      {/* Add amendment */}
      {quote.status !== 'cancelled' && !isPaid && (
        <Link
          href={`/quotes/${quote.id}/amend`}
          className="inline-flex items-center justify-center gap-2 font-medium text-sm px-4 py-2 rounded-lg bg-warning/8 border border-warning/20 text-warning hover:bg-warning/15 transition-all min-h-[40px]"
        >
          <Pencil className="w-4 h-4" />
          Add Amendment
        </Link>
      )}

      {msg && <p className="text-xs text-destructive text-center">{msg}</p>}

      {/* Mark Paid modal */}
      <Modal
        open={markPaidOpen}
        onClose={() => setMarkPaidOpen(false)}
        title="Mark Invoice as Paid"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">How was this invoice paid?</p>
          <div className="flex flex-col gap-2">
            {([
              { value: 'cash',          label: 'Cash' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'card',          label: 'Card (via Stripe)' },
            ] as { value: PaidVia; label: string }[]).map(o => (
              <label key={o.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-accent transition-colors min-h-[44px]">
                <input
                  type="radio"
                  name="paid_via"
                  value={o.value}
                  checked={paidVia === o.value}
                  onChange={() => setPaidVia(o.value)}
                  className="text-primary accent-primary"
                />
                <span className="text-sm text-foreground">{o.label}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              loading={loading === 'markpaid'}
              onClick={async () => {
                await handle('markpaid', () =>
                  post(`/api/quotes/${quote.id}/mark-paid`, { paid_via: paidVia }),
                )
                setMarkPaidOpen(false)
              }}
            >
              Confirm
            </Button>
            <Button variant="secondary" onClick={() => setMarkPaidOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
