-- 006 — Studio orders
--
--   npx wrangler d1 execute invoicing --remote --file src/migrations/006-studio-orders.sql
--
-- BePlugged Studio lets a customer build their own hardcover photobook at
-- /studio/editor and send it in. Two tables carry that.
--
-- studio_orders holds the order and the design. The design is the small part:
-- a JSON document saying which photo sits in which frame on which page, at
-- what crop, with what caption. It is a few kilobytes and belongs in D1 next
-- to the customer's name and the date they need the book.
--
-- The photos themselves do not. They are print originals — a 40-page wedding
-- book is comfortably larger than this entire database — so they go to the
-- beplugged-studio R2 bucket, and studio_order_photos is the index that turns
-- a photo id in the design back into an object the studio can open.
--
-- The order row is written BEFORE the photos upload, which is deliberate.
-- Uploading forty full-resolution images over a phone connection is the step
-- most likely to fail, and an order that dies there still leaves a name, an
-- email and a book to talk about rather than nothing. Those sit at
-- 'awaiting_photos' until the upload finishes and the customer confirms, at
-- which point the status becomes 'new' and the email goes out.
--
-- The Worker creates both tables itself on first use (runSchemaSetup), so
-- this file exists for a database being brought up to date directly.

CREATE TABLE IF NOT EXISTS studio_orders (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'awaiting_photos',
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    occasion TEXT,
    product_size TEXT NOT NULL,
    page_count INTEGER NOT NULL DEFAULT 0,
    copies INTEGER NOT NULL DEFAULT 1,
    needed_by TEXT,
    notes TEXT,
    design_json TEXT NOT NULL,
    photo_count INTEGER NOT NULL DEFAULT 0,
    photo_bytes INTEGER NOT NULL DEFAULT 0,
    uploaded_count INTEGER NOT NULL DEFAULT 0,
    uploaded_bytes INTEGER NOT NULL DEFAULT 0,
    media_prefix TEXT NOT NULL,
    -- Only the hash. The token itself is handed to the browser once, on
    -- creation, and is the only thing that authorises an upload into this
    -- order's prefix. Storing it in the clear would mean a read of this table
    -- was enough to write into any customer's book.
    upload_token_hash TEXT NOT NULL,
    submitted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_studio_orders_status ON studio_orders (status, created_at);

CREATE TABLE IF NOT EXISTS studio_order_photos (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    photo_id TEXT NOT NULL,
    file_name TEXT,
    content_type TEXT,
    bytes INTEGER NOT NULL DEFAULT 0,
    width INTEGER,
    height INTEGER,
    r2_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_studio_photos_order ON studio_order_photos (order_id);
