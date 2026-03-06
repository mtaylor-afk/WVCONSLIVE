import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import type { QuoteStatus, AmendmentStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Number / currency formatting ───────────────────────────────────────────────

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy')
  } catch {
    return dateStr
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  try {
    return format(parseISO(dateStr), 'd MMM yyyy, HH:mm')
  } catch {
    return dateStr
  }
}

// ── Quote calculations ─────────────────────────────────────────────────────────

export function calcSubtotal(items: { quantity: number; unit_price: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
}

export function calcVat(subtotal: number, vatRate: number): number {
  return subtotal * (vatRate / 100)
}

export function calcTotal(subtotal: number, vatRate: number): number {
  return subtotal + calcVat(subtotal, vatRate)
}

// ── Status helpers ─────────────────────────────────────────────────────────────

export const STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  invoiced: 'Invoiced',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
}

export const STATUS_COLOURS: Record<QuoteStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-primary/10 text-primary',
  viewed: 'bg-primary/15 text-primary',
  accepted: 'bg-success/10 text-success',
  invoiced: 'bg-warning/10 text-warning',
  paid: 'bg-success/15 text-success',
  overdue: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground line-through',
}

export const AMENDMENT_STATUS_COLOURS: Record<AmendmentStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
}

// ── Quote number generator ─────────────────────────────────────────────────────

export function generateQuoteRef(id: string): string {
  return `Q-${id.slice(0, 8).toUpperCase()}`
}

export function generateInvoiceRef(id: string): string {
  return `INV-${id.slice(0, 8).toUpperCase()}`
}

// ── API helpers ────────────────────────────────────────────────────────────────

export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return `${base}${path}`
}
