-- Migration 0008: Billing type and internal tracking
ALTER TABLE time_entries ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'Billable';

-- Auto-Insert default internal customer & projects if not existing
INSERT OR IGNORE INTO customers (id, lexware_contact_id, name, contact_person, email, street, zip_code, city, country_code, is_active, is_archived, created_at_utc, updated_at_utc)
VALUES ('cust_internal', 'INTERNAL_ORG', '[INTERN] Eigene Organisation & Administration', 'Michael Kirst-Neshva', 'mkn@ankbs.de', '', '', '', 'DE', 1, 0, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO projects (id, customer_id, project_number, name, description, default_hourly_rate, planned_hours, total_budget_net, is_active, is_archived, created_at_utc)
VALUES 
  ('prj_internal_acq', 'cust_internal', 'INT-AKQUISE', 'Kundenakquise & Vertrieb', 'Akquise, Kundengespräche & Angebote', 0.0, 0.0, 0.0, 1, 0, datetime('now')),
  ('prj_internal_acc', 'cust_internal', 'INT-BUCHHALTUNG', 'Buchhaltung, Steuern & Finanzen', 'Belegwesen, Buchhaltung & GoBD Administration', 0.0, 0.0, 0.0, 1, 0, datetime('now')),
  ('prj_internal_rd',  'cust_internal', 'INT-RECHERCHE', 'Wissensaufbau & Technologierecherche', 'Recherche, Weiterbildung & Zertifizierungen', 0.0, 0.0, 0.0, 1, 0, datetime('now')),
  ('prj_internal_it',  'cust_internal', 'INT-IT-ORGA', 'Interne IT, Tools & Administration', 'Wartung von internen Systemen und Workflows', 0.0, 0.0, 0.0, 1, 0, datetime('now'));
