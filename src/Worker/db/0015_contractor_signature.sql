-- Migration 0015: Add contractor signature and title
ALTER TABLE app_settings ADD COLUMN contractor_signature_data_url TEXT;
ALTER TABLE app_settings ADD COLUMN contractor_title TEXT DEFAULT 'Senior Cloud & Security Architect';
