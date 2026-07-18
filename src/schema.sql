-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_address TEXT,
    amount REAL NOT NULL,
    tax REAL DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, sent, viewed, partially_paid, paid
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    due_date DATE,
    payment_terms TEXT,
    items TEXT, -- JSON string of line items
    notes TEXT,
    qr_code_url TEXT
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
    id TEXT PRIMARY KEY,
    quote_number TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_address TEXT,
    amount REAL NOT NULL,
    tax REAL DEFAULT 0,
    status TEXT DEFAULT 'draft', -- draft, sent, viewed, accepted, rejected, converted_to_invoice
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATE,
    items TEXT, -- JSON string of line items
    notes TEXT,
    qr_code_url TEXT
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity REAL NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
);

-- Payments table (tracks full and partial payments; drives receipts)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payment_date DATE,
    payment_method TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices (created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_client_email ON invoices (client_email);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes (status);

CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes (created_at);