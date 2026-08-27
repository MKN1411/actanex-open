CREATE TABLE IF NOT EXISTS monthly_archive_seals (
    id TEXT PRIMARY KEY,
    period TEXT UNIQUE NOT NULL,
    sealed_at_utc TEXT NOT NULL,
    sealed_by TEXT NOT NULL,
    total_events_count INTEGER NOT NULL DEFAULT 0,
    merkle_root_hash TEXT NOT NULL,
    is_locked INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS trip_legs (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    leg_order INTEGER NOT NULL DEFAULT 1,
    date_leg TEXT NOT NULL,
    start_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    transport_type TEXT NOT NULL DEFAULT 'Train',
    distance_km REAL DEFAULT 0.0,
    rate_per_km REAL DEFAULT 0.0,
    travel_cost_net REAL DEFAULT 0.0,
    layover_hours REAL DEFAULT 0.0,
    layover_purpose TEXT,
    customer_id TEXT,
    project_id TEXT,
    is_billable_to_client INTEGER NOT NULL DEFAULT 1,
    created_at_utc TEXT NOT NULL
);

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
    lexware_voucher_number TEXT,
    lexware_status TEXT DEFAULT 'open',
    is_voucher_canceled INTEGER DEFAULT 0,
    voucher_canceled_at_utc TEXT
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

CREATE TABLE IF NOT EXISTS gobd_audit_log (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    description TEXT NOT NULL,
    data_payload_json TEXT,
    timestamp_utc TEXT NOT NULL
);
