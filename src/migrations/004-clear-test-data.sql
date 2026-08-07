-- 004 — Clear test data, keeping the invoice sequence intact
--
--   npx wrangler d1 execute invoicing --remote --file src/migrations/004-clear-test-data.sql
--
-- Supersedes the commented-out DELETE blocks in 002, which offered a
-- straight deletion of all eight test rows. This does something narrower
-- and more defensible.
--
-- What is deleted, and why:
--
--   4 questionnaires   Form-test submissions. They record nothing that
--                      happened, so there is nothing to preserve. Identified
--                      from their own answers: mydomain.com is a placeholder,
--                      "Money" is not a business purpose, "Xes" and
--                      "producrts" are typos, none has a lead attached.
--
--   2 payments         R50 each against the test invoice. No money moved.
--                      The payments table has no status column and is summed
--                      into revenue in five places in the Worker, so there is
--                      no way to neutralise them short of removing them.
--                      Leaving them would overstate income by R100.
--
-- What is NOT deleted:
--
--   INV-2026-7594BD00  Cancelled rather than deleted, so the invoice number
--                      sequence has no gap. A missing number is the first
--                      thing an auditor asks about, and "it was a test" is a
--                      much better answer when the invoice is still there to
--                      show them.
--
--   The client row     Gerald Rushwaya is kept. The cancelled invoice
--                      references it, and deleting it would leave that
--                      reference dangling. It is a real person in any case.

-- ------------------------------------------------------------
-- 1. Test questionnaires
-- ------------------------------------------------------------

DELETE FROM lead_questionnaires
 WHERE token IN (
   'Vhu5IfNCD2IPTzJaqc8vv7AXZa2qllhwuwpKsQ-vBSY',
   'y4auMkmmPQLy1Wepb9oYqAaZvX8BDYX6AJP5G3LVaug',
   '_b_8yEKSHFgNNN0E0ZOvML4yoPsns9ij9KA8Uu7RN9Y',
   'z2eFdV2yM8Uqi9XUnvQFspVmk8UUUkUh_RQp5u9Mhww'
 );

-- vFhNZXFnx3u_wcR_uPiImbyXhepEJBqxsM6QzsDP5oc is deliberately absent.
-- Sent 2026-07-30, never submitted, no lead attached. Confirm whether it
-- went to a real prospect before removing it.

-- ------------------------------------------------------------
-- 2. Phantom payments
-- ------------------------------------------------------------

DELETE FROM payments
 WHERE invoice_id IN (
   SELECT id FROM invoices WHERE invoice_number = 'INV-2026-7594BD00'
 );

-- ------------------------------------------------------------
-- 3. Cancel the test invoice
-- ------------------------------------------------------------

UPDATE invoices
   SET status = 'cancelled',
       closed_reason = 'Test invoice raised during system verification on 2026-07-29. No goods or services were supplied and no payment was received. The two R50 payments recorded against it were test entries and have been removed. Retained rather than deleted so the invoice number sequence is unbroken.',
       closed_at = datetime('now')
 WHERE invoice_number = 'INV-2026-7594BD00';
