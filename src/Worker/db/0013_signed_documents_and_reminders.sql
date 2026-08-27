-- Migration 0013: Signed document uploads, reminder tracking & email reminder settings
ALTER TABLE timesheet_versions ADD COLUMN signed_document_r2_key TEXT;
ALTER TABLE timesheet_versions ADD COLUMN signed_document_filename TEXT;
ALTER TABLE timesheet_versions ADD COLUMN reminder_1_sent_at_utc TEXT;
ALTER TABLE timesheet_versions ADD COLUMN reminder_2_sent_at_utc TEXT;

ALTER TABLE app_settings ADD COLUMN email_reminder1_subject TEXT DEFAULT '1. Erinnerung: Freigabe Leistungsnachweis {period} für Projekt {projectName}';
ALTER TABLE app_settings ADD COLUMN email_reminder1_body TEXT;
ALTER TABLE app_settings ADD COLUMN email_reminder2_subject TEXT DEFAULT '2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})';
ALTER TABLE app_settings ADD COLUMN email_reminder2_body TEXT;
ALTER TABLE app_settings ADD COLUMN email_admin_notify_rejection INTEGER DEFAULT 1;
ALTER TABLE app_settings ADD COLUMN email_admin_notify_reminder INTEGER DEFAULT 1;
