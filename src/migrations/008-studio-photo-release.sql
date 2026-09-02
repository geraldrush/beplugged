-- 008 — Studio photo release marker
--
--   npx wrangler d1 execute invoicing --remote --file src/migrations/008-studio-photo-release.sql
--
-- Completed photobook orders keep the order record and design, but the
-- original customer uploads can be released from R2 after production. This
-- timestamp lets the admin and customer views distinguish released files from
-- uploads that never arrived.

ALTER TABLE studio_orders ADD COLUMN photos_released_at DATETIME;
