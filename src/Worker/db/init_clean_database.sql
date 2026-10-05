-- ==============================================================================
-- FREELANCER EVIDENCE & BILLING HUB - CLOUDFLARE D1 RELATIONAL SCHEMA (PURE DDL)
-- Version: 2.15.0 LTS (Revisionssicher, GoBD, Multi-Stage Projects, Strict DDL)
-- WICHTIG: DIESE DATEI ENTHÄLT AUSSCHLIESSLICH TABELLENSTRUKTUREN (CREATE TABLE)
-- KEINE DUMMY- ODER DEMODATEN (ZERO INSERTS).
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- 1. Kundenstammdaten
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    lexware_contact_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    street TEXT,
    zip_code TEXT,
    city TEXT,
    country_code TEXT DEFAULT 'DE',
    vat_id TEXT,
    customer_number TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT
);

-- 2. Projekte & Vertragsparameter (3-Stufen-Hierarchie & Budgetmodi)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    project_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    end_customer_name TEXT,
    purchase_order_number TEXT,
    contract_number TEXT,
    default_hourly_rate REAL NOT NULL DEFAULT 120.00,
    planned_hours REAL NOT NULL DEFAULT 0.0,
    total_budget_net REAL NOT NULL DEFAULT 0.0,
    travel_budget_net REAL NOT NULL DEFAULT 0.0,
    travel_budget_mode TEXT NOT NULL DEFAULT 'Dedicated',
    budget_mode TEXT NOT NULL DEFAULT 'Dedicated',
    hierarchy_level INTEGER NOT NULL DEFAULT 1,
    parent_project_id TEXT,
    start_date TEXT,
    end_date TEXT,
    lexware_service_article_id TEXT NOT NULL,
    billing_interval_minutes INTEGER NOT NULL DEFAULT 15,
    approver_email TEXT NOT NULL,
    approver_name TEXT,
    approver_2_email TEXT,
    approver_2_name TEXT,
    approver_3_email TEXT,
    approver_3_name TEXT,
    travel_time_billable INTEGER NOT NULL DEFAULT 0,
    travel_time_rate_multiplier REAL NOT NULL DEFAULT 1.0,
    public_transit_reimbursable INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_archived INTEGER NOT NULL DEFAULT 0,
    lexware_quotation_id TEXT,
    lexware_quotation_number TEXT,
    lexware_quotation_status TEXT DEFAULT 'open',
    lexware_order_confirmation_id TEXT,
    lexware_order_confirmation_status TEXT DEFAULT 'open',
    description TEXT,
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- 3. Stundenzettel-Versionen (GoBD: Unveränderbar nach Freigabe)
CREATE TABLE IF NOT EXISTS timesheet_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    period TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Draft',
    total_actual_hours REAL NOT NULL DEFAULT 0.0,
    total_billable_hours REAL NOT NULL DEFAULT 0.0,
    total_billable_travel_hours REAL NOT NULL DEFAULT 0.0,
    total_reimbursable_expenses REAL NOT NULL DEFAULT 0.0,
    total_amount_net REAL NOT NULL DEFAULT 0.0,
    data_hash_sha256 TEXT NOT NULL,
    pdf_hash_sha256 TEXT,
    pdf_r2_storage_key TEXT,
    xlsx_hash_sha256 TEXT,
    xlsx_r2_storage_key TEXT,
    pdf_frozen_hash TEXT,
    frozen_at_utc TEXT,
    created_at_utc TEXT NOT NULL,
    submitted_at_utc TEXT,
    approved_at_utc TEXT,
    approved_by TEXT,
    approval_method TEXT,
    rejection_reason TEXT,
    lexware_invoice_id TEXT,
    lexware_invoice_number TEXT,
    is_invoice_canceled INTEGER NOT NULL DEFAULT 0,
    invoice_canceled_at_utc TEXT,
    external_invoice_number TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    UNIQUE (project_id, period, version_number)
);

-- 4. Zeiterfassungs-Einträge
CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    timesheet_version_id TEXT,
    entry_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    break_minutes INTEGER NOT NULL DEFAULT 0,
    actual_duration_hours REAL NOT NULL,
    billable_duration_hours REAL NOT NULL,
    category TEXT NOT NULL DEFAULT 'Architecture',
    location TEXT NOT NULL DEFAULT 'Remote',
    short_description TEXT NOT NULL,
    task_or_ticket_reference TEXT,
    is_billable INTEGER NOT NULL DEFAULT 1,
    billing_type TEXT NOT NULL DEFAULT 'Billable',
    billing_rate_snapshot REAL NOT NULL,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE SET NULL
);

-- 5. § 18 EStG & Fachliche Tätigkeitsnachweise
CREATE TABLE IF NOT EXISTS activity_evidences (
    id TEXT PRIMARY KEY,
    time_entry_id TEXT NOT NULL UNIQUE,
    problem_statement TEXT NOT NULL,
    methodology TEXT NOT NULL,
    technical_activity TEXT NOT NULL,
    result TEXT NOT NULL,
    responsibility TEXT NOT NULL,
    deliverable TEXT,
    created_at_utc TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (time_entry_id) REFERENCES time_entries(id) ON DELETE CASCADE
);

-- 6. Reisen & Dienstreisen
CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    trip_date TEXT NOT NULL,
    return_date TEXT,
    purpose TEXT NOT NULL,
    start_location TEXT NOT NULL,
    end_location TEXT NOT NULL,
    travel_type TEXT DEFAULT 'BusinessTrip',
    expense_type TEXT NOT NULL DEFAULT 'PublicTransit',
    origin TEXT,
    destination TEXT,
    origin_address TEXT,
    destination_address TEXT,
    contact_person TEXT,
    departure_time TEXT,
    arrival_time TEXT,
    distance_km REAL NOT NULL DEFAULT 0.0,
    rate_per_km REAL NOT NULL DEFAULT 0.30,
    ticket_cost REAL DEFAULT 0.0,
    hotel_cost REAL DEFAULT 0.0,
    parking_cost REAL DEFAULT 0.0,
    vma_amount REAL DEFAULT 0.0,
    has_breakfast INTEGER DEFAULT 0,
    total_days INTEGER DEFAULT 1,
    is_billable_to_client INTEGER DEFAULT 1,
    is_internal_expense_only INTEGER DEFAULT 0,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- 7. Detaillierte Reiseetappen (Rundreisen & BMF-Auslandspauschalen)
CREATE TABLE IF NOT EXISTS trip_legs (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    leg_order INTEGER NOT NULL DEFAULT 1,
    start_point TEXT NOT NULL,
    end_point TEXT NOT NULL,
    distance_km REAL NOT NULL DEFAULT 0.0,
    departure_time TEXT,
    arrival_time TEXT,
    transport_mode TEXT NOT NULL DEFAULT 'Car',
    country_code TEXT DEFAULT 'DE',
    bmf_city_name TEXT,
    rate_per_km REAL NOT NULL DEFAULT 0.30,
    calculated_amount REAL NOT NULL DEFAULT 0.0,
    notes TEXT,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- 8. Reise-Belege & Spesen
CREATE TABLE IF NOT EXISTS trip_expenses (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    expense_date TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    skr04_account TEXT NOT NULL,
    amount_gross REAL NOT NULL,
    amount_net REAL NOT NULL,
    tax_rate REAL NOT NULL,
    tax_amount REAL NOT NULL,
    receipt_r2_key TEXT,
    receipt_filename TEXT,
    receipt_mime_type TEXT,
    is_billable_to_client INTEGER NOT NULL DEFAULT 1,
    is_synced_to_lexware INTEGER NOT NULL DEFAULT 0,
    lexware_voucher_id TEXT,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- 9. Allgemeine Belege (Quittungen / Anhänge)
CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    timesheet_version_id TEXT,
    receipt_date TEXT NOT NULL,
    category TEXT NOT NULL,
    amount_gross REAL NOT NULL,
    amount_net REAL NOT NULL,
    vat_rate REAL NOT NULL,
    vat_amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    r2_storage_key TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE SET NULL
);

-- 10. Kunden-Freigaben & Signaturen
CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    timesheet_version_id TEXT NOT NULL,
    approver_name TEXT NOT NULL,
    approver_email TEXT NOT NULL,
    approver_ip TEXT,
    user_agent TEXT,
    signature_data_url TEXT,
    approved_at_utc TEXT NOT NULL,
    otp_code TEXT,
    FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE RESTRICT
);

-- 11. Globale Systemeinstellungen
CREATE TABLE IF NOT EXISTS app_settings (
    id TEXT PRIMARY KEY,
    mileage_rate_business REAL NOT NULL DEFAULT 0.30,
    commute_rate_tier1 REAL NOT NULL DEFAULT 0.30,
    commute_rate_tier2 REAL NOT NULL DEFAULT 0.38,
    vma_rate_8h REAL NOT NULL DEFAULT 14.00,
    vma_rate_24h REAL NOT NULL DEFAULT 28.00,
    pdf_storage_mode TEXT NOT NULL DEFAULT 'R2',
    updated_at_utc TEXT NOT NULL,
    email_sender_name TEXT,
    email_sender_email TEXT,
    email_service TEXT,
    email_api_key TEXT,
    email_subject_template TEXT,
    email_body_template TEXT,
    email_reminder1_subject TEXT,
    email_reminder1_body TEXT,
    email_reminder2_subject TEXT,
    email_reminder2_body TEXT,
    email_admin_notify_rejection INTEGER DEFAULT 1,
    email_admin_notify_reminder INTEGER DEFAULT 1,
    contractor_signature_data_url TEXT,
    contractor_title TEXT,
    billing_provider TEXT DEFAULT 'none',
    chart_of_accounts TEXT DEFAULT 'SKR04',
    tax_mode TEXT DEFAULT 'standard',
    datev_consultant_number TEXT DEFAULT '1001',
    datev_client_number TEXT DEFAULT '10001',
    lexware_webhook_callback_url TEXT,
    company_name TEXT,
    contractor_name TEXT,
    company_street TEXT,
    company_zip TEXT,
    company_city TEXT,
    company_address TEXT,
    company_type TEXT,
    tax_assessment_type TEXT,
    tax_number TEXT,
    vat_id TEXT,
    w_idnr TEXT,
    taxation_type TEXT,
    enable_ai_vision INTEGER DEFAULT 1,
    default_transport_type TEXT DEFAULT 'Train',
    use_signature_on_documents INTEGER DEFAULT 1,
    ai_vision_model TEXT DEFAULT '@cf/meta/llama-3.2-11b-vision-instruct',
    ai_pdf_model TEXT DEFAULT '@cf/meta/llama-3.1-8b-instruct',
    ai_auto_provider_detect INTEGER DEFAULT 1,
    ai_custom_rules_json TEXT DEFAULT '[]',
    lexware_api_key TEXT,
    lexware_own_vendor_id TEXT,
    gemini_api_key TEXT,
    gemini_model TEXT DEFAULT 'gemini-3.1-flash-lite-preview',
    ai_prompt_image TEXT,
    ai_prompt_pdf TEXT,
    foreign_rates_custom_json TEXT,
    vehicle_planning_json TEXT
);

-- 12. Benutzer & Authentifizierung
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at_utc TEXT NOT NULL,
    last_login_utc TEXT
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at_utc TEXT NOT NULL,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otp_verifications (
    id TEXT PRIMARY KEY,
    timesheet_id TEXT NOT NULL,
    email TEXT NOT NULL,
    otp_code_hash TEXT NOT NULL,
    expires_at_utc TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    is_verified INTEGER NOT NULL DEFAULT 0,
    created_at_utc TEXT NOT NULL
);

-- 13. Revisionssicheres GoBD-Audit-Log
CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    description TEXT,
    metadata_json TEXT,
    timestamp_utc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS monthly_archive_seals (
    id TEXT PRIMARY KEY,
    period TEXT UNIQUE NOT NULL,
    sealed_at_utc TEXT NOT NULL,
    sealed_by TEXT NOT NULL,
    total_events_count INTEGER NOT NULL DEFAULT 0,
    merkle_root_hash TEXT NOT NULL,
    is_locked INTEGER NOT NULL DEFAULT 1
);

-- 14. Operative Belege & Betriebsausgaben
CREATE TABLE IF NOT EXISTS operational_vouchers (
    id TEXT PRIMARY KEY,
    voucher_number TEXT NOT NULL UNIQUE,
    voucher_date TEXT NOT NULL,
    category TEXT NOT NULL,
    purpose TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    gross_amount REAL NOT NULL DEFAULT 0.0,
    tax_rate REAL NOT NULL DEFAULT 19.0,
    tax_amount REAL NOT NULL DEFAULT 0.0,
    net_amount REAL NOT NULL DEFAULT 0.0,
    deductible_tax REAL NOT NULL DEFAULT 0.0,
    payment_method TEXT NOT NULL DEFAULT 'Bar',
    status TEXT NOT NULL DEFAULT 'erfasst',
    skr04_account TEXT NOT NULL DEFAULT '6540',
    receipt_r2_key TEXT,
    receipt_filename TEXT,
    receipt_mime_type TEXT,
    ocr_raw_text TEXT,
    ocr_confidence REAL DEFAULT 0.0,
    lexware_voucher_id TEXT,
    lexware_sync_status TEXT DEFAULT 'pending',
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS voucher_upload_sessions (
    id TEXT PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    expires_at_utc TEXT NOT NULL,
    is_used INTEGER NOT NULL DEFAULT 0,
    voucher_id TEXT,
    created_at_utc TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invoice_documents (
    id TEXT PRIMARY KEY,
    timesheet_version_id TEXT,
    document_type TEXT NOT NULL DEFAULT 'Invoice',
    invoice_number TEXT NOT NULL,
    invoice_date TEXT NOT NULL,
    due_date TEXT,
    total_net REAL NOT NULL DEFAULT 0.0,
    total_vat REAL NOT NULL DEFAULT 0.0,
    total_gross REAL NOT NULL DEFAULT 0.0,
    r2_storage_key TEXT,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE SET NULL
);

-- Performance-Indizes
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_projects_customer ON projects(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_time ON audit_events(timestamp_utc);
CREATE INDEX IF NOT EXISTS idx_vouchers_date ON operational_vouchers(voucher_date);
