-- Migration 0007: Trips enhancements
ALTER TABLE trips ADD COLUMN origin TEXT;
ALTER TABLE trips ADD COLUMN destination TEXT;
ALTER TABLE trips ADD COLUMN ticket_cost REAL DEFAULT 0.0;
