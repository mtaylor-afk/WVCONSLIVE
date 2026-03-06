'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function NewCustomerPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field: string, value: string) {
    setForm(p => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Failed to create customer')
      setLoading(false)
      return
    }

    router.push('/customers')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-foreground mb-6">New Customer</h1>

      <form onSubmit={handleSubmit} className="card p-6 flex flex-col gap-4">
        <div>
          <label className="form-label" htmlFor="name">Full name *</label>
          <input id="name" required className="form-input" value={form.name}
            onChange={e => set('name', e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="email">Email *</label>
          <input id="email" type="email" required className="form-input" value={form.email}
            onChange={e => set('email', e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="phone">Phone</label>
          <input id="phone" className="form-input" value={form.phone}
            onChange={e => set('phone', e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="address">Address</label>
          <textarea id="address" rows={2} className="form-input" value={form.address}
            onChange={e => set('address', e.target.value)} />
        </div>
        <div>
          <label className="form-label" htmlFor="notes">Notes</label>
          <textarea id="notes" rows={2} className="form-input" value={form.notes}
            onChange={e => set('notes', e.target.value)} />
        </div>

        {error && <p className="text-sm text-destructive bg-destructive/8 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={loading}>Save customer</Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
