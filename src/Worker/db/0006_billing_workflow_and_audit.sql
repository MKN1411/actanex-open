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
