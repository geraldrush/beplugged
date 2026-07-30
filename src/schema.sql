-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
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
    lead_id TEXT,
    client_id TEXT,
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
    lead_id TEXT,
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

CREATE TABLE IF NOT EXISTS crm_contacts (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    client_id TEXT,
    client_email TEXT,
    client_name TEXT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT,
    is_primary INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crm_activities (
    id TEXT PRIMARY KEY,
    lead_id TEXT,
    client_id TEXT,
    client_email TEXT,
    client_name TEXT,
    contact_id TEXT,
    activity_type TEXT NOT NULL DEFAULT 'note' CHECK (activity_type IN ('note', 'call', 'meeting', 'email', 'whatsapp', 'follow_up', 'task')),
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned', 'completed', 'cancelled')),
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    occurred_at DATE,
    completed_at DATE,
    owner TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Requirements capture table
CREATE TABLE IF NOT EXISTS requirements (
    id TEXT PRIMARY KEY,
    requirement_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    contact_name TEXT,
    template TEXT NOT NULL DEFAULT 'website' CHECK (template IN ('website', 'erp', 'crm', 'mobile_app', 'ecommerce', 'ai_project', 'government_project', 'training_platform', 'school_system', 'custom')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'discovery', 'review', 'approved', 'converted')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    owner TEXT,
    due_date DATE,
    goals TEXT,
    scope TEXT,
    constraints TEXT,
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

-- Quality management table (ISO 9001 evidence and action records)
CREATE TABLE IF NOT EXISTS quality_records (
    id TEXT PRIMARY KEY,
    record_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    record_type TEXT NOT NULL DEFAULT 'policy' CHECK (record_type IN ('policy', 'sop', 'work_instruction', 'template', 'register', 'internal_audit', 'external_audit', 'corrective_action', 'preventive_action', 'non_conformity', 'customer_feedback', 'management_review', 'kpi', 'continuous_improvement', 'record', 'lesson_learned')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'review', 'closed', 'archived')),
    owner TEXT,
    project_name TEXT,
    due_date DATE,
    review_date DATE,
    evidence_url TEXT,
    description TEXT,
    notes TEXT,
    body TEXT, -- the document itself, in Markdown
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Information security table (ISO 27001 assets, risks, controls, incidents)
CREATE TABLE IF NOT EXISTS security_records (
    id TEXT PRIMARY KEY,
    record_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    record_type TEXT NOT NULL DEFAULT 'risk' CHECK (record_type IN ('asset', 'asset_register', 'risk', 'risk_assessment', 'access_control', 'password_management', 'security_incident', 'vulnerability', 'business_continuity', 'disaster_recovery', 'backup', 'recovery_test', 'security_awareness', 'risk_register', 'access_review')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assessing', 'active', 'mitigated', 'closed', 'archived')),
    risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    owner TEXT,
    asset_name TEXT,
    due_date DATE,
    review_date DATE,
    evidence_url TEXT,
    description TEXT,
    mitigation TEXT,
    notes TEXT,
    body TEXT, -- the document itself, in Markdown
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

-- Client intake questionnaires, reached by an unguessable per-lead token
CREATE TABLE IF NOT EXISTS lead_questionnaires (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'submitted')),
    answers TEXT, -- JSON of the submitted answers
    submitted_at DATETIME,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES leads (id)
);

-- Scope confirmations signed by the client. A signed row is never edited;
-- later changes are issued as an addendum referencing the original.
CREATE TABLE IF NOT EXISTS scope_agreements (
    id TEXT PRIMARY KEY,
    agreement_number TEXT NOT NULL UNIQUE,
    parent_id TEXT,                -- the original, for addenda
    version INTEGER NOT NULL DEFAULT 1,
    title TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    project_name TEXT,
    linked_type TEXT,
    linked_id TEXT,                -- the project it governs
    requirement_id TEXT,           -- the requirement it was drafted from
    body TEXT NOT NULL,            -- the document, in Markdown
    body_hash TEXT,                -- sha256 of body at the moment it was sent
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'signed', 'declined', 'void')),
    token TEXT UNIQUE,
    sent_at DATETIME,
    signed_name TEXT,
    signed_at DATETIME,
    signed_ip TEXT,
    signed_user_agent TEXT,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Milestones are what the client sees; tasks are the internal checklist
CREATE TABLE IF NOT EXISTS project_milestones (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'done', 'blocked')),
    position INTEGER NOT NULL DEFAULT 0,
    due_date DATE,
    completed_at DATETIME,
    source_type TEXT,              -- 'agreement' when created by a signature
    source_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE TABLE IF NOT EXISTS milestone_tasks (
    id TEXT PRIMARY KEY,
    milestone_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'done', 'blocked')),
    position INTEGER NOT NULL DEFAULT 0,
    owner TEXT,
    due_date DATE,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (milestone_id) REFERENCES project_milestones (id)
);

CREATE TABLE IF NOT EXISTS project_risks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    title TEXT NOT NULL,
    risk_level TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'monitoring', 'mitigated', 'closed')),
    owner TEXT,
    due_date DATE,
    impact TEXT,
    mitigation TEXT,
    contingency TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE TABLE IF NOT EXISTS business_records (
    id TEXT PRIMARY KEY,
    record_number TEXT NOT NULL UNIQUE,
    record_type TEXT NOT NULL CHECK (record_type IN ('branch', 'department', 'cost_centre', 'proposal', 'contract', 'project_issue', 'change_request', 'testing_deployment', 'expense', 'credit_note', 'purchase_order', 'supplier', 'vat_report', 'support_ticket', 'tender', 'partner', 'cloud_management', 'training', 'knowledge_base', 'ai_assistant', 'executive_report')),
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft', 'open', 'pending', 'active', 'in_progress', 'submitted', 'approved', 'completed', 'closed', 'archived', 'cancelled')),
    owner TEXT,
    organization_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    category TEXT,
    audience_type TEXT,
    seats INTEGER NOT NULL DEFAULT 0,
    amount NUMERIC NOT NULL DEFAULT 0,
    amount_cents INTEGER NOT NULL DEFAULT 0,
    start_date DATE,
    due_date DATE,
    review_date DATE,
    reference TEXT,
    linked_type TEXT,
    linked_id TEXT,
    location TEXT,
    description TEXT,
    notes TEXT,
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

CREATE INDEX IF NOT EXISTS idx_crm_contacts_lead_id ON crm_contacts (lead_id);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_client_id ON crm_contacts (client_id);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_client_email ON crm_contacts (client_email);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead_id ON crm_activities (lead_id);

CREATE INDEX IF NOT EXISTS idx_crm_activities_client_id ON crm_activities (client_id);

CREATE INDEX IF NOT EXISTS idx_crm_activities_client_email ON crm_activities (client_email);

CREATE INDEX IF NOT EXISTS idx_crm_activities_status_due ON crm_activities (status, due_date);

CREATE INDEX IF NOT EXISTS idx_clients_lead_id ON clients (lead_id);

CREATE INDEX IF NOT EXISTS idx_quotes_lead_id ON quotes (lead_id);

CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes (client_id);

CREATE INDEX IF NOT EXISTS idx_invoices_lead_id ON invoices (lead_id);

CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices (client_id);

CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices (quote_id);

CREATE INDEX IF NOT EXISTS idx_requirements_status ON requirements (status);

CREATE INDEX IF NOT EXISTS idx_requirements_due_date ON requirements (due_date);

CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);

CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects (due_date);

CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);

CREATE INDEX IF NOT EXISTS idx_documents_review_date ON documents (review_date);

CREATE INDEX IF NOT EXISTS idx_quality_records_type ON quality_records (record_type);

CREATE INDEX IF NOT EXISTS idx_quality_records_status ON quality_records (status);

CREATE INDEX IF NOT EXISTS idx_quality_records_review_date ON quality_records (review_date);

CREATE INDEX IF NOT EXISTS idx_security_records_type ON security_records (record_type);

CREATE INDEX IF NOT EXISTS idx_security_records_status ON security_records (status);

CREATE INDEX IF NOT EXISTS idx_security_records_risk_level ON security_records (risk_level);

CREATE INDEX IF NOT EXISTS idx_security_records_review_date ON security_records (review_date);

CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members (email);

CREATE INDEX IF NOT EXISTS idx_lead_questionnaires_lead ON lead_questionnaires (lead_id);

CREATE INDEX IF NOT EXISTS idx_scope_agreements_parent ON scope_agreements (parent_id);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones (project_id);

CREATE INDEX IF NOT EXISTS idx_tasks_milestone ON milestone_tasks (milestone_id);

CREATE INDEX IF NOT EXISTS idx_project_risks_project ON project_risks (project_id);

CREATE INDEX IF NOT EXISTS idx_project_risks_status ON project_risks (status);

CREATE INDEX IF NOT EXISTS idx_project_risks_level ON project_risks (risk_level);

CREATE INDEX IF NOT EXISTS idx_business_records_type ON business_records (record_type);

CREATE INDEX IF NOT EXISTS idx_business_records_status ON business_records (status);

CREATE INDEX IF NOT EXISTS idx_business_records_due ON business_records (due_date);
