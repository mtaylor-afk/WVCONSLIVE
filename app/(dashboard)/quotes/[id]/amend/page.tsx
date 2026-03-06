'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { LineItemsEditor } from '@/components/quotes/line-items-editor'
import { Button } from '@/components/ui/button'
import { calcSubtotal, formatCurrency } from '@/lib/utils'
import { Info } from 'lucide-react'
import type { LineItemInput } from '@/types'

export default function AmendPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [description, setDescription] = useState('')
  const [items, setItems] = useState<LineItemInput[]>([{ description: '', quantity: 1, unit_price: 0 }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const subtotal = calcSubtotal(items)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch(`/api/quotes/${params.id}/amendments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          line_items: items.filter(i => i.description.trim()),
        }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json()
        throw new Error(msg ?? 'Failed to create amendment')
      }

      router.push(`/quotes/${params.id}?amended=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Add Amendment</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add the extra work or materials. An approval email will be sent to the customer for them to e-sign.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 lg:gap-6">
        {/* Amendment description */}
        <div className="card p-5">
          <label className="form-label" htmlFor="description">
            Summary of changes *
          </label>
          <textarea
            id="description"
            rows={3}
            required
            className="form-input"
            placeholder="e.g. Customer requested additional bathroom tiling to hallway floor and extra plastering work in bedroom 2..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1.5">
            This will appear in the approval email the customer receives.
          </p>
        </div>

        {/* Additional line items */}
        <div className="card p-5 flex flex-col gap-4">
          <h2 className="font-semibold text-foreground">Additional items</h2>
          <p className="text-sm text-muted-foreground">List only the new/extra work being added. Original items remain unchanged.</p>
          <LineItemsEditor items={items} onChange={setItems} />

          {subtotal > 0 && (
            <div className="flex justify-end mt-2">
              <div className="text-sm text-muted-foreground">
                Additional cost (ex. VAT):{' '}
                <span className="font-semibold text-foreground font-mono">{formatCurrency(subtotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="bg-warning/8 border border-warning/20 rounded-xl p-4 flex gap-3">
          <Info className="w-5 h-5 text-warning flex-none mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold mb-1">How this works</p>
            <ol className="flex flex-col gap-1 list-decimal list-inside text-muted-foreground">
              <li>We send the customer an email with the amendment details.</li>
              <li>They click a secure link and review the changes.</li>
              <li>They click <strong className="text-foreground">"I approve this amendment"</strong>.</li>
              <li>Their approval (timestamp + IP) is recorded here as proof.</li>
            </ol>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/8 rounded-lg px-4 py-3">{error}</p>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading} size="lg">
            Send for Approval
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
