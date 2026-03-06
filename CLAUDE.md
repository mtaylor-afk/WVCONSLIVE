# CLAUDE.md

This file provides guidance to AI assistants (Claude and others) working with this repository.

---

## What This Project Is

A **cloud-hosted business management web app** for a construction business. It handles:

- **Quotes & Invoices** — create, send by email, track status through a pipeline
- **Amendments** — add extra work to an existing quote; customer receives an email and must click to electronically approve/sign before work proceeds
- **Payment Reminders** — one-click email reminders for unpaid invoices
- **Stripe Payments** — generate a Stripe Payment Link for card payment; webhook auto-marks invoice as paid
- **Manual Payment** — mark invoices as paid via cash or bank transfer
- **Customer Management** — store customer details

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS (custom components, no UI library) |
| Database + Auth | Supabase (PostgreSQL + RLS + SSR Auth) |
| Email | Resend + plain-HTML templates in `emails/render.ts` |
| Payments | Stripe Payment Links + Webhook |
| Hosting | Vercel (recommended) |

---

## Repository Structure

```
/
├── app/
│   ├── (auth)/login/           # Login page (Supabase email+password auth)
│   ├── (dashboard)/            # All authenticated pages
│   │   ├── layout.tsx          # Dashboard shell (sidebar + main area)
│   │   ├── page.tsx            # Main dashboard — stats + recent quotes
│   │   ├── quotes/             # Quote/invoice list, new, detail, amend
│   │   └── customers/          # Customer list and new customer form
│   ├── sign/[token]/           # PUBLIC — customer amendment signing page
│   ├── payment-success/        # PUBLIC — Stripe redirect after card payment
│   └── api/                    # Route Handlers
│       ├── customers/          # GET /customers, POST /customers
│       ├── quotes/             # GET, POST
│       │   └── [id]/
│       │       ├── route.ts         # GET, PATCH single quote
│       │       ├── send/            # POST — email quote/invoice to customer
│       │       ├── remind/          # POST — email payment reminder
│       │       ├── mark-paid/       # POST — mark invoice as paid (cash/transfer)
│       │       ├── convert/         # POST — convert quote → invoice
│       │       ├── stripe-link/     # POST — generate Stripe Payment Link
│       │       └── amendments/      # POST — create amendment + send approval email
│       ├── amendments/[token]/sign/ # GET (load), POST (approve) — public, no auth
│       └── webhooks/stripe/        # POST — Stripe webhook (auto-mark paid)
├── components/
│   ├── dashboard/stats-cards.tsx
│   ├── layout/sidebar.tsx
│   ├── quotes/
│   │   ├── quote-table.tsx
│   │   ├── status-badge.tsx
│   │   └── line-items-editor.tsx
│   └── ui/                    # button, card, modal, badge
├── emails/
│   └── render.ts              # Server-side HTML email renderers (no JSX)
├── lib/
│   ├── supabase/client.ts     # Browser Supabase client
│   ├── supabase/server.ts     # Server Supabase client + service-role client
│   ├── stripe.ts              # Stripe client + createPaymentLink()
│   ├── resend.ts              # Resend client + env exports
│   └── utils.ts               # formatCurrency, calcTotal, status colours, etc.
├── supabase/schema.sql        # Full DB schema — run once in Supabase SQL editor
├── types/index.ts             # All TypeScript types (Quote, Customer, Amendment…)
├── middleware.ts              # Auth guard + cookie refresh
├── .env.example               # Required environment variables
└── CLAUDE.md                  # This file
```

---

## Key Concepts

### Quote Status Pipeline

```
draft → sent → viewed → accepted → invoiced → paid
                                         ↓
                                       overdue
```

- `type` is either `quote` or `invoice`. They share the same table.
- Convert a quote to an invoice via `POST /api/quotes/[id]/convert`.

### Amendment E-Signature Workflow

1. User adds amendment in `/quotes/[id]/amend`
2. `POST /api/quotes/[id]/amendments` creates an `amendments` row with a unique random `token`
3. An HTML email is sent to the customer via Resend with an approval button linking to `/sign/[token]`
4. Customer lands on the public `/sign/[token]` page — no login required
5. Customer ticks the agreement checkbox, clicks "I Approve This Amendment"
6. `POST /api/amendments/[token]/sign` records `approved_at`, `approved_ip`, `approved_email` — legally defensible
7. The amendment `line_items` (linked via `amendment_id`) are already in the DB and count toward quote totals

### Totals Computation

Totals are **always computed in code** from `line_items`, never stored. The `quote_totals` database view exists for convenience but is not authoritative.

```typescript
// lib/utils.ts
calcSubtotal(items)  // sum of quantity * unit_price
calcVat(subtotal, vatRate)
calcTotal(subtotal, vatRate)  // subtotal + VAT
```

### Email Templates

All emails are rendered in `emails/render.ts` as plain-HTML strings. There is no JSX email library — this keeps the server bundle small. Add new email types by adding a new `renderXxxEmail()` function to that file.

### Supabase Clients

- `lib/supabase/client.ts` — browser client (use in `'use client'` components)
- `lib/supabase/server.ts` → `createClient()` — server client, respects RLS (use in Server Components and Route Handlers)
- `lib/supabase/server.ts` → `createServiceClient()` — bypasses RLS. **Only use in trusted server contexts** (e.g., the public amendment signing API route and Stripe webhook).

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API Keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API Keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks |
| `RESEND_API_KEY` | Resend → API Keys |
| `EMAIL_FROM` | Verified sending domain in Resend |
| `EMAIL_OWNER` | Email address to receive notifications |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (e.g. `https://yourapp.vercel.app`) |
| `NEXT_PUBLIC_BUSINESS_NAME` | Business name shown in the UI and emails |

---

## Setup Instructions

1. **Clone** the repo and run `npm install`
2. **Supabase**: Create a new project, then run the contents of `supabase/schema.sql` in the SQL editor
3. **Supabase Auth**: Create a user in Supabase → Authentication → Users (email + password)
4. **Stripe**: Create an account, enable `checkout.session.completed` webhook pointing to `https://yourapp.vercel.app/api/webhooks/stripe`
5. **Resend**: Create an account, verify your sending domain
6. **Copy** `.env.example` to `.env.local` and fill in all values
7. **Run** `npm run dev`

---

## Development Commands

```bash
npm run dev        # Start local dev server on http://localhost:3000
npm run build      # Production build
npm run lint       # ESLint
```

---

## Code Conventions

- **TypeScript strict mode** is enabled. All types live in `types/index.ts`.
- **No UI component library** — all components are hand-written with Tailwind. Keep it that way unless there's a strong reason to add one.
- **Server Components by default** — only add `'use client'` when the component needs state, effects, or event handlers.
- **API routes return `NextResponse.json()`** with appropriate HTTP status codes. Errors always have an `error` key: `{ error: 'message' }`.
- **formatCurrency** always uses `en-GB` locale and `GBP`. Do not use raw `.toFixed(2)` for money.
- **Dates** are stored as ISO strings. Use `formatDate()` / `formatDateTime()` from `lib/utils.ts` for display.
- **Email sends** are best-effort on the server — never block a user-visible action solely because an email failed. Log the error and continue.

---

## Key Reminders for AI Assistants

- Read files before editing. Understand existing code before suggesting modifications.
- Do not introduce new dependencies without strong justification.
- Do not add error handling for scenarios that cannot happen.
- `createServiceClient()` bypasses RLS — use it only in server-side trusted code (webhooks, public signing endpoint).
- The amendment token is a security secret — never expose it in client-side code other than the public signing page URL.
- Never commit `.env.local` or any file containing real credentials.
- Update this file when the project structure, conventions, or setup steps change.
