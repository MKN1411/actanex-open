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
