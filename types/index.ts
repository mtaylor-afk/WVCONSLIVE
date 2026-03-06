// ── Enums ──────────────────────────────────────────────────────────────────────

export type QuoteType = 'quote' | 'invoice'

export type QuoteStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'invoiced'
  | 'paid'
  | 'overdue'
  | 'cancelled'

export type PaidVia = 'cash' | 'bank_transfer' | 'card'

export type AmendmentStatus = 'pending' | 'approved' | 'rejected'

export type EmailType = 'quote' | 'invoice' | 'reminder' | 'amendment' | 'notification'

// ── Database rows ──────────────────────────────────────────────────────────────

export interface Customer {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  notes: string | null
  created_at: string
}

export interface LineItem {
  id: string
  quote_id: string
  amendment_id: string | null
  description: string
  quantity: number
  unit_price: number
  created_at: string
}

export interface Amendment {
  id: string
  quote_id: string
  description: string
  token: string
  status: AmendmentStatus
  original_total: number
  new_total: number
  approved_at: string | null
  approved_ip: string | null
  approved_email: string | null
  created_at: string
  // joined
  line_items?: LineItem[]
}

export interface Quote {
  id: string
  customer_id: string
  title: string
  description: string | null
  type: QuoteType
  status: QuoteStatus
  issue_date: string
  due_date: string | null
  vat_rate: number
  notes: string | null
  stripe_payment_link: string | null
  stripe_payment_intent_id: string | null
  paid_at: string | null
  paid_via: PaidVia | null
  created_at: string
  updated_at: string
  // joined
  customer?: Customer
  line_items?: LineItem[]
  amendments?: Amendment[]
}

export interface EmailLog {
  id: string
  quote_id: string | null
  amendment_id: string | null
  type: EmailType
  recipient_email: string
  resend_id: string | null
  opened_at: string | null
  created_at: string
}

export interface QuoteTotals {
  quote_id: string
  subtotal: number
  vat_amount: number
  total: number
}

// ── API request/response shapes ────────────────────────────────────────────────

export interface CreateCustomerInput {
  name: string
  email: string
  phone?: string
  address?: string
  notes?: string
}

export interface LineItemInput {
  description: string
  quantity: number
  unit_price: number
}

export interface CreateQuoteInput {
  customer_id: string
  title: string
  description?: string
  type?: QuoteType
  issue_date?: string
  due_date?: string
  vat_rate?: number
  notes?: string
  line_items: LineItemInput[]
}

export interface CreateAmendmentInput {
  description: string
  line_items: LineItemInput[]
}

export interface MarkPaidInput {
  paid_via: PaidVia
  paid_at?: string
}

// ── UI helpers ─────────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_outstanding: number
  total_paid_this_month: number
  overdue_count: number
  quotes_awaiting_approval: number
}
