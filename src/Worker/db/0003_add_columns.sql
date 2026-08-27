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
