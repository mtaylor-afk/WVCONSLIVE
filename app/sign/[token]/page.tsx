'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import type { Amendment, LineItem } from '@/types'

type State = 'loading' | 'ready' | 'already_processed' | 'approved' | 'error'

interface AmendmentData extends Amendment {
  quote: {
    title: string
    vat_rate: number
    customer: { name: string; email: string }
  }
  line_items: LineItem[]
}

export default function SignPage() {
  const params = useParams<{ token: string }>()
  const [state, setState] = useState<State>('loading')
  const [amendment, setAmendment] = useState<AmendmentData | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME ?? 'Your Contractor'

  useEffect(() => {
    fetch(`/api/amendments/${params.token}/sign`)
      .then(r => {
        if (r.status === 404) { setState('error'); return null }
        return r.json()
      })
      .then(data => {
        if (!data) return
        if (data.status !== 'pending') {
          setAmendment(data)
          setState('already_processed')
          return
        }
        setAmendment(data)
        setState('ready')
      })
      .catch(() => setState('error'))
  }, [params.token])

  async function handleApprove() {
    if (!agreed) return
    setSubmitting(true)
    setError('')

    const res = await fetch(`/api/amendments/${params.token}/sign`, { method: 'POST' })

    if (res.ok) {
      setState('approved')
    } else {
      const { error: msg } = await res.json().catch(() => ({}))
      setError(msg ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  if (state === 'loading') {
    return (
      <Page businessName={businessName}>
        <div className="text-center py-16">
          <Loader2 className="w-8 h-8 text-primary mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading amendment details...</p>
        </div>
      </Page>
    )
  }

  if (state === 'error') {
    return (
      <Page businessName={businessName}>
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-destructive/15 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Link not found</h2>
          <p className="text-muted-foreground leading-relaxed">This approval link is invalid or has expired. Please contact {businessName} directly.</p>
        </div>
      </Page>
    )
  }

  if (state === 'approved') {
    return (
      <Page businessName={businessName}>
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-success/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Amendment Approved</h2>
          <p className="text-muted-foreground mb-2 leading-relaxed">
            You have successfully approved this amendment. Your approval has been recorded with a timestamp.
          </p>
          <p className="text-sm text-muted-foreground/70">
            {businessName} will be notified and the work can now proceed. You may close this page.
          </p>
        </div>
      </Page>
    )
  }

  if (state === 'already_processed' && amendment) {
    return (
      <Page businessName={businessName}>
        <div className="text-center py-12">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            amendment.status === 'approved' ? 'bg-success/15' : 'bg-muted'
          }`}>
            <CheckCircle className={`w-10 h-10 ${amendment.status === 'approved' ? 'text-success' : 'text-muted-foreground'}`} />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Amendment already {amendment.status}
          </h2>
          {amendment.status === 'approved' && amendment.approved_at && (
            <p className="text-muted-foreground text-sm">
              Approved on {formatDateTime(amendment.approved_at)}
            </p>
          )}
        </div>
      </Page>
    )
  }

  if (!amendment) return null

  return (
    <Page businessName={businessName}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-foreground text-balance">Amendment Approval Required</h2>
          <p className="text-muted-foreground mt-1 leading-relaxed">
            <strong className="text-foreground">{businessName}</strong> has proposed additional work on your job.
            Please review the details below and approve if you agree.
          </p>
        </div>

        {/* Job info */}
        <div className="bg-secondary rounded-xl p-4 text-sm">
          <p className="font-medium text-foreground">Job: {amendment.quote?.title}</p>
          <p className="text-muted-foreground">Customer: {amendment.quote?.customer?.name}</p>
        </div>

        {/* Summary */}
        <div className="bg-warning/8 border border-warning/20 rounded-xl p-4">
          <p className="font-semibold text-foreground mb-1">Summary of changes</p>
          <p className="text-muted-foreground text-sm leading-relaxed">{amendment.description}</p>
        </div>

        {/* Added line items */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Additional work / materials</h3>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary text-muted-foreground">
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                  <th className="px-4 py-3 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {(amendment.line_items ?? []).map(item => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 text-foreground">{item.description}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{item.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">{formatCurrency(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right font-medium font-mono text-foreground">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 flex flex-col gap-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Original total</span>
              <span className="font-mono">{formatCurrency(amendment.original_total)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Additional amount</span>
              <span className="text-warning font-mono">+{formatCurrency(amendment.new_total - amendment.original_total)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t border-border pt-3 text-foreground">
              <span>New total</span>
              <span className="text-primary font-mono">{formatCurrency(amendment.new_total)}</span>
            </div>
          </div>
        </div>

        {/* Agreement checkbox */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-primary rounded min-w-[20px]"
            />
            <span className="text-sm text-foreground leading-relaxed">
              I, <strong>{amendment.quote?.customer?.name}</strong>, agree to the additional work
              described above and authorise <strong>{businessName}</strong> to proceed.
              I understand the revised total will be <strong className="font-mono">{formatCurrency(amendment.new_total)}</strong> (inc. VAT).
              My approval will be recorded with a timestamp and IP address.
            </span>
          </label>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/8 rounded-lg px-4 py-3">{error}</p>
        )}

        {/* Approve button */}
        <button
          onClick={handleApprove}
          disabled={!agreed || submitting}
          className="w-full py-4 bg-success hover:bg-success/90 disabled:opacity-40 disabled:cursor-not-allowed text-success-foreground font-bold text-lg rounded-xl transition-all shadow-sm min-h-[56px]"
        >
          {submitting ? 'Recording approval...' : 'I Approve This Amendment'}
        </button>

        <p className="text-xs text-center text-muted-foreground/70">
          By clicking above you are creating a legally binding electronic agreement.
          If you do not agree, do not click and contact {businessName} to discuss.
        </p>
      </div>
    </Page>
  )
}

function Page({ children, businessName }: { children: React.ReactNode; businessName: string }) {
  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Branding header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-none">
            <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-lg font-bold text-foreground">{businessName}</span>
        </div>

        {/* Card */}
        <div className="bg-card text-card-foreground rounded-2xl border border-border shadow-sm p-6 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
