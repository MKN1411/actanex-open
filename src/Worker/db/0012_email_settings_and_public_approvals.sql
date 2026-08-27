-- Migration 0012
ALTER TABLE app_settings ADD COLUMN email_sender_name TEXT DEFAULT 'Michael Kirst-Neshva | IT Architecture & Security';
ALTER TABLE app_settings ADD COLUMN email_sender_email TEXT DEFAULT 'mkn@ankbs.de';
ALTER TABLE app_settings ADD COLUMN email_service TEXT DEFAULT 'resend';
ALTER TABLE app_settings ADD COLUMN email_api_key TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN email_subject_template TEXT DEFAULT 'Freigabe Leistungsnachweis {period} für Projekt {projectName}';
ALTER TABLE app_settings ADD COLUMN email_body_template TEXT;
CREATE TABLE IF NOT EXISTS otp_verifications (id TEXT PRIMARY KEY, timesheet_id TEXT NOT NULL, email TEXT NOT NULL, otp_code_hash TEXT NOT NULL, expires_at_utc TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, is_verified INTEGER NOT NULL DEFAULT 0, created_at_utc TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_ts ON otp_verifications(timesheet_id);
