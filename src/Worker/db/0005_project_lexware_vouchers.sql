-- Add Lexware voucher references & archive flag to projects
ALTER TABLE projects ADD COLUMN lexware_quotation_id TEXT;
ALTER TABLE projects ADD COLUMN lexware_quotation_number TEXT;
ALTER TABLE projects ADD COLUMN lexware_order_confirmation_id TEXT;
ALTER TABLE projects ADD COLUMN lexware_order_confirmation_number TEXT;
ALTER TABLE projects ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0;
