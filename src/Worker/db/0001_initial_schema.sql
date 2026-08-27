-- ==============================================================================
-- FREELANCER EVIDENCE & BILLING HUB - CLOUDFLARE D1 (SQLITE) SCHEMA
-- Version: 2.2 (GoBD-konform, Revisionssicher, Relational, Soft-Delete & Archive Support)
-- ==============================================================================

-- 1. Kundenstammdaten (Führend in Lexware)
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
    is_active INTEGER NOT NULL DEFAULT 1,
    is_archived INTEGER NOT NULL DEFAULT 0,
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT
);

-- 2. Projekte & Vertragsparameter
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL,
    project_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    purchase_order_number TEXT,
    contract_number TEXT,
    default_hourly_rate REAL NOT NULL DEFAULT 120.00,
    lexware_service_article_id TEXT NOT NULL,
    billing_interval_minutes INTEGER NOT NULL DEFAULT 15,
    approver_email TEXT NOT NULL,
    approver_name TEXT,
    travel_time_billable INTEGER NOT NULL DEFAULT 0,
    travel_time_rate_multiplier REAL NOT NULL DEFAULT 1.0,
    public_transit_reimbursable INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
);

-- 3. Stundenzettel-Versionen (GoBD: Unveränderbar nach Freigabe)
CREATE TABLE IF NOT EXISTS timesheet_versions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    period TEXT NOT NULL, -- Format: YYYY-MM
    status TEXT NOT NULL DEFAULT 'Draft', -- Draft, Submitted, Approved, Rejected, ReadyForBilling, Billed, Archived
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
    supersedes_version_id TEXT,
    created_at_utc TEXT NOT NULL,
    submitted_at_utc TEXT,
    approved_at_utc TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    UNIQUE(project_id, period, version_number)
);

-- 4. Zeiteinträge
CREATE TABLE IF NOT EXISTS time_entries (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    timesheet_version_id TEXT,
    entry_date TEXT NOT NULL, -- Format: YYYY-MM-DD
    start_time TEXT NOT NULL, -- Format: HH:MM
    end_time TEXT NOT NULL,   -- Format: HH:MM
    break_minutes INTEGER NOT NULL DEFAULT 0,
    actual_duration_hours REAL NOT NULL,
    billable_duration_hours REAL NOT NULL,
    category TEXT NOT NULL,   -- Architecture, Engineering, SecurityDesign, TelkoMeeting, etc.
    location TEXT NOT NULL DEFAULT 'Remote', -- Remote, OnSite
    short_description TEXT NOT NULL,
    task_or_ticket_reference TEXT,
    is_billable INTEGER NOT NULL DEFAULT 1,
    billing_rate_snapshot REAL NOT NULL,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE SET NULL
);

-- 5. Strukturierte Tätigkeitsnachweise (§ 18 EStG)
CREATE TABLE IF NOT EXISTS activity_evidences (
    id TEXT PRIMARY KEY,
    time_entry_id TEXT NOT NULL UNIQUE,
    problem_statement TEXT NOT NULL,
    methodology TEXT NOT NULL,
    technical_activity TEXT NOT NULL,
    result TEXT NOT NULL,
    responsibility TEXT NOT NULL DEFAULT 'Eigenverantwortliche Konzeption & Durchführung',
    deliverable TEXT,
    FOREIGN KEY (time_entry_id) REFERENCES time_entries(id) ON DELETE CASCADE
);

-- 6. Geschäftsreisen (ÖPNV oder PKW)
CREATE TABLE IF NOT EXISTS trips (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    timesheet_version_id TEXT,
    trip_date TEXT NOT NULL,
    purpose TEXT NOT NULL,
    expense_type TEXT NOT NULL DEFAULT 'PublicTransit', -- PublicTransit, PersonalCar
    origin_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    distance_km REAL NOT NULL DEFAULT 0.0,
    rate_per_km REAL NOT NULL DEFAULT 0.30,
    actual_departure_utc TEXT NOT NULL,
    actual_arrival_utc TEXT NOT NULL,
    total_absence_hours REAL NOT NULL,
    elapsed_travel_hours REAL NOT NULL,
    work_time_during_travel_hours REAL NOT NULL DEFAULT 0.0,
    billable_travel_hours REAL NOT NULL DEFAULT 0.0,
    customer_reimbursable_cost REAL NOT NULL DEFAULT 0.0,
    total_actual_cost REAL NOT NULL DEFAULT 0.0,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
    FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE SET NULL
);

-- 7. Reiseabschnitte (Segmente)
CREATE TABLE IF NOT EXISTS trip_segments (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    sequence_number INTEGER NOT NULL,
    travel_mode TEXT NOT NULL,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    operator_and_line TEXT,
    receipt_id TEXT,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
);

-- 8. Belegdateien (Cloudflare R2 Metadaten)
CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    trip_id TEXT,
    project_id TEXT,
    receipt_date TEXT NOT NULL,
    merchant_name TEXT NOT NULL,
    amount_net REAL NOT NULL,
    vat_rate REAL NOT NULL DEFAULT 19.0,
    amount_gross REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'EUR',
    is_customer_reimbursable INTEGER NOT NULL DEFAULT 1,
    r2_storage_key TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    sha256_hash TEXT NOT NULL,
    retention_class TEXT NOT NULL DEFAULT 'AccountingEvidence',
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
);

-- 9. Kunden-Freigabeprotokoll (Zero Trust OTP)
CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    timesheet_version_id TEXT NOT NULL UNIQUE,
    decision TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'CloudflareZeroTrustOtp',
    approver_email TEXT NOT NULL,
    approver_name TEXT,
    comment TEXT,
    bound_document_hash_sha256 TEXT NOT NULL,
    client_ip TEXT,
    user_agent TEXT,
    decision_at_utc TEXT NOT NULL,
    FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE RESTRICT
);

-- 10. Lexware Rechnungs-Übertragungspaket (Idempotent)
CREATE TABLE IF NOT EXISTS billing_batches (
    id TEXT PRIMARY KEY,
    timesheet_version_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL UNIQUE,
    lexware_invoice_id TEXT,
    invoice_number TEXT,
    billed_hours REAL NOT NULL,
    billed_expenses_net REAL NOT NULL,
    total_billed_amount_net REAL NOT NULL,
    is_finalized_in_lexware INTEGER NOT NULL DEFAULT 0,
    draft_created_utc TEXT NOT NULL,
    FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE RESTRICT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
);

-- 11. GoBD Audit-Log (Append-Only)
CREATE TABLE IF NOT EXISTS audit_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    description TEXT NOT NULL,
    data_payload_json TEXT,
    timestamp_utc TEXT NOT NULL
);

-- Indizes für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_time_entries_project_date ON time_entries(project_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_timesheet ON time_entries(timesheet_version_id);
CREATE INDEX IF NOT EXISTS idx_trips_project_date ON trips(project_id, trip_date);
CREATE INDEX IF NOT EXISTS idx_timesheet_project_period ON timesheet_versions(project_id, period);
