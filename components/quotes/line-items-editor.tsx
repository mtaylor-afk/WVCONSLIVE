'use client'

import { formatCurrency } from '@/lib/utils'
import { Trash2, Plus } from 'lucide-react'
import type { LineItemInput } from '@/types'

interface LineItemsEditorProps {
  items: LineItemInput[]
  onChange: (items: LineItemInput[]) => void
  readOnly?: boolean
}

export function LineItemsEditor({ items, onChange, readOnly = false }: LineItemsEditorProps) {
  function update(index: number, field: keyof LineItemInput, value: string | number) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item,
    )
    onChange(updated)
  }

  function addRow() {
    onChange([...items, { description: '', quantity: 1, unit_price: 0 }])
  }

  function removeRow(index: number) {
    onChange(items.filter((_, i) => i !== index))
  }

  return (
    <div>
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary text-left text-muted-foreground">
              <th className="px-4 py-3 font-medium w-full">Description</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Qty</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Unit Price</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Line Total</th>
              {!readOnly && <th className="px-4 py-3 w-8" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {items.map((item, i) => (
              <tr key={i}>
                <td className="px-4 py-2">
                  {readOnly ? (
                    <span className="text-foreground">{item.description}</span>
                  ) : (
                    <input
                      className="form-input"
                      placeholder="Describe the work..."
                      value={item.description}
                      onChange={e => update(i, 'description', e.target.value)}
                      required
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  {readOnly ? (
                    <span className="text-foreground font-mono">{item.quantity}</span>
                  ) : (
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="form-input w-20"
                      value={item.quantity}
                      onChange={e => update(i, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  {readOnly ? (
                    <span className="text-foreground font-mono">{formatCurrency(item.unit_price)}</span>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-input w-28"
                      value={item.unit_price}
                      onChange={e => update(i, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  )}
                </td>
                <td className="px-4 py-2 text-right font-medium font-mono whitespace-nowrap text-foreground">
                  {formatCurrency(item.quantity * item.unit_price)}
                </td>
                {!readOnly && (
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-lg hover:bg-destructive/8 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="px-4 py-6 text-center text-muted-foreground text-sm">
                  No items yet. {!readOnly && 'Click "Add line" below.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="lg:hidden flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={i} className="border border-border rounded-lg p-3 flex flex-col gap-2">
            {readOnly ? (
              <>
                <p className="text-sm font-medium text-foreground">{item.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Qty: <span className="font-mono text-foreground">{item.quantity}</span> x <span className="font-mono text-foreground">{formatCurrency(item.unit_price)}</span></span>
                  <span className="font-semibold font-mono text-foreground">{formatCurrency(item.quantity * item.unit_price)}</span>
                </div>
              </>
            ) : (
              <>
                <input
                  className="form-input"
                  placeholder="Describe the work..."
                  value={item.description}
                  onChange={e => update(i, 'description', e.target.value)}
                  required
                />
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Qty</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      className="form-input"
                      value={item.quantity}
                      onChange={e => update(i, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground">Unit Price</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-input"
                      value={item.unit_price}
                      onChange={e => update(i, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1 pt-4">
                    <span className="text-sm font-semibold font-mono text-foreground">{formatCurrency(item.quantity * item.unit_price)}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      aria-label="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <div className="border border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
            No items yet. {!readOnly && 'Click "Add line" below.'}
          </div>
        )}
      </div>

      {!readOnly && (
        <button
          type="button"
          onClick={addRow}
          className="mt-3 text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 transition-colors min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          Add line
        </button>
      )}
    </div>
  )
}
