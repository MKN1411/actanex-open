-- Migration 0017: Full Document Chain, Expense Voiding & Archive Support
ALTER TABLE trip_expenses ADD COLUMN lexware_status TEXT DEFAULT 'open';
ALTER TABLE trip_expenses ADD COLUMN is_voucher_canceled INTEGER DEFAULT 0;
ALTER TABLE trip_expenses ADD COLUMN voucher_canceled_at_utc TEXT;
ALTER TABLE projects ADD COLUMN lexware_quotation_status TEXT DEFAULT 'open';
ALTER TABLE projects ADD COLUMN lexware_order_confirmation_status TEXT DEFAULT 'open';
ALTER TABLE timesheet_versions ADD COLUMN is_invoice_paid INTEGER DEFAULT 0;
ALTER TABLE timesheet_versions ADD COLUMN invoice_paid_at_utc TEXT;
ALTER TABLE timesheet_versions ADD COLUMN is_archived INTEGER DEFAULT 0;
