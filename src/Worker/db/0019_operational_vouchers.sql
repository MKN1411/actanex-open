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
