-- ============================================================
--  Construction Manager — Supabase Schema
--  Run this in the Supabase SQL editor to set up your database
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Customers ────────────────────────────────────────────────
CREATE TABLE customers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  address     TEXT,
  notes       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Quotes / Invoices ─────────────────────────────────────────
-- A "quote" becomes an "invoice" when the status reaches 'invoiced'.
-- They share the same table to keep amendments and history together.
CREATE TABLE quotes (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id              UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  title                    TEXT NOT NULL,
  description              TEXT,

  -- 'quote' until converted; 'invoice' once work is done
  type                     TEXT NOT NULL DEFAULT 'quote'
                             CHECK (type IN ('quote', 'invoice')),

  -- Pipeline: draft → sent → viewed → accepted → invoiced → paid
  --           or any stage → overdue / cancelled
  status                   TEXT NOT NULL DEFAULT 'draft'
                             CHECK (status IN (
                               'draft','sent','viewed','accepted',
                               'invoiced','paid','overdue','cancelled'
                             )),

  issue_date               DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date                 DATE,
  vat_rate                 NUMERIC(5,2) NOT NULL DEFAULT 20.00,
  notes                    TEXT,

  -- Stripe
  stripe_payment_link      TEXT,
  stripe_payment_intent_id TEXT,

  -- Payment
  paid_at                  TIMESTAMPTZ,
  paid_via                 TEXT CHECK (paid_via IN ('cash','bank_transfer','card')),

  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ── Line Items ────────────────────────────────────────────────
CREATE TABLE line_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id      UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  -- null = original quote; set = added via this amendment
  amendment_id  UUID,
  description   TEXT NOT NULL,
  quantity      NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price    NUMERIC(10,2) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Amendments ────────────────────────────────────────────────
CREATE TABLE amendments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id         UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  description      TEXT NOT NULL,           -- summary shown in email
  token            TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected')),
  original_total   NUMERIC(10,2) NOT NULL,
  new_total        NUMERIC(10,2) NOT NULL,

  -- Audit trail recorded when customer approves
  approved_at      TIMESTAMPTZ,
  approved_ip      TEXT,
  approved_email   TEXT,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FK from line_items back to amendments (added after both tables exist)
ALTER TABLE line_items
  ADD CONSTRAINT line_items_amendment_id_fkey
  FOREIGN KEY (amendment_id) REFERENCES amendments(id) ON DELETE SET NULL;

-- ── Email Log ─────────────────────────────────────────────────
CREATE TABLE email_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id        UUID REFERENCES quotes(id) ON DELETE SET NULL,
  amendment_id    UUID REFERENCES amendments(id) ON DELETE SET NULL,
  type            TEXT NOT NULL
                    CHECK (type IN ('quote','invoice','reminder','amendment','notification')),
  recipient_email TEXT NOT NULL,
  resend_id       TEXT,
  opened_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Row Level Security ────────────────────────────────────────
-- All tables are readable/writable only by authenticated users
-- (i.e. the business owner logged into the dashboard).
-- The public amendment-signing page uses the service role key via API route.

ALTER TABLE customers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE line_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE amendments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs   ENABLE ROW LEVEL SECURITY;

-- Authenticated users get full access
CREATE POLICY "auth_all" ON customers    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON quotes       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON line_items   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON amendments   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all" ON email_logs   FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX quotes_customer_id_idx    ON quotes(customer_id);
CREATE INDEX quotes_status_idx         ON quotes(status);
CREATE INDEX line_items_quote_id_idx   ON line_items(quote_id);
CREATE INDEX amendments_quote_id_idx   ON amendments(quote_id);
CREATE INDEX amendments_token_idx      ON amendments(token);
CREATE INDEX email_logs_quote_id_idx   ON email_logs(quote_id);

-- ── Helpful Views ─────────────────────────────────────────────
-- Subtotal (ex VAT), VAT amount, and grand total for each quote
CREATE OR REPLACE VIEW quote_totals AS
SELECT
  q.id                                          AS quote_id,
  COALESCE(SUM(li.quantity * li.unit_price), 0) AS subtotal,
  COALESCE(SUM(li.quantity * li.unit_price), 0)
    * (q.vat_rate / 100)                        AS vat_amount,
  COALESCE(SUM(li.quantity * li.unit_price), 0)
    * (1 + q.vat_rate / 100)                    AS total
FROM quotes q
LEFT JOIN line_items li ON li.quote_id = q.id
GROUP BY q.id, q.vat_rate;
