-- 003 — Onboarding records
--
--   npx wrangler d1 execute invoicing --remote --file src/migrations/003-onboarding-records.sql
--
-- ONE record, not six.
--
-- The database holds six questionnaires. Four of them are test submissions
-- made while building the form, identifiable from their own answers:
--
--   Vhu5If...  "domain_access":"Xes"
--   y4auMk...  "purpose":"Sell producrts",  domain https://mydomain.com
--   _b_8yE...  "purpose":"Money",           domain https://mydomain.com
--   z2eFdV...  "purpose":"Sell", "pages":"Home", "logo_files":"Na"
--
-- mydomain.com is a placeholder and "Money" is not a business purpose. None
-- has a lead attached. Creating onboarding records from them would be
-- manufacturing audit evidence out of test data, which is the thing
-- migration 002 exists to prevent. They are removed there instead.
--
-- A fifth, vFhNZX..., was sent on 2026-07-30 with no lead attached and never
-- submitted. Confirm whether it went to a real prospect before deleting it.
--
-- That leaves one genuine engagement: KIMTOV MEDIA.

INSERT INTO quality_records (
    id, record_number, title, record_type, status,
    owner, project_name, review_date, evidence_url, description, notes
) VALUES (
    'qr-cli-kimtov-20260803',
    'REC-CLI-001',
    'Client onboarding — KIMTOV MEDIA',
    'record',
    'active',
    'Gerald Rushwaya',
    'KIMTOV MEDIA',
    '2026-08-17',
    '/api/questionnaire/bQYuxJt6ucf4CzRky97xyM5EAhws6TUD-oMfmLc5bOY',
    'Requirements capture per SOP-CLI-001. Questionnaire issued to TONDE at KIMTOV MEDIA on 2026-08-03, awaiting submission. First engagement onboarded under SOP-CLI-001 since it came into use on 2026-07-28.',
    'Closes when the questionnaire is submitted and the scope agreement signed. Chase if not submitted by 2026-08-17.'
);


-- ------------------------------------------------------------
-- The four clients who predate the procedure
-- ------------------------------------------------------------
--
-- Victor, Wilson Manica, African Centre for Training institute and Amana
-- Units are real engagements with real invoices, and none has a
-- questionnaire. They were onboarded before SOP-CLI-001 existed.
--
-- This needs no fixing and no apology. A procedure cannot produce records
-- for work done before it was written, and no auditor expects it to. What
-- an auditor does want is for the boundary to be stated rather than left
-- as an unexplained hole in the record.
--
-- One record says it, once, for all four.

INSERT INTO quality_records (
    id, record_number, title, record_type, status,
    owner, description, notes
) VALUES (
    'qr-cli-pre-sop-20260728',
    'REC-CLI-000',
    'Engagements predating SOP-CLI-001',
    'record',
    'closed',
    'Gerald Rushwaya',
    'SOP-CLI-001 came into use on 2026-07-28. Four client engagements were in progress or complete before that date and therefore have no questionnaire or scope agreement of the kind the procedure now requires: Victor, Wilson Manica, African Centre for Training institute, Amana Units (Pty) LTD. Evidence for those engagements is the invoice and quote record in the system.',
    'Recorded so the absence of onboarding records for these four is explained rather than unexplained. Any further work for them is onboarded under SOP-CLI-001 as a new engagement.'
);
