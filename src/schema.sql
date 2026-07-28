-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_address TEXT,
    amount NUMERIC NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'partially_paid', 'paid')),
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
    amount NUMERIC NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    tax_cents INTEGER NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'accepted', 'rejected', 'converted_to_invoice')),
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
    quantity NUMERIC NOT NULL,
    rate NUMERIC NOT NULL,
    rate_cents INTEGER NOT NULL DEFAULT 0,
    amount NUMERIC NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
);

-- Payments table (tracks full and partial payments; drives receipts)
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    payment_date DATE,
    payment_method TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id)
);

-- Audit table (append-only operational history)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    entity_number TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Company profile/settings table (single-row operational profile)
CREATE TABLE IF NOT EXISTS company_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    company_name TEXT NOT NULL,
    registration_number TEXT,
    vat_number TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    branch_code TEXT,
    currency TEXT NOT NULL DEFAULT 'ZAR',
    default_tax_rate NUMERIC NOT NULL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CRM leads table
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    source TEXT,
    stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new', 'qualified', 'meeting', 'requirements', 'proposal', 'won', 'lost')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    estimated_value NUMERIC NOT NULL DEFAULT 0,
    estimated_value_cents INTEGER NOT NULL DEFAULT 0,
    next_follow_up DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Project delivery table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    project_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    client_name TEXT,
    status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    owner TEXT,
    start_date DATE,
    due_date DATE,
    budget NUMERIC NOT NULL DEFAULT 0,
    budget_cents INTEGER NOT NULL DEFAULT 0,
    progress INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Document control table
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT,
    owner TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'archived')),
    version TEXT NOT NULL DEFAULT '1.0',
    review_date DATE,
    linked_type TEXT,
    linked_id TEXT,
    location_url TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User management foundation. Authentication still uses the existing admin
-- password/session flow; this table tracks roles and access areas.
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    department TEXT,
    permissions TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices (status);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices (created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_client_email ON invoices (client_email);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes (status);

CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes (created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at);

CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads (stage);

CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads (next_follow_up);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);

CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects (due_date);

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);

CREATE INDEX IF NOT EXISTS idx_documents_review_date ON documents (review_date);

CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members (email);
