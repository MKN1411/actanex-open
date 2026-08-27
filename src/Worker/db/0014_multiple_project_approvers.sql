-- Migration 0014: Multiple Project Approvers & End Customer Support
ALTER TABLE projects ADD COLUMN updated_at_utc TEXT;
ALTER TABLE projects ADD COLUMN end_customer_name TEXT;
ALTER TABLE projects ADD COLUMN approver_2_email TEXT;
ALTER TABLE projects ADD COLUMN approver_2_name TEXT;
ALTER TABLE projects ADD COLUMN approver_3_email TEXT;
ALTER TABLE projects ADD COLUMN approver_3_name TEXT;
