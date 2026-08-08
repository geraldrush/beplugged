-- 005 — Remove the THE SPART test project
--
--   npx wrangler d1 execute invoicing --remote --file src/migrations/005-remove-spart-test-project.sql
--
-- "The Online Shop", client "THE SPART", created 2026-07-29 and marked
-- completed. Confirmed by the owner as a test of the project and feedback
-- workflow rather than a client engagement.
--
-- No invoice, quote or client row references it — THE SPART appears nowhere
-- in clients, invoices, quotes or leads. It exists only as a project and the
-- customer-feedback record raised against it, which is consistent with
-- someone exercising the feedback flow.
--
-- Everything is scoped to the exact project id. Nothing is matched on a name
-- or a date range, so this cannot take a real project with it.
--
-- Take a backup first if the one from 2026-08-07 is no longer current:
--   npx wrangler d1 export invoicing --remote --output backup-before-005.sql

-- ------------------------------------------------------------
-- Look first. Run this block alone and read the counts.
-- ------------------------------------------------------------

SELECT 'project'      AS kind, COUNT(*) AS n FROM projects           WHERE id         = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830'
UNION ALL SELECT 'milestone',  COUNT(*)      FROM project_milestones WHERE project_id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830'
UNION ALL SELECT 'risk',       COUNT(*)      FROM project_risks      WHERE project_id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830'
UNION ALL SELECT 'requirement',COUNT(*)      FROM requirements       WHERE project_id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830'
UNION ALL SELECT 'document',   COUNT(*)      FROM documents          WHERE project_id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830'
UNION ALL SELECT 'feedback',   COUNT(*)      FROM quality_records    WHERE record_number = 'QMS-2026-09BD2237';

-- ------------------------------------------------------------
-- Delete. Children before parents.
--
-- milestone_tasks is reached through project_milestones, so it goes first.
-- ------------------------------------------------------------

DELETE FROM milestone_tasks
 WHERE milestone_id IN (
   SELECT id FROM project_milestones
    WHERE project_id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830'
 );

DELETE FROM project_milestones
 WHERE project_id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830';

DELETE FROM project_risks
 WHERE project_id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830';

DELETE FROM requirements
 WHERE project_id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830';

DELETE FROM documents
 WHERE project_id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830';

DELETE FROM projects
 WHERE id = 'project_182db3b7-b44d-4cc8-b541-d067a7ba9830';

-- The customer-feedback record raised against it. Deleted rather than kept
-- because it is feedback nobody gave — leaving it would put an invented
-- entry into the evidence for clause 9.1.2, which is worse than having one
-- fewer.

DELETE FROM quality_records
 WHERE record_number = 'QMS-2026-09BD2237';
