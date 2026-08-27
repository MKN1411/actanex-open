-- ============================================================================
-- FREELANCER EVIDENCE & BILLING HUB - DEMO & SHOWCASE SEED DATA (v2.7.0 LTS)
-- 100% Contoso Dummy Data & Complete Lifecycle Showcase (Juni, Juli, August 2026)
-- ============================================================================

PRAGMA foreign_keys = OFF;

-- 1. Demo Global Settings
INSERT OR REPLACE INTO app_settings (
    id, mileage_rate_business, commute_rate_tier1, commute_rate_tier2,
    vma_rate_8h, vma_rate_24h, pdf_storage_mode, updated_at_utc,
    email_sender_name, email_sender_email, email_service, email_api_key,
    email_subject_template, email_body_template,
    email_reminder1_subject, email_reminder1_body,
    email_reminder2_subject, email_reminder2_body,
    email_admin_notify_rejection, email_admin_notify_reminder,
    contractor_signature_data_url, contractor_title,
    billing_provider, chart_of_accounts,
    tax_mode, datev_consultant_number, datev_client_number
) VALUES (
    'global_config', 0.30, 0.30, 0.38, 14.00, 28.00, 'R2', '2026-08-22T10:00:00.000Z',
    'Max Mustermann | IT Architecture & Cloud Security', 'max.mustermann@mail1.contoso.com', 'mailchannels', '',
    'Freigabe Leistungsnachweis {period} für Projekt {projectName}', 'Sehr geehrte(r) {contactPerson},

für das Projekt "{projectName}" ({customerName}) liegt der Tätigkeits- und Leistungsnachweis für den Abrechnungszeitraum {period} zur Prüfung und Freigabe bereit.

Übersicht:
• Projekt: {projectName}
• Zeitraum: {period}
• Geleistete Stunden: {hours} Std.
• Gesamtbetrag (Netto): {amountNet} €

Bitte prüfen und signieren Sie den Leistungsnachweis über folgenden Freigabelink:
{approvalLink}

Mit freundlichen Grüßen,
{senderName}',
    '1. Erinnerung: Freigabe Leistungsnachweis {period}', 'Sehr geehrte(r) {contactPerson}, bitte prüfen Sie den Nachweis.',
    '2. Dringende Erinnerung: Leistungsnachweis {period}', 'Sehr geehrte(r) {contactPerson}, bitte prüfen Sie den Nachweis zeitnah.',
    1, 1, '', 'Senior Enterprise Cloud & Security Architect',
    'none', 'SKR04',
    'standard', '1001', '10001'
);

-- 2. Demo Customers (3 Contoso Muster-Mandanten)
INSERT OR REPLACE INTO customers (id, lexware_contact_id, name, customer_number, contact_person, email, street, zip_code, city, is_active, is_archived, created_at_utc) VALUES 
('cust_demo_01', 'lex_cust_01', '[DEMO] Contoso Cloud Architecture GmbH', 'KD-10042', 'Dr. Markus Muster', 'markus.muster@mail1.contoso.com', 'Contoso Allee 100', '10115', 'Berlin', 1, 0, '2026-05-01T08:00:00.000Z'),
('cust_demo_02', 'lex_cust_02', '[DEMO] Contoso Logistics & Mobility AG', 'KD-10043', 'Sarah Musterfrau', 'sarah.musterfrau@mail2.contoso.com', 'Speicherstraße 42', '80335', 'München', 1, 0, '2026-05-01T08:00:00.000Z'),
('cust_demo_03', 'lex_cust_03', '[DEMO] Contoso Financial Security SE', 'KD-10044', 'Michael Mustermann', 'michael.mustermann@mail1.contoso.com', 'Finanzplatz 1', '60311', 'Frankfurt am Main', 1, 0, '2026-05-01T08:00:00.000Z');

-- Interne Organisation
INSERT OR REPLACE INTO customers (id, lexware_contact_id, name, customer_number, contact_person, email, street, zip_code, city, is_active, is_archived, created_at_utc) VALUES
('cust_internal', 'lex_cust_internal', '[INTERN] Eigene Organisation & Administration', 'INT-0001', 'Selbst', 'admin@example.com', 'Musterstraße 1', '20095', 'Hamburg', 1, 0, '2026-05-01T08:00:00.000Z');

-- 3. Demo Projects
INSERT OR REPLACE INTO projects (
    id, customer_id, name, project_number, default_hourly_rate, planned_hours, total_budget_net,
    start_date, end_date, is_active, is_archived, created_at_utc,
    lexware_quotation_number, lexware_order_confirmation_id, lexware_service_article_id, approver_email, approver_name
) VALUES 
('prj_demo_01', 'cust_demo_01', '[DEMO] - M365 & Azure Security Transformation', 'PRJ-2026-DEMO-01', 120.00, 160.00, 19200.00, '2026-06-01', '2026-12-31', 1, 0, '2026-06-01T08:00:00.000Z', 'ANG-2026-054', 'AB-2026-081', 'ART-IT-ARCH', 'markus.muster@mail1.contoso.com', 'Dr. Markus Muster'),
('prj_demo_02', 'cust_demo_02', '[DEMO] - Microservice Event Hub Migration', 'PRJ-2026-DEMO-02', 110.00, 120.00, 13200.00, '2026-06-01', '2026-11-30', 1, 0, '2026-06-01T08:00:00.000Z', 'ANG-2026-055', 'AB-2026-082', 'ART-CLOUD-ENG', 'sarah.musterfrau@mail2.contoso.com', 'Sarah Musterfrau'),
('prj_demo_03', 'cust_demo_03', '[DEMO] - Zero-Trust & GoBD Audit Readiness', 'PRJ-2026-DEMO-03', 130.00, 100.00, 13000.00, '2026-07-01', '2026-10-31', 1, 0, '2026-07-01T08:00:00.000Z', 'ANG-2026-056', 'AB-2026-083', 'ART-SEC-AUDIT', 'michael.mustermann@mail1.contoso.com', 'Michael Mustermann');

-- Interne Projekte
INSERT OR REPLACE INTO projects (id, customer_id, name, project_number, default_hourly_rate, planned_hours, total_budget_net, is_active, is_archived, created_at_utc, lexware_service_article_id, approver_email) VALUES
('prj_internal_acc', 'cust_internal', 'Buchhaltung, Steuern & Finanzen', 'INT-BUCHHALTUNG', 0.00, 0.00, 0.00, 1, 0, '2026-05-01T08:00:00.000Z', 'ART-INTERNAL', 'admin@example.com'),
('prj_internal_it', 'cust_internal', 'Interne IT, Tools & Administration', 'INT-IT-ORGA', 0.00, 0.00, 0.00, 1, 0, '2026-05-01T08:00:00.000Z', 'ART-INTERNAL', 'admin@example.com'),
('prj_internal_acq', 'cust_internal', 'Kundenakquise & Vertrieb', 'INT-AKQUISE', 0.00, 0.00, 0.00, 1, 0, '2026-05-01T08:00:00.000Z', 'ART-INTERNAL', 'admin@example.com'),
('prj_internal_rd', 'cust_internal', 'Wissensaufbau & Technologierecherche', 'INT-RECHERCHE', 0.00, 0.00, 0.00, 1, 0, '2026-05-01T08:00:00.000Z', 'ART-INTERNAL', 'admin@example.com');

-- 4. Demo Stundenzettel-Versionen (Vollständiger GoBD-Lebenszyklus: Fakturiert, Freigegeben & Zur Prüfung)
INSERT OR REPLACE INTO timesheet_versions (
    id, project_id, version_number, period, status, total_actual_hours, total_billable_hours,
    total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256,
    created_at_utc, submitted_at_utc, approved_at_utc, approved_by, approval_method,
    lexware_invoice_id, lexware_invoice_number, is_invoice_canceled
) VALUES 
-- Juni 2026: Fakturiert (4.200,00 €)
('ts_demo_2026_06_01', 'prj_demo_01', 1, '2026-06', 'Invoiced', 35.0, 35.0, 0.0, 0.0, 4200.00,
 'a93f52b801a2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef012345678',
 '2026-06-30T18:00:00.000Z', '2026-07-01T08:00:00.000Z', '2026-07-02T10:15:00.000Z',
 'Dr. Markus Muster (markus.muster@mail1.contoso.com)', 'OTP_SIGNATURE',
 'inv_demo_2026_06_01', 'RE-2026-06-0089', 0),

-- Juli 2026: Fakturiert Projekt 1 (4.800,00 €)
('ts_demo_2026_07_01', 'prj_demo_01', 1, '2026-07', 'Invoiced', 40.0, 40.0, 0.0, 0.0, 4800.00,
 'b82c19a405ef6172839405162738495a6b7c8d9e0f123456789abcdef0123456',
 '2026-07-31T18:00:00.000Z', '2026-08-01T08:00:00.000Z', '2026-08-03T11:00:00.000Z',
 'Dr. Markus Muster (markus.muster@mail1.contoso.com)', 'OTP_SIGNATURE',
 'inv_demo_2026_07_01', 'RE-2026-07-0104', 0),

-- Juli 2026: Fakturiert Projekt 2 (3.300,00 €)
('ts_demo_2026_07_02', 'prj_demo_02', 1, '2026-07', 'Invoiced', 30.0, 30.0, 0.0, 0.0, 3300.00,
 'c71a39f201dd485960718293a4b5c6d7e8f90123456789abcdef0123456789ab',
 '2026-07-31T18:00:00.000Z', '2026-08-01T08:00:00.000Z', '2026-08-04T14:30:00.000Z',
 'Sarah Musterfrau (sarah.musterfrau@mail2.contoso.com)', 'OTP_SIGNATURE',
 'inv_demo_2026_07_02', 'RE-2026-07-0105', 0),

-- August 2026: Zur Freigabe bereitgestellt (PendingSignature - 2.860,00 €)
('ts_demo_2026_08_03', 'prj_demo_03', 1, '2026-08', 'PendingSignature', 22.0, 22.0, 0.0, 0.0, 2860.00,
 'd94e18a201cc5869708192a3b4c5d6e7f80123456789abcdef0123456789abcd',
 '2026-08-20T17:00:00.000Z', '2026-08-21T09:00:00.000Z', NULL,
 NULL, 'OTP_SIGNATURE',
 NULL, NULL, 0);

-- 5. Demo Zeiteinträge (Historisch fakturiert & Aktuell offen)
INSERT OR REPLACE INTO time_entries (
    id, project_id, timesheet_version_id, entry_date, start_time, end_time,
    break_minutes, actual_duration_hours, billable_duration_hours, category,
    short_description, task_or_ticket_reference, is_billable, billing_rate_snapshot,
    created_at_utc, location, billing_type
) VALUES 
-- JUNI 2026 (Fakturiert)
('te_demo_jun_01', 'prj_demo_01', 'ts_demo_2026_06_01', '2026-06-08', '08:30', '17:30', 60, 8.0, 8.0, 'Architecture',
 '[DEMO] - Initiales M365 Governance Audit & Baseline-Definition', 'ADR-001 Baseline Audit', 1, 120.00, '2026-06-08T17:30:00.000Z', 'Remote', 'Billable'),
('te_demo_jun_02', 'prj_demo_01', 'ts_demo_2026_06_01', '2026-06-15', '09:00', '18:00', 60, 8.0, 8.0, 'SecurityDesign',
 '[DEMO] - Microsoft Purview Information Protection Klassifizierung', 'ADR-002 Purview Labels', 1, 120.00, '2026-06-15T18:00:00.000Z', 'Remote', 'Billable'),
('te_demo_jun_03', 'prj_demo_01', 'ts_demo_2026_06_01', '2026-06-22', '08:30', '18:00', 30, 9.0, 9.0, 'Implementation',
 '[DEMO] - Defender for Cloud Apps Session Control Richtlinien', 'ADR-003 Cloud Apps', 1, 120.00, '2026-06-22T18:00:00.000Z', 'Remote', 'Billable'),
('te_demo_jun_04', 'prj_demo_01', 'ts_demo_2026_06_01', '2026-06-29', '08:00', '18:30', 30, 10.0, 10.0, 'Workshop',
 '[DEMO] - Security Operations Center Runbook Übergabe & Abnahme', 'ADR-004 SOC Runbook', 1, 120.00, '2026-06-29T18:30:00.000Z', 'OnSite', 'Billable'),

-- JULI 2026 (Fakturiert Projekt 1)
('te_demo_jul_01', 'prj_demo_01', 'ts_demo_2026_07_01', '2026-07-06', '08:00', '18:30', 30, 10.0, 10.0, 'Architecture',
 '[DEMO] - Zero-Trust Landing Zone Hub-Spoke Netzwerkdesign', 'ADR-005 Landing Zone Hub', 1, 120.00, '2026-07-06T18:30:00.000Z', 'Remote', 'Billable'),
('te_demo_jul_02', 'prj_demo_01', 'ts_demo_2026_07_01', '2026-07-13', '08:00', '18:30', 30, 10.0, 10.0, 'Engineering',
 '[DEMO] - Terraform CI/CD Deployment für Azure vWAN & Firewall', 'ADR-006 Terraform vWAN', 1, 120.00, '2026-07-13T18:30:00.000Z', 'Remote', 'Billable'),
('te_demo_jul_03', 'prj_demo_01', 'ts_demo_2026_07_01', '2026-07-20', '08:00', '18:30', 30, 10.0, 10.0, 'SecurityDesign',
 '[DEMO] - Entra ID PIM Rollenautomatisierung & Approval-Flows', 'ADR-007 Entra PIM', 1, 120.00, '2026-07-20T18:30:00.000Z', 'Remote', 'Billable'),
('te_demo_jul_04', 'prj_demo_01', 'ts_demo_2026_07_01', '2026-07-27', '08:00', '18:30', 30, 10.0, 10.0, 'Documentation',
 '[DEMO] - Architekturdokumentation & Handover an IT-Betrieb', 'ADR-008 Handover Docs', 1, 120.00, '2026-07-27T18:30:00.000Z', 'OnSite', 'Billable'),

-- JULI 2026 (Fakturiert Projekt 2)
('te_demo_jul_05', 'prj_demo_02', 'ts_demo_2026_07_02', '2026-07-08', '08:30', '19:00', 30, 10.0, 10.0, 'Architecture',
 '[DEMO] - Event Hubs Partitionsstrategie & Throughput Units Sizing', 'ADR-009 EventHub Sizing', 1, 110.00, '2026-07-08T19:00:00.000Z', 'Remote', 'Billable'),
('te_demo_jul_06', 'prj_demo_02', 'ts_demo_2026_07_02', '2026-07-15', '08:30', '19:00', 30, 10.0, 10.0, 'Engineering',
 '[DEMO] - Kafka MirrorMaker 2 Bridge & Resilienz-Testing', 'ADR-010 MirrorMaker2', 1, 110.00, '2026-07-15T19:00:00.000Z', 'Remote', 'Billable'),
('te_demo_jul_07', 'prj_demo_02', 'ts_demo_2026_07_02', '2026-07-22', '08:30', '19:00', 30, 10.0, 10.0, 'Engineering',
 '[DEMO] - Dead-Letter Queueing & Fehlerkompensations-Workflows', 'ADR-011 DLQ Routing', 1, 110.00, '2026-07-22T19:00:00.000Z', 'Remote', 'Billable'),

-- AUGUST 2026 (Zur Freigabe eingereicht: ts_demo_2026_08_03)
('te_demo_aug_01', 'prj_demo_03', 'ts_demo_2026_08_03', '2026-08-04', '08:00', '19:30', 30, 11.0, 11.0, 'Compliance',
 '[DEMO] - GoBD Revisionssicherheits-Auditierung & D1-Hashprüfung', 'ADR-012 GoBD Hash Audit', 1, 130.00, '2026-08-04T19:30:00.000Z', 'OnSite', 'Billable'),
('te_demo_aug_02', 'prj_demo_03', 'ts_demo_2026_08_03', '2026-08-11', '08:00', '19:30', 30, 11.0, 11.0, 'Compliance',
 '[DEMO] - DATEV EXTF 700 Schnittstellenabnahme & Kanzleiprüfung', 'ADR-013 DATEV Abnahme', 1, 130.00, '2026-08-11T19:30:00.000Z', 'OnSite', 'Billable'),

-- AUGUST 2026 (Laufend / Offen / Noch nicht abgerechnet)
('te_demo_01', 'prj_demo_01', NULL, '2026-08-03', '08:30', '13:00', 30, 4.0, 4.0, 'Architecture',
 '[DEMO] - Zero-Trust Landing Zone Konzeption', 'ADR-014 Landing Zone Konzeption', 1, 120.00, '2026-08-03T13:00:00.000Z', 'Remote', 'Billable'),
('te_demo_02', 'prj_demo_01', NULL, '2026-08-05', '09:00', '12:30', 0, 3.5, 3.5, 'SecurityReview',
 '[DEMO] - Entra ID Conditional Access & Tenant-Härtung', 'ADR-015 Conditional Access', 1, 120.00, '2026-08-05T12:30:00.000Z', 'Remote', 'Billable'),
('te_demo_03', 'prj_demo_01', NULL, '2026-08-07', '14:00', '16:00', 0, 2.0, 0.0, 'Architecture',
 '[DEMO] - Architektur-Review & Alignment mit Security Board (Kulanz)', 'ADR-016 Security Board Kulanz', 0, 0.00, '2026-08-07T16:00:00.000Z', 'Remote', 'NonBillableVisible'),
('te_demo_04', 'prj_demo_02', NULL, '2026-08-10', '09:00', '15:30', 30, 6.0, 6.0, 'Implementation',
 '[DEMO] - Event Hub & Service Bus Kafka-Bridge Konfiguration', 'ADR-017 EventHub Konfig', 1, 110.00, '2026-08-10T15:30:00.000Z', 'Remote', 'Billable'),
('te_demo_05', 'prj_demo_03', NULL, '2026-08-12', '08:30', '16:30', 60, 7.0, 7.0, 'Compliance',
 '[DEMO] - GoBD Merkle-Tree Audit Trail Verifikation', 'ADR-018 Merkle-Tree Audit', 1, 130.00, '2026-08-12T16:30:00.000Z', 'OnSite', 'Billable');

-- 6. Demo Activity Evidences (§ 18 EStG) für alle Einträge
INSERT OR REPLACE INTO activity_evidences (
    id, time_entry_id, problem_statement, methodology, technical_activity, result, responsibility, deliverable
) VALUES 
('ev_demo_01', 'te_demo_01',
 'Fehlende netzwerkseitige Segmentierung und unzureichende rollenbasierte IAM-Rollen in Azure.',
 'Architektur-Review nach dem Microsoft Well-Architected Framework & BSI C5 Kriterienkatalog.',
 'Konzeption modularer Terraform-Templates für Azure vWAN Secure Hubs und Entra ID PIM Rollenhierarchien.',
 'Abgenommenes Architektur-Designdokument v1.2 und validierter Terraform-Code mit messbarer Risikominimierung.',
 'Eigenverantwortliche Konzeption & Durchführung',
 'ADR-001 Zero-Trust Landing Zone Blueprint & Terraform Module'),

('ev_demo_02', 'te_demo_02',
 'Sicherheitsrisiken durch veraltete Authentifizierungsprotokolle und unvollständige MFA-Abdeckung.',
 'Threat Modeling und Zero-Trust Reifegradanalyse der Identitätsinfrastruktur.',
 'Entwurf und Konfiguration risikobasierter Conditional Access Richtlinien sowie Implementierung von Break-Glass-Notfallkonten.',
 'Verifizierte Identity-Security-Baseline mit 100 % MFA-Erzwingung für alle privilegierten Administrationsrollen.',
 'Eigenverantwortliche Konzeption & Durchführung',
 'ADR-002 Conditional Access Policy Framework & Break-Glass Runbook'),

('ev_demo_03', 'te_demo_03',
 'Abstimmung regulatorischer Anforderungen mit dem internen Sicherheitsausschuss und CISO-Board.',
 'Moderierter Architektur-Workshop und Risikoabwägung nach BSI IT-Grundschutz.',
 'Präsentation des Zero-Trust-Zielbilds vor dem CISO-Board (als Kulanzleistung ohne Berechnung dokumentiert).',
 'Einstimmige Freigabe des Sicherheitskonzepts durch das IT-Sicherheitsgremium.',
 'Eigenverantwortliche Konzeption & Durchführung',
 'ADR-003 Freigabeprotokoll des IT-Sicherheitsausschusses'),

('ev_demo_04', 'te_demo_04',
 'Hohe Latenzen bei der asynchronen Auftragsverarbeitung im bestehenden Monolithen.',
 'Event-Driven Architecture (EDA) Design Pattern mit Cloud-nativem Message Routing.',
 'Bereitstellung von Azure Event Hubs Namespaces, Partitionierungs-Optimierung und Terraform-Automatisierung.',
 'Lauffähige Event-Pipeline mit einem Durchsatz von > 5.000 Events/Sekunde im Staging-Cluster.',
 'Eigenverantwortliche Konzeption & Durchführung',
 'ADR-004 Event-Driven Kafka Bridge Spezifikation & Terraform Module'),

('ev_demo_05', 'te_demo_05',
 'Nachweis der Unveränderbarkeit von Abrechnungs- und Zeitdaten für Wirtschaftsprüfer und GoBD-Audits.',
 'Kryptografische Verifikation von SHA-256 Hash-Ketten und Merkle-Tree-Wurzeln.',
 'Auditierung der D1-SQL-Auditprotokolle und Validierung des DATEV EXTF 700 Exportstapels.',
 'Vollständig verifizierter Prüfpfad ohne Integritätsbrüche für den gesamten Revisionszeitraum.',
 'Eigenverantwortliche Konzeption & Durchführung',
 'ADR-005 GoBD Systemprüfbericht & DATEV EXTF 700 Prüfprotokoll'),

('ev_demo_jun_01', 'te_demo_jun_01',
 'Unvollständige Sicherheitsrichtlinien für M365 Mandanten gefährdeten regulatorische Vorgaben.',
 'Analyse der Sicherheitskontrollen nach CIS Microsoft 365 Foundations Benchmark v3.0.',
 'Automatisierte Überprüfung von Entra ID, Exchange Online und SharePoint Tenant-Konfigurationen.',
 'Auditbericht mit 100 % Konformitätsmatrix und priorisiertem Maßnahmenkatalog.',
 'Eigenverantwortliche Konzeption & Durchführung', 'ADR-006 CIS Baseline Auditbericht'),

('ev_demo_jul_01', 'te_demo_jul_01',
 'Fehlende Isolation zwischen Entwicklungs- und Produktionsworkloads im Cloud-Netzwerk.',
 'Well-Architected Framework Network Architecture Pattern.',
 'Design der Azure Virtual WAN Topology mit zentraler Next-Gen Firewall Inspektion.',
 'Vollständig segmentiertes Hub-Spoke-Netzwerk mit automatisierter Routing-Tabelle.',
 'Eigenverantwortliche Konzeption & Durchführung', 'ADR-007 Azure vWAN Blueprint');

-- 7. Demo Trips (Reisen & Vor-Ort-Termine)
INSERT OR REPLACE INTO trips (
    id, project_id, timesheet_version_id, trip_date, return_date, total_days,
    departure_time, arrival_time, destination, destination_location, destination_address,
    origin, origin_location, origin_address, travel_type, purpose, contact_person,
    expense_type, distance_km, rate_per_km, actual_departure_utc, actual_arrival_utc,
    total_absence_hours, elapsed_travel_hours, work_time_during_travel_hours, billable_travel_hours,
    ticket_cost, hotel_cost, parking_cost, has_breakfast, vma_amount,
    customer_reimbursable_cost, total_actual_cost, is_billable_to_client, is_internal_expense_only,
    created_at_utc
) VALUES 
('trip_demo_01', 'prj_demo_03', NULL, '2026-08-11', '2026-08-12', 2,
 '07:30', '19:00', 'Frankfurt am Main', 'Frankfurt am Main', 'Finanzplatz 1, 60311 Frankfurt am Main',
 'Hamburg', 'Hamburg', 'Heimatadresse', 'BusinessTrip', '[DEMO] - Vor-Ort GoBD Auditierung & Data-Center Sicherheitsprüfung', 'Michael Mustermann',
 'PublicTransit', 0.0, 0.30, '2026-08-11T07:30:00.000Z', '2026-08-12T19:00:00.000Z',
 35.5, 8.0, 4.0, 2.0,
 142.00, 139.00, 24.00, 1, 42.00,
 347.00, 347.00, 1, 0,
 '2026-08-12T19:00:00.000Z'),

('trip_demo_02', 'prj_demo_01', NULL, '2026-08-18', '2026-08-19', 2,
 '08:00', '20:00', 'Berlin', 'Berlin', 'Contoso Allee 100, 10115 Berlin',
 'Hamburg', 'Hamburg', 'Heimatadresse', 'Conference', '[DEMO] - Cloud Security Summit 2026 & Architektur-Workshop', 'Dr. Markus Muster',
 'PersonalCar', 580.0, 0.30, '2026-08-18T08:00:00.000Z', '2026-08-19T20:00:00.000Z',
 36.0, 6.0, 0.0, 0.0,
 0.00, 155.00, 35.00, 1, 42.00,
 406.00, 406.00, 1, 0,
 '2026-08-19T20:00:00.000Z'),

('trip_demo_03', 'prj_demo_02', NULL, '2026-08-25', '2026-08-25', 1,
 '06:30', '21:30', 'München', 'München', 'Speicherstraße 42, 80335 München',
 'Hamburg', 'Hamburg', 'Heimatadresse', 'CustomerMeeting', '[DEMO] - Microservice Event Hub Migration & Go-Live Review', 'Sarah Musterfrau',
 'PublicTransit', 0.0, 0.30, '2026-08-25T06:30:00.000Z', '2026-08-25T21:30:00.000Z',
 15.0, 4.0, 2.0, 1.0,
 289.00, 0.00, 22.00, 0, 14.00,
 325.00, 325.00, 1, 0,
 '2026-08-25T21:30:00.000Z');

-- 8. Demo Trip Expenses (22 IT-Freelancer-Kategorien nach SKR04)
INSERT OR REPLACE INTO trip_expenses (
    id, trip_id, expense_date, category, description, skr04_account,
    amount_gross, amount_net, tax_rate, tax_amount,
    is_billable_to_client, is_synced_to_lexware, created_at_utc
) VALUES 
-- Trip 1: Frankfurt Data Center Audit
('exp_demo_01', 'trip_demo_01', '2026-08-11', 'Bahnticket_7', '[DEMO] - Deutsche Bahn ICE Hamburg-Frankfurt Hin-/Rückfahrt (7% MwSt)', '4673', 142.00, 132.71, 7.0, 9.29, 1, 0, '2026-08-11T08:00:00.000Z'),
('exp_demo_02', 'trip_demo_01', '2026-08-11', 'Hotel_Logis', '[DEMO] - Steigenberger Frankfurt Übernachtung (Logisanteil 7% MwSt)', '4674', 139.00, 129.91, 7.0, 9.09, 1, 0, '2026-08-11T20:00:00.000Z'),
('exp_demo_03', 'trip_demo_01', '2026-08-12', 'Hotel_Fruehstueck_Business', '[DEMO] - Hotel Frühstücksbuffet / Business Package (19% MwSt)', '4678', 22.00, 18.49, 19.0, 3.51, 1, 0, '2026-08-12T08:30:00.000Z'),
('exp_demo_04', 'trip_demo_01', '2026-08-11', 'Taxi_Fahrdienst', '[DEMO] - Taxi Fahrt Hauptbahnhof zum Rechenzentrum (7% MwSt)', '4673', 28.50, 26.64, 7.0, 1.86, 1, 0, '2026-08-11T11:00:00.000Z'),
('exp_demo_05', 'trip_demo_01', '2026-08-11', 'OePNV_Nahverkehr', '[DEMO] - RMV Tageskarte Frankfurt City (7% MwSt)', '4673', 9.80, 9.16, 7.0, 0.64, 1, 0, '2026-08-11T13:00:00.000Z'),
('exp_demo_06', 'trip_demo_01', '2026-08-11', 'Hardware_Eilbeschaffung', '[DEMO] - USB-C Multiport Adapter & RJ45 Patchkabel (Vor-Ort Notfall)', '4985', 49.90, 41.93, 19.0, 7.97, 1, 0, '2026-08-11T14:30:00.000Z'),
('exp_demo_07', 'trip_demo_01', '2026-08-11', 'Internet_WLAN_Roaming', '[DEMO] - Telekom DataPass 5G Highspeed Day-Flat', '4910', 10.00, 8.40, 19.0, 1.60, 1, 0, '2026-08-11T15:00:00.000Z'),
('exp_demo_08', 'trip_demo_01', '2026-08-11', 'Parkgebuehren', '[DEMO] - Parkhaus Hauptbahnhof Frankfurt Tag 1 & 2', '4673', 24.00, 20.17, 19.0, 3.83, 1, 0, '2026-08-12T18:00:00.000Z'),
('exp_demo_09', 'trip_demo_01', '2026-08-11', 'VMA_Mehrmaegig_Anreise', '[DEMO] - Verpflegungsmehraufwand Anreisetag (14 €)', '4668', 14.00, 14.00, 0.0, 0.00, 1, 0, '2026-08-11T22:00:00.000Z'),
('exp_demo_10', 'trip_demo_01', '2026-08-12', 'VMA_Mehrmaegig_Abreise', '[DEMO] - Verpflegungsmehraufwand Abreisetag abzügl. Frühstück (14 € - 5,60 € = 8,40 €)', '4668', 8.40, 8.40, 0.0, 0.00, 1, 0, '2026-08-12T22:00:00.000Z'),

-- Trip 2: Berlin Cloud Security Summit
('exp_demo_11', 'trip_demo_02', '2026-08-18', 'Konferenzticket_Fachkongress', '[DEMO] - Ticket Cloud Security Summit Berlin 2026', '4945', 490.00, 411.76, 19.0, 78.24, 1, 0, '2026-08-18T09:00:00.000Z'),
('exp_demo_12', 'trip_demo_02', '2026-08-18', 'Coworking_Tagespass', '[DEMO] - Betahaus Berlin Coworking Day Pass', '4210', 35.00, 29.41, 19.0, 5.59, 1, 0, '2026-08-18T10:00:00.000Z'),
('exp_demo_13', 'trip_demo_02', '2026-08-18', 'Hotel_Logis', '[DEMO] - Motel One Berlin Ku''damm Übernachtung (Logisanteil)', '4674', 135.00, 126.17, 7.0, 8.83, 1, 0, '2026-08-18T21:00:00.000Z'),
('exp_demo_14', 'trip_demo_02', '2026-08-19', 'Hotel_Fruehstueck_Business', '[DEMO] - Motel One Frühstücksbuffet (19% MwSt)', '4678', 20.00, 16.81, 19.0, 3.19, 1, 0, '2026-08-19T08:30:00.000Z'),
('exp_demo_15', 'trip_demo_02', '2026-08-18', 'Geschaeftsessen_Bewirtung', '[DEMO] - Fachliches Arbeitsessen mit IT-Leitung Contoso Cloud (70% abzugsfähig)', '4650', 119.00, 100.00, 19.0, 19.00, 1, 0, '2026-08-18T20:30:00.000Z'),
('exp_demo_16', 'trip_demo_02', '2026-08-19', 'Parkgebuehren', '[DEMO] - Parkhaus Messe Berlin Süd', '4673', 35.00, 29.41, 19.0, 5.59, 1, 0, '2026-08-19T17:00:00.000Z'),

-- Trip 3: München Event Hub Workshop & Go-Live
('exp_demo_17', 'trip_demo_03', '2026-08-25', 'Flugticket', '[DEMO] - Lufthansa Flug Hamburg-München Hin-/Rückflug', '4673', 289.00, 242.86, 19.0, 46.14, 1, 0, '2026-08-25T06:30:00.000Z'),
('exp_demo_18', 'trip_demo_03', '2026-08-25', 'Gepaeckgebuehr', '[DEMO] - Sondergepäck für Test-Hardware & IT-Messequipment', '4673', 45.00, 37.82, 19.0, 7.18, 1, 0, '2026-08-25T06:45:00.000Z'),
('exp_demo_19', 'trip_demo_03', '2026-08-25', 'OePNV_Nahverkehr', '[DEMO] - MVV Airport-City Day Ticket München', '4673', 15.50, 14.49, 7.0, 1.01, 1, 0, '2026-08-25T09:00:00.000Z'),
('exp_demo_20', 'trip_demo_03', '2026-08-25', 'Taxi_Fahrdienst', '[DEMO] - Taxi Fahrt Kundenstandort zum Flughafen München', '4673', 42.80, 40.00, 7.0, 2.80, 1, 0, '2026-08-25T19:30:00.000Z'),
('exp_demo_21', 'trip_demo_03', '2026-08-25', 'Parkgebuehren', '[DEMO] - Parkhaus Terminal 2 Hamburg Airport', '4673', 22.00, 18.49, 19.0, 3.51, 1, 0, '2026-08-25T21:45:00.000Z'),
('exp_demo_22', 'trip_demo_03', '2026-08-25', 'VMA_Eintaegig_8h', '[DEMO] - Verpflegungsmehraufwand Tagesreise >8h (14 €)', '4668', 14.00, 14.00, 0.0, 0.00, 1, 0, '2026-08-25T22:00:00.000Z');

-- 9. Demo GoBD Merkle-Root Monatssiegel
INSERT OR REPLACE INTO monthly_archive_seals (
    id, period, sealed_at_utc, sealed_by, total_events_count, merkle_root_hash, is_locked
) VALUES 
('seal_demo_2026_06', '2026-06', '2026-07-01T00:05:00.000Z', 'Max Mustermann (Automatischer GoBD-Monatsabschluss)', 42, 'a3f81e90b7c4d52189e9fa5522b1090cb7e6f8a8472910fa98213e4b09c54e12', 1),
('seal_demo_2026_07', '2026-07', '2026-08-01T00:05:00.000Z', 'Max Mustermann (Automatischer GoBD-Monatsabschluss)', 58, 'b7e21a44c9f0881273d09e1155a4099cb6e1f0a2172938ca98124e5b19c43a88', 1);

-- 10. Demo Admin User (Seed)
INSERT OR REPLACE INTO users (
    id, email, password_hash, salt, full_name, role, is_active, created_at_utc
) VALUES (
    'usr_demo_admin', 'admin@example.com',
    'e6c33c123794cd954f17331d81efe78dd889af0f0dc346a6b18a21608d494c527371202d847ab9e7d4d1c6a5e6a2d097e04c48635719c5ff06165e567d89b7e9',
    'f5de90270b9f7d2cb8efea3b9ff63eda',
    'Max Mustermann', 'Admin', 1, '2026-08-01T00:00:00.000Z'
);

PRAGMA foreign_keys = ON;
