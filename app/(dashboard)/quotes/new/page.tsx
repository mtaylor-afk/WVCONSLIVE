'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LineItemsEditor } from '@/components/quotes/line-items-editor'
import { Button } from '@/components/ui/button'
import { calcSubtotal, calcVat, calcTotal, formatCurrency } from '@/lib/utils'
import type { LineItemInput, CreateQuoteInput } from '@/types'

export default function NewQuotePage() {
  const router = useRouter()

  const [customerId, setCustomerId] = useState('')
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '', address: '' })
  const [useNewCustomer, setUseNewCustomer] = useState(true)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'quote' | 'invoice'>('quote')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10))
  const [dueDate, setDueDate] = useState('')
  const [vatRate, setVatRate] = useState(20)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItemInput[]>([
    { description: '', quantity: 1, unit_price: 0 },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = calcSubtotal(items)
  const vat = calcVat(subtotal, vatRate)
  const total = calcTotal(subtotal, vatRate)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let cid = customerId
      if (useNewCustomer) {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomer),
        })
        if (!res.ok) throw new Error('Failed to create customer')
        const { id } = await res.json()
        cid = id
      }

      const payload: CreateQuoteInput = {
        customer_id: cid,
        title,
        description: description || undefined,
        type,
        issue_date: issueDate,
        due_date: dueDate || undefined,
        vat_rate: vatRate,
        notes: notes || undefined,
        line_items: items.filter(i => i.description.trim()),
      }

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to create quote')
      const { id } = await res.json()
      router.push(`/quotes/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">New Quote / Invoice</h1>
        <p className="text-sm text-muted-foreground mt-1">Fill in the details below and click Save.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:gap-6">
        {/* Type */}
        <div className="card p-5">
          <h2 className="font-semibold text-foreground mb-3">Document type</h2>
          <div className="flex gap-3">
            {(['quote', 'invoice'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all min-h-[44px] ${
                  type === t
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-foreground border-border hover:border-primary/40'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Customer */}
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-foreground">Customer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">Name *</label>
              <input className="form-input" required value={newCustomer.name}
                onChange={e => setNewCustomer(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" required value={newCustomer.email}
                onChange={e => setNewCustomer(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-input" value={newCustomer.phone}
                onChange={e => setNewCustomer(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="form-label">Address</label>
              <input className="form-input" value={newCustomer.address}
                onChange={e => setNewCustomer(p => ({ ...p, address: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Job details */}
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-foreground">Job details</h2>
          <div>
            <label className="form-label">Title *</label>
            <input className="form-input" required placeholder="e.g. Full bathroom renovation - 12 Oak Avenue"
              value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea rows={3} className="form-input" placeholder="Optional overview of the work..."
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="form-label">Issue date *</label>
              <input type="date" className="form-input" required value={issueDate}
                onChange={e => setIssueDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Due date</label>
              <input type="date" className="form-input" value={dueDate}
                onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">VAT rate (%)</label>
              <input type="number" min="0" max="100" step="0.1" className="form-input"
                value={vatRate} onChange={e => setVatRate(parseFloat(e.target.value) || 0)} />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-foreground">Line items</h2>
          <LineItemsEditor items={items} onChange={setItems} />

          {/* Totals */}
          <div className="flex justify-end mt-4">
            <div className="w-64 flex flex-col gap-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal (ex. VAT)</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>VAT ({vatRate}%)</span>
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
        <div className="card p-5">
          <label className="form-label">Payment terms / Notes</label>
          <textarea rows={2} className="form-input" placeholder="e.g. Payment due within 30 days. Bank transfer preferred."
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/8 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg">
            Save {type}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
