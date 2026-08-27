-- Migration 0018: Billing Provider Decoupling & DATEV / Account Settings
ALTER TABLE app_settings ADD COLUMN billing_provider TEXT DEFAULT 'lexware';
ALTER TABLE app_settings ADD COLUMN chart_of_accounts TEXT DEFAULT 'SKR04';
ALTER TABLE app_settings ADD COLUMN tax_mode TEXT DEFAULT 'standard';
ALTER TABLE app_settings ADD COLUMN datev_consultant_number TEXT DEFAULT '1001';
ALTER TABLE app_settings ADD COLUMN datev_client_number TEXT DEFAULT '10001';

ALTER TABLE timesheet_versions ADD COLUMN external_invoice_number TEXT;
ALTER TABLE timesheet_versions ADD COLUMN external_invoice_date TEXT;
