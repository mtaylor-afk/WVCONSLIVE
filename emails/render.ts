/**
 * Plain-HTML email renderer (no JSX required at runtime).
 * Keeps the bundle simple — these run only on the server.
 */

import { formatCurrency, formatDate, calcSubtotal, calcVat } from '@/lib/utils'
import type { Quote, Customer, Amendment, LineItemInput } from '@/types'

// ── Shared layout ──────────────────────────────────────────────────────────────

function wrap(businessName: string, title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f8fafc; font-family: -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#1e293b; }
    .wrapper { max-width:600px; margin:0 auto; padding:32px 16px; }
    .card { background:#fff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; }
    .header { background:#1e3a8a; padding:28px 32px; }
    .header h1 { margin:0; color:#fff; font-size:20px; font-weight:700; }
    .header p { margin:4px 0 0; color:#93c5fd; font-size:13px; }
    .body { padding:28px 32px; }
    table.items { width:100%; border-collapse:collapse; margin:16px 0; font-size:14px; }
    table.items th { text-align:left; color:#64748b; font-weight:600; border-bottom:2px solid #e2e8f0; padding:8px 4px; }
    table.items td { padding:10px 4px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
    table.items td.right { text-align:right; }
    .totals { margin-left:auto; width:260px; font-size:14px; }
    .totals tr td { padding:4px 0; }
    .totals tr.grand td { font-size:16px; font-weight:700; border-top:2px solid #e2e8f0; padding-top:8px; }
    .btn { display:inline-block; background:#2563eb; color:#fff !important; text-decoration:none; padding:14px 28px; border-radius:8px; font-weight:600; font-size:15px; margin:20px 0; }
    .btn-warn { background:#d97706; }
    .btn-green { background:#16a34a; }
    .footer { padding:20px 32px; text-align:center; color:#94a3b8; font-size:12px; border-top:1px solid #f1f5f9; }
    .info-box { background:#f0f9ff; border:1px solid #bae6fd; border-radius:8px; padding:16px; margin:16px 0; font-size:13px; color:#0369a1; }
    .warn-box { background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:16px; margin:16px 0; font-size:13px; color:#92400e; }
    .sign-box { background:#f0fdf4; border:2px solid #86efac; border-radius:12px; padding:20px; margin:24px 0; text-align:center; }
  </style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <h1>${businessName}</h1>
    </div>
    <div class="body">${body}</div>
    <div class="footer">
      ${businessName} &middot; This is an automated message — please do not reply directly.
    </div>
  </div>
</div>
</body>
</html>`
}

function itemsTable(items: { description: string; quantity: number; unit_price: number }[], vatRate: number): string {
  const rows = items.map(i => `
    <tr>
      <td>${i.description}</td>
      <td class="right">${i.quantity}</td>
      <td class="right">${formatCurrency(i.unit_price)}</td>
      <td class="right">${formatCurrency(i.quantity * i.unit_price)}</td>
    </tr>`).join('')

  const subtotal = calcSubtotal(items)
  const vat = calcVat(subtotal, vatRate)
  const total = subtotal + vat

  return `
    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Line Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <table class="totals">
      <tr><td>Subtotal (ex. VAT)</td><td style="text-align:right">${formatCurrency(subtotal)}</td></tr>
      <tr><td>VAT (${vatRate}%)</td><td style="text-align:right">${formatCurrency(vat)}</td></tr>
      <tr class="grand"><td>Total</td><td style="text-align:right">${formatCurrency(total)}</td></tr>
    </table>`
}

// ── Quote email ────────────────────────────────────────────────────────────────

export function renderQuoteEmail({
  quote, customer, total, ref, businessName, appUrl,
}: {
  quote: Quote; customer: Customer; total: number; ref: string; businessName: string; appUrl: string
}): string {
  const items = quote.line_items ?? []
  const body = `
    <p>Dear ${customer.name},</p>
    <p>Please find your quote from <strong>${businessName}</strong> below.</p>
    <p><strong>Quote ref:</strong> ${ref}<br/>
    <strong>Date:</strong> ${formatDate(quote.issue_date)}<br/>
    ${quote.due_date ? `<strong>Valid until:</strong> ${formatDate(quote.due_date)}<br/>` : ''}
    <strong>Total:</strong> ${formatCurrency(total)}</p>

    <h3 style="margin-bottom:4px;font-size:15px">${quote.title}</h3>
    ${quote.description ? `<p style="color:#64748b;font-size:14px">${quote.description}</p>` : ''}

    ${itemsTable(items, quote.vat_rate)}

    ${quote.notes ? `<div class="info-box">${quote.notes}</div>` : ''}

    <p style="color:#64748b;font-size:13px;margin-top:24px">
      If you have any questions, please get in touch with us directly.
    </p>`

  return wrap(businessName, `Quote ${ref}`, body)
}

// ── Invoice email ──────────────────────────────────────────────────────────────

export function renderInvoiceEmail({
  quote, customer, total, ref, businessName, appUrl,
}: {
  quote: Quote; customer: Customer; total: number; ref: string; businessName: string; appUrl: string
}): string {
  const items = quote.line_items ?? []
  const payBtn = quote.stripe_payment_link
    ? `<a href="${quote.stripe_payment_link}" class="btn btn-green">Pay Now — ${formatCurrency(total)}</a>`
    : ''

  const body = `
    <p>Dear ${customer.name},</p>
    <p>Thank you for your business. Please find your invoice below.</p>
    <p><strong>Invoice ref:</strong> ${ref}<br/>
    <strong>Date:</strong> ${formatDate(quote.issue_date)}<br/>
    ${quote.due_date ? `<strong>Payment due:</strong> ${formatDate(quote.due_date)}<br/>` : ''}
    <strong>Amount due:</strong> <strong style="color:#2563eb">${formatCurrency(total)}</strong></p>

    <h3 style="margin-bottom:4px;font-size:15px">${quote.title}</h3>
    ${quote.description ? `<p style="color:#64748b;font-size:14px">${quote.description}</p>` : ''}

    ${itemsTable(items, quote.vat_rate)}

    ${payBtn}

    ${quote.notes ? `<div class="info-box">${quote.notes}</div>` : ''}

    <p style="color:#64748b;font-size:13px">
      You can also pay by bank transfer or cash — please quote invoice reference <strong>${ref}</strong>.
    </p>`

  return wrap(businessName, `Invoice ${ref}`, body)
}

// ── Reminder email ─────────────────────────────────────────────────────────────

export function renderReminderEmail({
  quote, customer, total, ref, businessName, appUrl,
}: {
  quote: Quote; customer: Customer; total: number; ref: string; businessName: string; appUrl: string
}): string {
  const isOverdue = quote.due_date && new Date(quote.due_date) < new Date()
  const payBtn = quote.stripe_payment_link
    ? `<a href="${quote.stripe_payment_link}" class="btn btn-warn">Pay Now — ${formatCurrency(total)}</a>`
    : ''

  const body = `
    <p>Dear ${customer.name},</p>
    ${isOverdue
      ? `<p>This is a reminder that invoice <strong>${ref}</strong> for <strong>${formatCurrency(total)}</strong> was due on ${formatDate(quote.due_date)} and is now <strong style="color:#dc2626">overdue</strong>.</p>`
      : `<p>This is a friendly reminder that invoice <strong>${ref}</strong> for <strong>${formatCurrency(total)}</strong> is due for payment${quote.due_date ? ` on ${formatDate(quote.due_date)}` : ''}.</p>`
    }

    <div class="warn-box">
      <strong>Invoice:</strong> ${ref}<br/>
      <strong>Amount due:</strong> ${formatCurrency(total)}<br/>
      ${quote.due_date ? `<strong>Due date:</strong> ${formatDate(quote.due_date)}<br/>` : ''}
      <strong>Job:</strong> ${quote.title}
    </div>

    ${payBtn}

    <p style="color:#64748b;font-size:13px">
      You can also pay by bank transfer or cash — please quote invoice reference <strong>${ref}</strong>.<br/>
      If you've already made payment, please disregard this reminder.
    </p>`

  return wrap(businessName, `Payment reminder: ${ref}`, body)
}

// ── Amendment approval email ───────────────────────────────────────────────────

export function renderAmendmentEmail({
  amendment, lineItems, quote, customer, originalTotal, newTotal,
  approvalUrl, businessName, vatRate,
}: {
  amendment: Amendment
  lineItems: LineItemInput[]
  quote: Quote
  customer: Customer
  originalTotal: number
  newTotal: number
  approvalUrl: string
  businessName: string
  vatRate: number
}): string {
  const addedSubtotal = calcSubtotal(lineItems)
  const addedVat = calcVat(addedSubtotal, vatRate)
  const addedTotal = addedSubtotal + addedVat

  const addedRows = lineItems.map(i => `
    <tr>
      <td>${i.description}</td>
      <td class="right">${i.quantity}</td>
      <td class="right">${formatCurrency(i.unit_price)}</td>
      <td class="right">${formatCurrency(i.quantity * i.unit_price)}</td>
    </tr>`).join('')

  const body = `
    <p>Dear ${customer.name},</p>
    <p>
      <strong>${businessName}</strong> has proposed an amendment to your existing
      quote/invoice for <strong>${quote.title}</strong>.
    </p>

    <div class="warn-box">
      <strong>Summary of changes:</strong><br/>
      ${amendment.description}
    </div>

    <h3 style="font-size:15px;margin-bottom:8px">Additional work / materials</h3>
    <table class="items">
      <thead>
        <tr>
          <th>Description</th>
          <th class="right">Qty</th>
          <th class="right">Unit Price</th>
          <th class="right">Line Total</th>
        </tr>
      </thead>
      <tbody>${addedRows}</tbody>
    </table>

    <table class="totals">
      <tr><td>Additional cost (ex. VAT)</td><td style="text-align:right">${formatCurrency(addedSubtotal)}</td></tr>
      <tr><td>VAT (${vatRate}%)</td><td style="text-align:right">${formatCurrency(addedVat)}</td></tr>
      <tr><td>Additional total</td><td style="text-align:right">${formatCurrency(addedTotal)}</td></tr>
      <tr style="border-top:2px solid #e2e8f0"><td><strong>Original total</strong></td><td style="text-align:right"><strong>${formatCurrency(originalTotal)}</strong></td></tr>
      <tr class="grand"><td>New total</td><td style="text-align:right">${formatCurrency(newTotal)}</td></tr>
    </table>

    <div class="sign-box">
      <p style="margin:0 0 12px;font-weight:600;font-size:16px;color:#166534">
        Please review and approve this amendment
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#374151">
        By clicking the button below, you agree to this additional work and the revised total of
        <strong>${formatCurrency(newTotal)}</strong>.
      </p>
      <a href="${approvalUrl}" class="btn btn-green" style="font-size:16px;padding:16px 36px">
        Review &amp; Approve Amendment
      </a>
      <p style="margin:12px 0 0;font-size:12px;color:#6b7280">
        Your approval will be recorded with a timestamp and your IP address as confirmation.
      </p>
    </div>

    <p style="color:#64748b;font-size:13px">
      If you have questions about this amendment, please contact us directly before approving.
    </p>`

  return wrap(businessName, `Amendment approval required — ${quote.title}`, body)
}
