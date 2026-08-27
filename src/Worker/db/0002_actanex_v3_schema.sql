-- ==============================================================================
-- ACTANEX (ACNX) - VERSION 3.0 MIGRATION SCHEMA
-- ==============================================================================

-- 1. Adaptives Händler-Lernen (Vendor-Rules-Lookup)
CREATE TABLE IF NOT EXISTS merchant_rules (
    id TEXT PRIMARY KEY,
    pattern TEXT NOT NULL UNIQUE,
    merchant_name TEXT NOT NULL,
    skr04_account TEXT NOT NULL DEFAULT '6670',
    tax_rate REAL NOT NULL DEFAULT 19.0,
    category TEXT NOT NULL DEFAULT 'Other',
    confidence REAL NOT NULL DEFAULT 1.0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT
);

-- 2. Zentraler Document Vault (GoBD SHA-256 Hashes für alle Dokumente)
CREATE TABLE IF NOT EXISTS document_vault (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    sha256_hash TEXT NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'receipt',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Standard-Lernregeln initial vorbefüllen
INSERT OR IGNORE INTO merchant_rules (id, pattern, merchant_name, skr04_account, tax_rate, category)
VALUES 
  ('rule_db', 'bahn', 'Deutsche Bahn AG', '6663', 7.0, 'Travel'),
  ('rule_db2', 'db vertrieb', 'Deutsche Bahn AG', '6663', 7.0, 'Travel'),
  ('rule_taxi', 'taxi', 'Taxi / Fahrservice', '6673', 7.0, 'Travel'),
  ('rule_uber', 'uber', 'Uber B.V.', '6673', 19.0, 'Travel'),
  ('rule_hotel', 'hotel', 'Hotelübernachtung', '6670', 7.0, 'Hotel'),
  ('rule_motel', 'motel one', 'Motel One Group', '6670', 7.0, 'Hotel'),
  ('rule_shell', 'shell', 'Shell Tankstelle', '6530', 19.0, 'Fuel'),
  ('rule_aral', 'aral', 'Aral Tankstelle', '6530', 19.0, 'Fuel');
