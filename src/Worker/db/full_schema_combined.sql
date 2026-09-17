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
-- Migration to add columns to existing D1 tables
ALTER TABLE customers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
ALTER TABLE customers ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE time_entries ADD COLUMN location TEXT NOT NULL DEFAULT 'Remote';
ALTER TABLE trips ADD COLUMN expense_type TEXT NOT NULL DEFAULT 'PublicTransit';
ALTER TABLE trips ADD COLUMN distance_km REAL NOT NULL DEFAULT 0.0;
ALTER TABLE trips ADD COLUMN rate_per_km REAL NOT NULL DEFAULT 0.30;
ALTER TABLE projects ADD COLUMN planned_hours REAL NOT NULL DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN total_budget_net REAL NOT NULL DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN start_date TEXT;
ALTER TABLE projects ADD COLUMN end_date TEXT;
-- Add budget and timeline columns to projects
ALTER TABLE projects ADD COLUMN planned_hours REAL NOT NULL DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN total_budget_net REAL NOT NULL DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN start_date TEXT;
ALTER TABLE projects ADD COLUMN end_date TEXT;
-- Add Lexware voucher references & archive flag to projects
ALTER TABLE projects ADD COLUMN lexware_quotation_id TEXT;
ALTER TABLE projects ADD COLUMN lexware_quotation_number TEXT;
ALTER TABLE projects ADD COLUMN lexware_order_confirmation_id TEXT;
ALTER TABLE projects ADD COLUMN lexware_order_confirmation_number TEXT;
ALTER TABLE projects ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;
-- Migration 0006: Billing Workflow, Invoice Cancellation & Monthly Archive Seals
ALTER TABLE timesheet_versions ADD COLUMN status TEXT NOT NULL DEFAULT 'Draft';
ALTER TABLE timesheet_versions ADD COLUMN rejection_reason TEXT;
ALTER TABLE timesheet_versions ADD COLUMN lexware_invoice_id TEXT;
ALTER TABLE timesheet_versions ADD COLUMN lexware_invoice_number TEXT;
ALTER TABLE timesheet_versions ADD COLUMN is_invoice_canceled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE timesheet_versions ADD COLUMN invoice_canceled_at_utc TEXT;
ALTER TABLE timesheet_versions ADD COLUMN approval_method TEXT;
ALTER TABLE timesheet_versions ADD COLUMN approved_by TEXT;
ALTER TABLE timesheet_versions ADD COLUMN approved_at_utc TEXT;
ALTER TABLE timesheet_versions ADD COLUMN pdf_frozen_hash TEXT;
ALTER TABLE timesheet_versions ADD COLUMN frozen_at_utc TEXT;

CREATE TABLE IF NOT EXISTS monthly_archive_seals (
    id TEXT PRIMARY KEY,
    period TEXT UNIQUE NOT NULL,
    sealed_at_utc TEXT NOT NULL,
    sealed_by TEXT NOT NULL,
    total_events_count INTEGER NOT NULL DEFAULT 0,
    merkle_root_hash TEXT NOT NULL,
    is_locked INTEGER NOT NULL DEFAULT 1
);
-- Migration 0007: Trips enhancements
ALTER TABLE trips ADD COLUMN origin TEXT;
ALTER TABLE trips ADD COLUMN destination TEXT;
ALTER TABLE trips ADD COLUMN ticket_cost REAL DEFAULT 0.0;
-- Migration 0008: Billing type and internal tracking
ALTER TABLE time_entries ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'Billable';

-- Auto-Insert default internal customer & projects if not existing
INSERT OR IGNORE INTO customers (id, lexware_contact_id, name, contact_person, email, street, zip_code, city, country_code, is_active, is_archived, created_at_utc, updated_at_utc)
VALUES ('cust_internal', 'INTERNAL_ORG', '[INTERN] Eigene Organisation & Administration', 'Michael Kirst-Neshva', 'mkn@ankbs.de', '', '', '', 'DE', 1, 0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO projects (id, customer_id, project_number, name, description, default_hourly_rate, planned_hours, total_budget_net, is_active, is_archived, created_at_utc)
VALUES 
  ('prj_internal_acq', 'cust_internal', 'INT-AKQUISE', 'Kundenakquise & Vertrieb', 'Akquise, Kundengespräche & Angebote', 0.0, 0.0, 0.0, 1, 0, datetime('now')),
  ('prj_internal_acc', 'cust_internal', 'INT-BUCHHALTUNG', 'Buchhaltung, Steuern & Finanzen', 'Belegwesen, Buchhaltung & GoBD Administration', 0.0, 0.0, 0.0, 1, 0, datetime('now')),
  ('prj_internal_rd',  'cust_internal', 'INT-RECHERCHE', 'Wissensaufbau & Technologierecherche', 'Recherche, Weiterbildung & Zertifizierungen', 0.0, 0.0, 0.0, 1, 0, datetime('now')),
  ('prj_internal_it',  'cust_internal', 'INT-IT-ORGA', 'Interne IT, Tools & Administration', 'Wartung von internen Systemen und Workflows', 0.0, 0.0, 0.0, 1, 0, datetime('now'));
ALTER TABLE trips ADD COLUMN contact_person TEXT;
ALTER TABLE trips ADD COLUMN destination_address TEXT;
ALTER TABLE trips ADD COLUMN origin_address TEXT;
ALTER TABLE trips ADD COLUMN travel_type TEXT DEFAULT 'BusinessTrip';
ALTER TABLE trips ADD COLUMN departure_time TEXT;
ALTER TABLE trips ADD COLUMN arrival_time TEXT;
ALTER TABLE trips ADD COLUMN vma_amount REAL DEFAULT 0.0;
ALTER TABLE trips ADD COLUMN has_breakfast INTEGER DEFAULT 0;
ALTER TABLE trips ADD COLUMN hotel_cost REAL DEFAULT 0.0;
ALTER TABLE trips ADD COLUMN parking_cost REAL DEFAULT 0.0;
ALTER TABLE trips ADD COLUMN is_billable_to_client INTEGER DEFAULT 1;
ALTER TABLE trips ADD COLUMN is_internal_expense_only INTEGER DEFAULT 0;
CREATE TABLE IF NOT EXISTS app_settings (id TEXT PRIMARY KEY, mileage_rate_business REAL NOT NULL DEFAULT 0.30, commute_rate_tier1 REAL NOT NULL DEFAULT 0.30, commute_rate_tier2 REAL NOT NULL DEFAULT 0.38, vma_rate_8h REAL NOT NULL DEFAULT 14.00, vma_rate_24h REAL NOT NULL DEFAULT 28.00, pdf_storage_mode TEXT NOT NULL DEFAULT 'R2', updated_at_utc TEXT NOT NULL);
INSERT OR IGNORE INTO app_settings (id, mileage_rate_business, commute_rate_tier1, commute_rate_tier2, vma_rate_8h, vma_rate_24h, pdf_storage_mode, updated_at_utc) VALUES ('global_config', 0.30, 0.30, 0.38, 14.00, 28.00, 'R2', datetime('now'));
ALTER TABLE trips ADD COLUMN return_date TEXT;
ALTER TABLE trips ADD COLUMN total_days INTEGER DEFAULT 1;

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
-- Migration 0011: Admin Benutzerverwaltung und Session-Authentifizierung

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Admin',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at_utc TEXT NOT NULL,
    last_login_utc TEXT
);

CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at_utc TEXT NOT NULL,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Initialer Admin-Seed: michael_kirst@hotmail.com (Passwort: Viktor##2027##)
INSERT OR REPLACE INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
VALUES (
    'usr_admin_01',
    'michael_kirst@hotmail.com',
    '2173e5a4c2d7848ff8834a103b32211fb3b64248826cc36e4f0d8de0a275a2e07b8e06da97ecaee7db75bfac4cb5752fd0bbd997ed5f0f73a1e217c1fda77c29',
    'f5de90270b9f7d2cb8efea3b9ff63eda',
    'Michael Kirst-Neshva',
    'Admin',
    1,
    '2026-08-21T09:00:00.000Z'
);
-- Migration 0012
ALTER TABLE app_settings ADD COLUMN email_sender_name TEXT DEFAULT 'Michael Kirst-Neshva | IT Architecture & Security';
ALTER TABLE app_settings ADD COLUMN email_sender_email TEXT DEFAULT 'mkn@ankbs.de';
ALTER TABLE app_settings ADD COLUMN email_service TEXT DEFAULT 'resend';
ALTER TABLE app_settings ADD COLUMN email_api_key TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN email_subject_template TEXT DEFAULT 'Freigabe Leistungsnachweis {period} für Projekt {projectName}';
ALTER TABLE app_settings ADD COLUMN email_body_template TEXT;
CREATE TABLE IF NOT EXISTS otp_verifications (id TEXT PRIMARY KEY, timesheet_id TEXT NOT NULL, email TEXT NOT NULL, otp_code_hash TEXT NOT NULL, expires_at_utc TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, is_verified INTEGER NOT NULL DEFAULT 0, created_at_utc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_ts ON otp_verifications(timesheet_id);
-- Migration 0013: Signed document uploads, reminder tracking & email reminder settings
ALTER TABLE timesheet_versions ADD COLUMN signed_document_r2_key TEXT;
ALTER TABLE timesheet_versions ADD COLUMN signed_document_filename TEXT;
ALTER TABLE timesheet_versions ADD COLUMN reminder_1_sent_at_utc TEXT;
ALTER TABLE timesheet_versions ADD COLUMN reminder_2_sent_at_utc TEXT;

ALTER TABLE app_settings ADD COLUMN email_reminder1_subject TEXT DEFAULT '1. Erinnerung: Freigabe Leistungsnachweis {period} für Projekt {projectName}';
ALTER TABLE app_settings ADD COLUMN email_reminder1_body TEXT;
ALTER TABLE app_settings ADD COLUMN email_reminder2_subject TEXT DEFAULT '2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})';
ALTER TABLE app_settings ADD COLUMN email_reminder2_body TEXT;
ALTER TABLE app_settings ADD COLUMN email_admin_notify_rejection INTEGER DEFAULT 1;
ALTER TABLE app_settings ADD COLUMN email_admin_notify_reminder INTEGER DEFAULT 1;
-- Migration 0014: Multiple Project Approvers & End Customer Support
ALTER TABLE projects ADD COLUMN updated_at_utc TEXT;
ALTER TABLE projects ADD COLUMN end_customer_name TEXT;
ALTER TABLE projects ADD COLUMN approver_2_email TEXT;
ALTER TABLE projects ADD COLUMN approver_2_name TEXT;
ALTER TABLE projects ADD COLUMN approver_3_email TEXT;
ALTER TABLE projects ADD COLUMN approver_3_name TEXT;
-- Migration 0015: Add contractor signature and title
ALTER TABLE app_settings ADD COLUMN contractor_signature_data_url TEXT;
ALTER TABLE app_settings ADD COLUMN contractor_title TEXT DEFAULT 'Senior Cloud & Security Architect';
-- Migration 0016: Add customer_number to customers
ALTER TABLE customers ADD COLUMN customer_number TEXT;
-- Migration 0017: Full Document Chain, Expense Voiding & Archive Support
ALTER TABLE trip_expenses ADD COLUMN lexware_status TEXT DEFAULT 'open';
ALTER TABLE trip_expenses ADD COLUMN is_voucher_canceled INTEGER DEFAULT 0;
ALTER TABLE trip_expenses ADD COLUMN voucher_canceled_at_utc TEXT;
ALTER TABLE projects ADD COLUMN lexware_quotation_status TEXT DEFAULT 'open';
ALTER TABLE projects ADD COLUMN lexware_order_confirmation_status TEXT DEFAULT 'open';
ALTER TABLE timesheet_versions ADD COLUMN is_invoice_paid INTEGER DEFAULT 0;
ALTER TABLE timesheet_versions ADD COLUMN invoice_paid_at_utc TEXT;
ALTER TABLE timesheet_versions ADD COLUMN is_archived INTEGER DEFAULT 0;
-- Migration 0018: Billing Provider Decoupling & DATEV / Account Settings
ALTER TABLE app_settings ADD COLUMN billing_provider TEXT DEFAULT 'lexware';
ALTER TABLE app_settings ADD COLUMN chart_of_accounts TEXT DEFAULT 'SKR04';
ALTER TABLE app_settings ADD COLUMN tax_mode TEXT DEFAULT 'standard';
ALTER TABLE app_settings ADD COLUMN datev_consultant_number TEXT DEFAULT '1001';
ALTER TABLE app_settings ADD COLUMN datev_client_number TEXT DEFAULT '10001';

ALTER TABLE timesheet_versions ADD COLUMN external_invoice_number TEXT;
ALTER TABLE timesheet_versions ADD COLUMN external_invoice_date TEXT;
-- Migration 0019: Operational Vouchers, Mixed Hospitality Splitting & QR Mobile Upload Sessions

CREATE TABLE IF NOT EXISTS operational_vouchers (
    id TEXT PRIMARY KEY,
    voucher_number TEXT NOT NULL UNIQUE,       -- z. B. BEL-2026-08-0001
    voucher_type TEXT NOT NULL,                -- Hospitality, LocalTransit, OwnReceipt, GWG_Asset, GeneralExpense
    voucher_date TEXT NOT NULL,                -- YYYY-MM-DD
    supplier_name TEXT NOT NULL,               -- Restaurantname, Taxiunternehmen, Händler
    description TEXT NOT NULL,                 -- Kurzbeschreibung
    business_purpose TEXT NOT NULL,            -- Detaillierter geschäftlicher Anlass
    
    -- Optionale Projekt- & Kundenbindung
    project_id TEXT,
    customer_id TEXT,
    is_billable_to_client INTEGER NOT NULL DEFAULT 0,
    
    -- Beträge & Steuern Gesamt
    amount_gross REAL NOT NULL DEFAULT 0.0,
    amount_net REAL NOT NULL DEFAULT 0.0,
    tax_rate REAL NOT NULL DEFAULT 19.0,
    tax_amount REAL NOT NULL DEFAULT 0.0,
    tip_amount REAL NOT NULL DEFAULT 0.0,
    
    -- Spezifisch für Bewirtung & Kopfanteil-Splitting (§ 4 Abs. 5 EStG / § 12 EStG)
    total_attendees_count INTEGER DEFAULT 1,
    business_attendees_count INTEGER DEFAULT 1,
    business_share_percent REAL DEFAULT 100.0,  -- z. B. 50.0 bei 3 von 6 Personen
    tax_deductible_net REAL DEFAULT 0.0,        -- 70 % des geschäftlichen Anteils
    tax_non_deductible_net REAL DEFAULT 0.0,    -- 30 % des geschäftlichen Anteils
    private_share_gross REAL DEFAULT 0.0,       -- Privater Anteil brutto (steuerlich neutral)
    attendees_json TEXT,                        -- JSON-Array: [{ name, company, role, is_business: true/false }]
    location_address TEXT,                      -- Restaurant-Adresse / Ort
    
    -- Spezifisch für Eigenbeleg
    is_own_receipt INTEGER NOT NULL DEFAULT 0,
    own_receipt_reason TEXT,
    
    -- Spezifisch für Lokale Fahrten
    transport_type TEXT,                        -- Taxi, PublicTransit, Parking, Mileage_Car
    distance_km REAL DEFAULT 0.0,
    origin_address TEXT,
    destination_address TEXT,
    parent_hospitality_voucher_id TEXT,         -- Verknüpfung, falls Fahrt zu Bewirtung gehört
    
    -- Buchungskonten (SKR04 / SKR03)
    skr04_account TEXT NOT NULL DEFAULT '4650',
    skr03_account TEXT NOT NULL DEFAULT '4650',
    
    -- Dokumenten- & Hash-Kette
    receipt_r2_key TEXT,                        -- Hochgeladene Originalquittung / TSE-Rechnung
    receipt_filename TEXT,
    receipt_mime_type TEXT,
    payment_slip_r2_key TEXT,                   -- Hochgeladener Kartenzahlungsbeleg / Terminal-Slip
    payment_slip_filename TEXT,
    payment_slip_total_gross REAL DEFAULT 0.0,  -- Z. B. 195,00 € (inkl. Trinkgeld)
    payment_method TEXT DEFAULT 'Card_NFC',     -- Card_NFC, Cash, BankTransfer
    secondary_attachment_r2_key TEXT,           -- Optional: Businessplan, Agenda, Besprechungsnotiz
    secondary_attachment_filename TEXT,
    voucher_pdf_r2_key TEXT,                    -- Generiertes GoBD-Deckblatt inkl. Folgeseiten
    voucher_pdf_hash_sha256 TEXT,               -- Revisionssicherer SHA-256 Hash
    
    -- Lexware Office Synchronisation
    is_synced_to_lexware INTEGER NOT NULL DEFAULT 0,
    lexware_voucher_id TEXT,
    lexware_voucher_number TEXT,
    lexware_status TEXT DEFAULT 'open',         -- open, synced, voided
    
    created_at_utc TEXT NOT NULL,
    updated_at_utc TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Temporäre Upload-Sessions für Cross-Device Mobile Scanning
CREATE TABLE IF NOT EXISTS voucher_upload_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT NOT NULL DEFAULT 'waiting',     -- waiting, ready, expired, completed
    uploaded_files_json TEXT DEFAULT '[]',      -- JSON array of uploaded R2 keys & filenames
    ai_extracted_json TEXT,                     -- AI extraction result cache
    expires_at_utc TEXT NOT NULL,
    created_at_utc TEXT NOT NULL
);
-- Migration 0020: Company Profile, Freelancer Master Data & AI Settings
ALTER TABLE app_settings ADD COLUMN company_name TEXT DEFAULT 'Cloud Security & Compliance Architecture - Michael Kirst-Neshva';
ALTER TABLE app_settings ADD COLUMN contractor_name TEXT DEFAULT 'Michael Kirst-Neshva';
ALTER TABLE app_settings ADD COLUMN company_street TEXT DEFAULT 'Ruthenberger Markt 11b';
ALTER TABLE app_settings ADD COLUMN company_zip TEXT DEFAULT '24539';
ALTER TABLE app_settings ADD COLUMN company_city TEXT DEFAULT 'Neumuenster';
ALTER TABLE app_settings ADD COLUMN company_address TEXT DEFAULT 'Ruthenberger Markt 11b, 24539 Neumuenster';
ALTER TABLE app_settings ADD COLUMN company_type TEXT DEFAULT 'Freiberufler';
ALTER TABLE app_settings ADD COLUMN tax_assessment_type TEXT DEFAULT 'EUeR';
ALTER TABLE app_settings ADD COLUMN tax_number TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN vat_id TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN w_idnr TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN taxation_type TEXT DEFAULT 'Ist-Versteuerung';
ALTER TABLE app_settings ADD COLUMN enable_ai_vision INTEGER DEFAULT 1;

ALTER TABLE operational_vouchers ADD COLUMN trip_id TEXT;
ALTER TABLE operational_vouchers ADD COLUMN tax19_gross REAL DEFAULT 0.0;
ALTER TABLE operational_vouchers ADD COLUMN tax7_gross REAL DEFAULT 0.0;
ALTER TABLE operational_vouchers ADD COLUMN tax19_amount REAL DEFAULT 0.0;
ALTER TABLE operational_vouchers ADD COLUMN tax7_amount REAL DEFAULT 0.0;
-- ============================================================================
-- FREELANCER EVIDENCE & BILLING HUB - MIGRATION 0021
-- Trip Legs, Future Planning (Forecast), Multi-Transport & VMA Enhancements
-- ============================================================================

-- 1. Erweiterung der trips-Tabelle
ALTER TABLE trips ADD COLUMN status TEXT NOT NULL DEFAULT 'Completed'; -- 'Planned', 'Completed', 'Archived'
ALTER TABLE trips ADD COLUMN is_round_trip INTEGER NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN total_planned_cost_net REAL DEFAULT 0.0;
ALTER TABLE trips ADD COLUMN breakfast_days_json TEXT DEFAULT '[]';

-- 2. Neue Tabelle für Etappen bei Rundreisen & Zwischenstopps
CREATE TABLE IF NOT EXISTS trip_legs (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    leg_order INTEGER NOT NULL DEFAULT 1,
    date_leg TEXT NOT NULL,
    start_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    transport_type TEXT NOT NULL DEFAULT 'Train', -- 'Train', 'Flight', 'Car', 'RentalCar', 'Passenger', 'RentalBike', 'BikeFoot'
    distance_km REAL DEFAULT 0.0,
    rate_per_km REAL DEFAULT 0.0,
    travel_cost_net REAL DEFAULT 0.0,
    layover_hours REAL DEFAULT 0.0,
    layover_purpose TEXT,
    customer_id TEXT,
    project_id TEXT,
    is_billable_to_client INTEGER NOT NULL DEFAULT 1,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- 3. Erweiterung der globalen Konfiguration für Standard-Verkehrsmittel
ALTER TABLE app_settings ADD COLUMN default_transport_type TEXT DEFAULT 'Train';

-- ============================================================================
-- FREELANCER EVIDENCE & BILLING HUB - MIGRATION 0022
-- Dynamic 3-Stage Project & Budget Hierarchy (Gesamtprojekt -> Stream/AP -> Teilprojekt/AP)
-- Travel Budgets & Parent-Pooled Budget Allocation
-- ============================================================================

-- 1. Erweiterung der projects-Tabelle um hierarchische Verknüpfung und flexible Budgetmodi
ALTER TABLE projects ADD COLUMN parent_project_id TEXT;
ALTER TABLE projects ADD COLUMN hierarchy_level INTEGER NOT NULL DEFAULT 1; -- 1 = Gesamtprojekt, 2 = Projekt/Programm/Stream/AP, 3 = Teilprojekt/AP
ALTER TABLE projects ADD COLUMN budget_mode TEXT NOT NULL DEFAULT 'Dedicated'; -- 'Dedicated': Eigenes Honorarbudget; 'PooledFromParent': Bucht auf übergeordneten Rahmenvertrag/Stream
ALTER TABLE projects ADD COLUMN travel_budget_net REAL DEFAULT 0.0; -- Separates Reisekostenbudget in Euro
ALTER TABLE projects ADD COLUMN travel_budget_mode TEXT NOT NULL DEFAULT 'Dedicated'; -- 'Dedicated', 'PooledFromParent', 'None'

