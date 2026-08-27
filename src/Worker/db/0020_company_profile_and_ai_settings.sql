-- Migration 0020: Company Profile, Freelancer Master Data & AI Settings
ALTER TABLE app_settings ADD COLUMN company_name TEXT DEFAULT 'Cloud Security & Compliance Architecture - Michael Kirst-Neshva';
ALTER TABLE app_settings ADD COLUMN contractor_name TEXT DEFAULT 'Michael Kirst-Neshva';
ALTER TABLE app_settings ADD COLUMN company_street TEXT DEFAULT 'Ruthenberger Markt 11b';
ALTER TABLE app_settings ADD COLUMN company_zip TEXT DEFAULT '24539';
ALTER TABLE app_settings ADD COLUMN company_city TEXT DEFAULT 'Neumuenster';
ALTER TABLE app_settings ADD COLUMN company_address TEXT DEFAULT 'Ruthenberger Markt 11b, 24539 Neumuenster';
ALTER TABLE app_settings ADD COLUMN company_type TEXT DEFAULT 'Freiberufler';
ALTER TABLE app_settings ADD COLUMN tax_assessment_type TEXT DEFAULT 'EUeR';
ALTER TABLE app_settings ADD COLUMN tax_number TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN vat_id TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN w_idnr TEXT DEFAULT '';
ALTER TABLE app_settings ADD COLUMN taxation_type TEXT DEFAULT 'Ist-Versteuerung';
ALTER TABLE app_settings ADD COLUMN enable_ai_vision INTEGER DEFAULT 1;

ALTER TABLE operational_vouchers ADD COLUMN trip_id TEXT;
ALTER TABLE operational_vouchers ADD COLUMN tax19_gross REAL DEFAULT 0.0;
ALTER TABLE operational_vouchers ADD COLUMN tax7_gross REAL DEFAULT 0.0;
ALTER TABLE operational_vouchers ADD COLUMN tax19_amount REAL DEFAULT 0.0;
ALTER TABLE operational_vouchers ADD COLUMN tax7_amount REAL DEFAULT 0.0;
