-- 001 — Give an invoice somewhere to end up
--
-- The invoices table allowed only draft, sent, viewed, partially_paid and
-- paid. There was no way to record an invoice that will never be paid, so a
-- cold invoice sat at 'viewed' indefinitely and the outstanding total was
-- permanently wrong.
--
-- Adds three states and the reason behind them:
--
--   overdue      past its due date and unpaid. Still expected to be collected
--   cancelled    withdrawn by us, e.g. wrong invoice, work not proceeding
--   written_off  the client will not pay and collection has been abandoned
--
-- Nothing is deleted. An invoice that is written off stays in the table with
-- the reason and the date recorded, because it is a financial record and is
-- retained per DOC-001 §8 and SARS requirements.
--
-- SQLite cannot alter a CHECK constraint, so the table is rebuilt. Run this
-- once, against a database you have just backed up.
--
--   npx wrangler d1 export invoicing --remote --output backup-before-001.sql
--   npx wrangler d1 execute invoicing --remote --file src/migrations/001-invoice-lifecycle.sql

PRAGMA foreign_keys = OFF;

CREATE TABLE invoices_new (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    lead_id TEXT,
    client_id TEXT,
    quote_id TEXT,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_address TEXT,
    amount NUMERIC NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft', 'sent', 'viewed', 'partially_paid', 'paid',
        'overdue', 'cancelled', 'written_off'
    )),
    -- Why it was cancelled or written off, and when. Required by SOP-FIN-001
    -- before either status may be set: an invoice closed without a reason is
    -- indistinguishable from one lost by accident.
    closed_reason TEXT,
    closed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    payment_terms TEXT,
    items TEXT,
    notes TEXT,
    qr_code_url TEXT
);

INSERT INTO invoices_new (
    id, invoice_number, lead_id, client_id, quote_id,
    client_name, client_email, client_address,
    amount, amount_cents, tax, tax_cents, status,
    created_at, due_date, payment_terms, items, notes, qr_code_url
)
SELECT
    id, invoice_number, lead_id, client_id, quote_id,
    client_name, client_email, client_address,
    amount, amount_cents, tax, tax_cents, status,
    created_at, due_date, payment_terms, items, notes, qr_code_url
FROM invoices;

DROP TABLE invoices;
ALTER TABLE invoices_new RENAME TO invoices;

-- Mark anything already past its due date and unpaid. This is a statement of
-- fact about existing rows, not a change of meaning.
UPDATE invoices
   SET status = 'overdue'
 WHERE status IN ('sent', 'viewed')
   AND due_date IS NOT NULL
   AND date(due_date) < date('now');

PRAGMA foreign_keys = ON;
