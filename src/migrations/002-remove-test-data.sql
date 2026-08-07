-- 002 — Remove test data created while building the system
--
-- READ THIS BEFORE RUNNING IT.
--
-- The records below were created by the owner to test the system. They are
-- not records of any client engagement, so removing them is housekeeping
-- rather than the destruction of a record.
--
-- This distinction matters and is worth being deliberate about:
--
--   Test data     invented, describes nothing that happened.  May be deleted.
--   Real record   evidence that something happened.           Never deleted.
--
-- A real invoice that will not be paid is written off under migration 001,
-- with a reason and a date. It is not deleted. Deleting a financial record
-- is a SARS problem as well as an ISO 9001 one, and an auditor who finds a
-- gap in an invoice number sequence will ask about it.
--
-- BEFORE RUNNING:
--
--   1. Take a backup. This cannot be undone.
--        npx wrangler d1 export invoicing --remote --output backup-before-002.sql
--
--   2. Run the SELECT block below FIRST and read what comes back. Confirm
--      every row is genuinely test data before deleting anything.
--
--   3. Only then run the DELETE block.


-- ============================================================
-- STEP 1 — LOOK FIRST. Run this on its own.
-- ============================================================

SELECT 'invoice' AS kind, invoice_number AS ref, client_name AS who, amount AS detail, date(created_at) AS created
  FROM invoices
 WHERE client_name = 'Gerald Rushwaya'
UNION ALL
SELECT 'payment', id, invoice_id, amount, date(created_at)
  FROM payments
 WHERE invoice_id IN (SELECT id FROM invoices WHERE client_name = 'Gerald Rushwaya')
UNION ALL
SELECT 'client', id, name, email, date(created_at)
  FROM clients
 WHERE name = 'Gerald Rushwaya'
UNION ALL
SELECT 'quote', quote_number, client_name, amount, date(created_at)
  FROM quotes
 WHERE client_name = 'Gerald Rushwaya';


-- ============================================================
-- STEP 2 — DELETE. Only after reading Step 1's output.
--
-- Uncomment the statements below to run them. They are commented out
-- deliberately so that executing this file by accident does nothing.
--
-- Order matters: children before parents.
-- ============================================================

-- DELETE FROM payments
--  WHERE invoice_id IN (SELECT id FROM invoices WHERE client_name = 'Gerald Rushwaya');

-- DELETE FROM invoices
--  WHERE client_name = 'Gerald Rushwaya';

-- DELETE FROM quotes
--  WHERE client_name = 'Gerald Rushwaya';

-- DELETE FROM clients
--  WHERE name = 'Gerald Rushwaya';


-- ============================================================
-- STEP 3 — Anything else that was test data
--
-- Add further blocks here for any other test client, following the same
-- pattern: SELECT first, delete second. Do not widen the WHERE clause to
-- something like "created before date X" — that will take real records with
-- it.
-- ============================================================
