-- 007 — Schema version stamp
--
--   npx wrangler d1 execute invoicing --remote --file src/migrations/007-schema-state.sql
--
-- Setting up the schema was costing more than everything else this database
-- did. runSchemaSetup is 68 DDL statements, 29 PRAGMA table_info reads and 6
-- seed counts, each a separate round trip, run in sequence. It was cached per
-- isolate, which sounds like enough until you notice how often Cloudflare
-- makes a new isolate: in practice it ran again and again, all day, and put
-- roughly seventeen seconds in front of the first byte on a cold start.
--
-- This table is how it stops. The Worker stamps the version it has applied,
-- reads that stamp on the first request an isolate serves, and does nothing
-- further when it matches. Steady state is one indexed read instead of a
-- hundred round trips.
--
-- The Worker creates this table itself in runSchemaSetup, so this file exists
-- for a database being brought up to date directly.

CREATE TABLE IF NOT EXISTS schema_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
