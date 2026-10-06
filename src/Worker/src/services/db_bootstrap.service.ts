import { Env } from "../types";
import { hashPassword } from "../utils/crypto";

let isSettingsEnsured = false;
let isProjectColumnsEnsured = false;
let isInternalOrgEnsured = false;
let isDbBootstrapped = false;

export async function ensureAuthTables(env: Env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        full_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Admin',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at_utc TEXT NOT NULL,
        last_login_utc TEXT
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        token TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        expires_at_utc TEXT NOT NULL,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `).run();

    const isDemo = Boolean(
      (env as any).ENVIRONMENT === "demo" ||
      env.APP_NAME?.toLowerCase().includes("demo") ||
      env.GITHUB_REPO_NAME?.toLowerCase().includes("demo")
    );
    const isOpen = Boolean(
      (env as any).ENVIRONMENT === "open" ||
      env.APP_NAME?.toLowerCase().includes("open") ||
      env.GITHUB_REPO_NAME?.toLowerCase().includes("open")
    );

    if (isDemo) {
      // In DEMO-Showcase: admin@example.com / Start123! bereitstellen
      try {
        const demoExists = await env.DB.prepare("SELECT id FROM users WHERE LOWER(email) = 'admin@example.com'").first();
        if (!demoExists) {
          const demoSalt = "f5de90270b9f7d2cb8efea3b9ff63eda";
          const demoHash = "e6c33c123794cd954f17331d81efe78dd889af0f0dc346a6b18a21608d494c527371202d847ab9e7d4d1c6a5e6a2d097e04c48635719c5ff06165e567d89b7e9";
          await env.DB.prepare(`
            INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
            VALUES ('usr_demo_admin', 'admin@example.com', ?, ?, 'Max Mustermann', 'Admin', 1, ?)
          `).bind(demoHash, demoSalt, new Date().toISOString()).run().catch(() => {});
        }
      } catch {}
    } else {
      // Community Edition Greenfield Bootstrap: initialer Admin aus Worker Secrets oder Standard
      const adminEmail = ((env as any).ADMIN_INITIAL_EMAIL || "").trim().toLowerCase();
      const adminPassword = (env as any).ADMIN_INITIAL_PASSWORD;
      const adminFullName = (env as any).ADMIN_INITIAL_NAME || "Administrator";

      if (adminEmail && adminPassword) {
        // Sicherstellen, dass der im Wizard konfigurierte Master-Admin existiert
        const existingAdmin = await env.DB.prepare("SELECT id FROM users WHERE LOWER(email) = ?").bind(adminEmail).first();
        if (!existingAdmin) {
          const saltBytes = new Uint8Array(16);
          crypto.getRandomValues(saltBytes);
          const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, "0")).join("");
          const passwordHash = await hashPassword(adminPassword, salt);
          await env.DB.prepare(`
            INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
            VALUES (?, ?, ?, ?, ?, 'Admin', 1, ?)
          `).bind(`usr_admin_${crypto.randomUUID().slice(0, 8)}`, adminEmail, passwordHash, salt, adminFullName, new Date().toISOString()).run().catch(() => {});
        }
      } else {
        const userCount = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first<{ count: number }>();
        if (!userCount || userCount.count === 0) {
          const defaultSalt = "f5de90270b9f7d2cb8efea3b9ff63eda";
          const defaultHash = "e6c33c123794cd954f17331d81efe78dd889af0f0dc346a6b18a21608d494c527371202d847ab9e7d4d1c6a5e6a2d097e04c48635719c5ff06165e567d89b7e9";
          await env.DB.prepare(`
            INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
            VALUES ('usr_init_admin', 'admin@example.com', ?, ?, 'Administrator', 'Admin', 1, ?)
          `).bind(defaultHash, defaultSalt, new Date().toISOString()).run().catch(() => {});
        }
      }
    }
  } catch (err) {
    console.error("Auth tables init error:", err);
  }
}

export async function ensureSettings(env: Env) {
  if (isSettingsEnsured) return;
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        mileage_rate_business REAL NOT NULL DEFAULT 0.30,
        commute_rate_tier1 REAL NOT NULL DEFAULT 0.30,
        commute_rate_tier2 REAL NOT NULL DEFAULT 0.38,
        vma_rate_8h REAL NOT NULL DEFAULT 14.00,
        vma_rate_24h REAL NOT NULL DEFAULT 28.00,
        pdf_storage_mode TEXT NOT NULL DEFAULT 'R2',
        email_sender_name TEXT DEFAULT 'Max Mustermann | IT Consulting',
        email_sender_email TEXT DEFAULT 'noreply@example.com',
        email_service TEXT DEFAULT 'resend',
        email_api_key TEXT DEFAULT '',
        email_subject_template TEXT DEFAULT 'Freigabe Leistungsnachweis {period} für Projekt {projectName}',
        email_body_template TEXT,
        email_reminder1_subject TEXT DEFAULT '1. Erinnerung: Freigabe Leistungsnachweis {period} für Projekt {projectName}',
        email_reminder1_body TEXT,
        email_reminder2_subject TEXT DEFAULT '2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})',
        email_reminder2_body TEXT,
        email_admin_notify_rejection INTEGER DEFAULT 1,
        email_admin_notify_reminder INTEGER DEFAULT 1,
        contractor_signature_data_url TEXT,
        use_signature_on_documents INTEGER DEFAULT 1,
        contractor_title TEXT DEFAULT 'Senior Cloud & Security Architect',
        updated_at_utc TEXT NOT NULL
      )
    `).run();

    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN contractor_signature_data_url TEXT;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN use_signature_on_documents INTEGER DEFAULT 1;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN contractor_title TEXT DEFAULT 'Senior Cloud & Security Architect';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN lexware_webhook_callback_url TEXT;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN billing_provider TEXT DEFAULT 'lexware';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN chart_of_accounts TEXT DEFAULT 'SKR04';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN tax_mode TEXT DEFAULT 'standard';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN datev_consultant_number TEXT DEFAULT '1001';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN datev_client_number TEXT DEFAULT '10001';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_name TEXT DEFAULT 'Musterfirma IT Consulting';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN contractor_name TEXT DEFAULT 'Max Mustermann';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_street TEXT DEFAULT 'Musterstraße 1';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_zip TEXT DEFAULT '10115';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_city TEXT DEFAULT 'Berlin';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_address TEXT DEFAULT 'Musterstraße 1, 10115 Berlin';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN company_type TEXT DEFAULT 'Freiberufler';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN tax_assessment_type TEXT DEFAULT 'EÜR';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN tax_number TEXT DEFAULT '';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN vat_id TEXT DEFAULT '';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN w_idnr TEXT DEFAULT '';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN taxation_type TEXT DEFAULT 'Ist-Versteuerung';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN enable_ai_vision INTEGER DEFAULT 1;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_vision_model TEXT DEFAULT '@cf/meta/llama-3.2-11b-vision-instruct';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_pdf_model TEXT DEFAULT '@cf/meta/llama-3.1-8b-instruct';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_auto_provider_detect INTEGER DEFAULT 1;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_custom_rules_json TEXT DEFAULT '[]';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN lexware_api_key TEXT DEFAULT '';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN lexware_own_vendor_id TEXT DEFAULT '';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN gemini_api_key TEXT DEFAULT '';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN gemini_model TEXT DEFAULT 'gemini-3.1-flash-lite-preview';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_prompt_image TEXT DEFAULT '';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN ai_prompt_pdf TEXT DEFAULT '';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN vehicle_planning_json TEXT DEFAULT '{}';").run(); } catch {}

    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT OR IGNORE INTO app_settings (id, mileage_rate_business, commute_rate_tier1, commute_rate_tier2, vma_rate_8h, vma_rate_24h, pdf_storage_mode, email_sender_name, email_sender_email, email_service, email_api_key, email_subject_template, billing_provider, chart_of_accounts, tax_mode, datev_consultant_number, datev_client_number, updated_at_utc)
      VALUES ('global_config', 0.30, 0.30, 0.38, 14.00, 28.00, 'R2', 'Max Mustermann | IT Consulting', 'noreply@example.com', 'resend', '', 'Freigabe Leistungsnachweis {period} für Projekt {projectName}', 'lexware', 'SKR04', 'standard', '1001', '10001', ?)
    `).bind(now).run();

    const isDemoOrOpen = Boolean(
      env.APP_NAME?.toLowerCase().includes("demo") ||
      env.GITHUB_REPO_NAME?.toLowerCase().includes("demo") ||
      env.APP_NAME?.toLowerCase().includes("open") ||
      env.GITHUB_REPO_NAME?.toLowerCase().includes("open")
    );
    if (isDemoOrOpen) {
      try {
        await env.DB.prepare(`
          UPDATE app_settings
          SET contractor_name = 'Max Mustermann',
              company_name = 'Musterfirma IT Consulting (Demo)',
              company_street = 'Musterstraße 1',
              company_zip = '10115',
              company_city = 'Berlin',
              company_address = 'Musterstraße 1, 10115 Berlin',
              email_sender_name = 'ActaNex Demo-System',
              email_sender_email = 'noreply@example.com',
              contractor_signature_data_url = NULL
          WHERE id = 'global_config' OR id = '1' OR id = 1
        `).run();
      } catch {}
    }

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id TEXT PRIMARY KEY,
        timesheet_id TEXT NOT NULL,
        email TEXT NOT NULL,
        otp_code_hash TEXT NOT NULL,
        expires_at_utc TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        is_verified INTEGER NOT NULL DEFAULT 0,
        created_at_utc TEXT NOT NULL
      )
    `).run();

    isSettingsEnsured = true;
  } catch (err) {
    console.error("Settings initialization error:", err);
  }
}

export async function ensureProjectColumns(env: Env) {
  if (isProjectColumnsEnsured) return;
  try {
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN end_customer_name TEXT;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN approver_2_email TEXT;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN approver_2_name TEXT;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN approver_3_email TEXT;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN approver_3_name TEXT;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN parent_project_id TEXT;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN hierarchy_level INTEGER DEFAULT 1;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN budget_mode TEXT DEFAULT 'Dedicated';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN travel_budget_net REAL DEFAULT 0.0;").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN travel_budget_mode TEXT DEFAULT 'Dedicated';").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN updated_at_utc TEXT;").run(); } catch {}
    isProjectColumnsEnsured = true;
  } catch (err) {
    console.error("ensureProjectColumns error:", err);
  }
}

export async function ensureTripExpenses(env: Env) {
  try {
    try {
      const colCheck = await env.DB.prepare("PRAGMA table_info(trip_expenses)").all<any>();
      const cols = (colCheck.results || []).map((c: any) => c.name);
      if (cols.length > 0 && !cols.includes("expense_date")) {
        await env.DB.prepare("DROP TABLE trip_expenses").run();
      }
    } catch {}

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trip_expenses (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        expense_date TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        skr04_account TEXT NOT NULL,
        amount_gross REAL NOT NULL,
        amount_net REAL NOT NULL,
        tax_rate REAL NOT NULL,
        tax_amount REAL NOT NULL,
        receipt_r2_key TEXT,
        receipt_filename TEXT,
        receipt_mime_type TEXT,
        is_billable_to_client INTEGER NOT NULL DEFAULT 1,
        is_synced_to_lexware INTEGER NOT NULL DEFAULT 0,
        lexware_voucher_id TEXT,
        lexware_voucher_number TEXT,
        lexware_status TEXT DEFAULT 'open',
        is_voucher_canceled INTEGER DEFAULT 0,
        voucher_canceled_at_utc TEXT,
        created_at_utc TEXT NOT NULL
      )
    `).run();

    try { await env.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN lexware_voucher_number TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN lexware_status TEXT DEFAULT 'open'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN is_voucher_canceled INTEGER DEFAULT 0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trip_expenses ADD COLUMN voucher_canceled_at_utc TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN return_date TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN total_days INTEGER DEFAULT 1").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN origin TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN destination TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN ticket_cost REAL DEFAULT 0.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN contact_person TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN destination_address TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN origin_address TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN travel_type TEXT DEFAULT 'BusinessTrip'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN departure_time TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN arrival_time TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN vma_amount REAL DEFAULT 0.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN has_breakfast INTEGER DEFAULT 0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN hotel_cost REAL DEFAULT 0.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN parking_cost REAL DEFAULT 0.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN is_billable_to_client INTEGER DEFAULT 1").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN is_internal_expense_only INTEGER DEFAULT 0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN lexware_vma_voucher_id TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN lexware_vma_voucher_number TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN lexware_travel_voucher_id TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN lexware_travel_voucher_number TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN lexware_quotation_status TEXT DEFAULT 'open'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN lexware_order_confirmation_status TEXT DEFAULT 'open'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_invoice_paid INTEGER DEFAULT 0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN invoice_paid_at_utc TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_archived INTEGER DEFAULT 0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_number TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_date TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN return_location TEXT").run(); } catch {}
    
    // Trip Legs & Planning
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trip_legs (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        leg_order INTEGER NOT NULL DEFAULT 1,
        date_leg TEXT NOT NULL,
        start_location TEXT NOT NULL,
        destination_location TEXT NOT NULL,
        transport_type TEXT NOT NULL DEFAULT 'Train',
        distance_km REAL DEFAULT 0.0,
        rate_per_km REAL DEFAULT 0.0,
        travel_cost_net REAL DEFAULT 0.0,
        layover_hours REAL DEFAULT 0.0,
        layover_purpose TEXT,
        customer_id TEXT,
        project_id TEXT,
        is_billable_to_client INTEGER NOT NULL DEFAULT 1,
        created_at_utc TEXT NOT NULL
      )
    `).run();

    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN status TEXT NOT NULL DEFAULT 'Completed'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN is_round_trip INTEGER NOT NULL DEFAULT 0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN total_planned_cost_net REAL DEFAULT 0.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN breakfast_days_json TEXT DEFAULT '[]'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN default_transport_type TEXT DEFAULT 'Train'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN is_foreign_trip INTEGER NOT NULL DEFAULT 0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN foreign_country TEXT DEFAULT ''").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN foreign_city TEXT DEFAULT ''").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN foreign_rates_json TEXT DEFAULT '{}'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trips ADD COLUMN meal_deductions_json TEXT DEFAULT '{}'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trip_legs ADD COLUMN country TEXT DEFAULT ''").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trip_legs ADD COLUMN destination_city TEXT DEFAULT ''").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trip_legs ADD COLUMN currency TEXT DEFAULT 'EUR'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trip_legs ADD COLUMN exchange_rate REAL DEFAULT 1.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE trip_legs ADD COLUMN exchange_rate_proof TEXT DEFAULT ''").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE app_settings ADD COLUMN foreign_rates_custom_json TEXT DEFAULT '{}'").run(); } catch {}
  } catch (err: any) {
    console.error("trip_expenses init error:", err?.message || err);
  }
}

export async function ensureOperationalVouchers(env: Env) {
  try {
    try {
      const colCheck = await env.DB.prepare("PRAGMA table_info(operational_vouchers)").all<any>();
      const cols = (colCheck.results || []).map((c: any) => c.name);
      if (cols.length > 0 && !cols.includes("project_id")) {
        await env.DB.prepare("DROP TABLE operational_vouchers").run();
      }
    } catch {}

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS operational_vouchers (
        id TEXT PRIMARY KEY,
        voucher_number TEXT NOT NULL UNIQUE,
        voucher_type TEXT NOT NULL,
        voucher_date TEXT NOT NULL,
        supplier_name TEXT NOT NULL,
        description TEXT NOT NULL,
        business_purpose TEXT NOT NULL,
        project_id TEXT,
        customer_id TEXT,
        is_billable_to_client INTEGER NOT NULL DEFAULT 0,
        amount_gross REAL NOT NULL DEFAULT 0.0,
        amount_net REAL NOT NULL DEFAULT 0.0,
        tax_rate REAL NOT NULL DEFAULT 19.0,
        tax_amount REAL NOT NULL DEFAULT 0.0,
        tip_amount REAL NOT NULL DEFAULT 0.0,
        total_attendees_count INTEGER DEFAULT 1,
        business_attendees_count INTEGER DEFAULT 1,
        business_share_percent REAL DEFAULT 100.0,
        tax_deductible_net REAL DEFAULT 0.0,
        tax_non_deductible_net REAL DEFAULT 0.0,
        private_share_gross REAL DEFAULT 0.0,
        attendees_json TEXT,
        location_address TEXT,
        is_own_receipt INTEGER NOT NULL DEFAULT 0,
        own_receipt_reason TEXT,
        transport_type TEXT,
        distance_km REAL DEFAULT 0.0,
        origin_address TEXT,
        destination_address TEXT,
        parent_hospitality_voucher_id TEXT,
        skr04_account TEXT NOT NULL DEFAULT '4650',
        skr03_account TEXT NOT NULL DEFAULT '4650',
        receipt_r2_key TEXT,
        receipt_filename TEXT,
        receipt_mime_type TEXT,
        payment_slip_r2_key TEXT,
        payment_slip_filename TEXT,
        payment_slip_total_gross REAL DEFAULT 0.0,
        payment_method TEXT DEFAULT 'Card_NFC',
        secondary_attachment_r2_key TEXT,
        secondary_attachment_filename TEXT,
        voucher_pdf_r2_key TEXT,
        voucher_pdf_hash_sha256 TEXT,
        is_synced_to_lexware INTEGER NOT NULL DEFAULT 0,
        lexware_voucher_id TEXT,
        lexware_voucher_number TEXT,
        lexware_status TEXT DEFAULT 'open',
        status TEXT DEFAULT 'Verified',
        created_at_utc TEXT NOT NULL,
        updated_at_utc TEXT
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS voucher_upload_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        status TEXT NOT NULL DEFAULT 'waiting',
        uploaded_files_json TEXT DEFAULT '[]',
        ai_extracted_json TEXT,
        expires_at_utc TEXT NOT NULL,
        created_at_utc TEXT NOT NULL
      )
    `).run();

    try { await env.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN status TEXT DEFAULT 'Verified'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN tax19_gross REAL DEFAULT 0.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN tax7_gross REAL DEFAULT 0.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN tax19_amount REAL DEFAULT 0.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN tax7_amount REAL DEFAULT 0.0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE operational_vouchers ADD COLUMN trip_id TEXT").run(); } catch {}
  } catch (err: any) {
    console.error("ensureOperationalVouchers error:", err?.message || err);
  }
}

export async function ensureInternalOrgAndProjects(env: Env) {
  if (isInternalOrgEnsured) return;
  try {
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT OR IGNORE INTO customers (id, lexware_contact_id, name, contact_person, email, street, zip_code, city, country_code, is_active, is_archived, created_at_utc, updated_at_utc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind('cust_internal', 'INTERNAL_ORG', '[INTERN] Eigene Organisation & Administration', 'Max Mustermann', 'admin@example.com', '', '', '', 'DE', 1, 0, now, now).run();

    const internalProjs = [
      { id: 'prj_internal_acq', nr: 'INT-AKQUISE', name: 'Kundenakquise & Vertrieb', desc: 'Akquise, Kundengespräche & Angebote' },
      { id: 'prj_internal_acc', nr: 'INT-BUCHHALTUNG', name: 'Buchhaltung, Steuern & Finanzen', desc: 'Belegwesen, Buchhaltung & GoBD Administration' },
      { id: 'prj_internal_rd',  nr: 'INT-RECHERCHE', name: 'Wissensaufbau & Technologierecherche', desc: 'Recherche, Weiterbildung & Zertifizierungen' },
      { id: 'prj_internal_it',  nr: 'INT-IT-ORGA', name: 'Interne IT, Tools & Administration', desc: 'Wartung von internen Systemen und Workflows' }
    ];

    for (const ip of internalProjs) {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO projects (id, customer_id, project_number, name, default_hourly_rate, planned_hours, total_budget_net, lexware_service_article_id, approver_email, approver_name, is_active, is_archived, created_at_utc)
        VALUES (?, ?, ?, ?, 0.0, 0.0, 0.0, 'INTERNAL', 'admin@example.com', 'Max Mustermann', 1, 0, ?)
      `).bind(ip.id, 'cust_internal', ip.nr, ip.name, now).run();
    }

    isInternalOrgEnsured = true;
  } catch (err: any) {
    console.error("Internal org initialization error:", err?.message || err);
  }
}

export async function ensureDemoSeedData(env: Env) {
  try {
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT OR IGNORE INTO customers (id, lexware_contact_id, name, customer_number, contact_person, email, street, zip_code, city, is_active, is_archived, created_at_utc) VALUES 
      ('cust_demo_01', 'lex_cust_01', '[DEMO] Contoso Cloud Architecture GmbH', 'KD-10042', 'Dr. Markus Muster', 'markus.muster@mail1.contoso.com', 'Contoso Allee 100', '10115', 'Berlin', 1, 0, ?),
      ('cust_demo_02', 'lex_cust_02', '[DEMO] Contoso Logistics & Mobility AG', 'KD-10043', 'Sarah Musterfrau', 'sarah.musterfrau@mail2.contoso.com', 'Speicherstraße 42', '80335', 'München', 1, 0, ?),
      ('cust_demo_03', 'lex_cust_03', '[DEMO] Contoso Financial Security SE', 'KD-10044', 'Michael Mustermann', 'michael.mustermann@mail1.contoso.com', 'Finanzplatz 1', '60311', 'Frankfurt am Main', 1, 0, ?)
    `).bind(now, now, now).run().catch(() => {});

    await env.DB.prepare(`
      INSERT OR IGNORE INTO projects (id, customer_id, name, project_number, default_hourly_rate, planned_hours, total_budget_net, start_date, end_date, is_active, is_archived, created_at_utc, lexware_quotation_number, lexware_order_confirmation_id, lexware_service_article_id, approver_email, approver_name) VALUES 
      ('prj_demo_01', 'cust_demo_01', '[DEMO] - M365 & Azure Security Transformation', 'PRJ-2026-DEMO-01', 120.00, 160.00, 19200.00, '2026-06-01', '2026-12-31', 1, 0, ?, 'ANG-2026-054', 'AB-2026-081', 'ART-IT-ARCH', 'markus.muster@mail1.contoso.com', 'Dr. Markus Muster'),
      ('prj_demo_02', 'cust_demo_02', '[DEMO] - Microservice Event Hub Migration', 'PRJ-2026-DEMO-02', 110.00, 120.00, 13200.00, '2026-06-01', '2026-11-30', 1, 0, ?, 'ANG-2026-055', 'AB-2026-082', 'ART-CLOUD-ENG', 'sarah.musterfrau@mail2.contoso.com', 'Sarah Musterfrau'),
      ('prj_demo_03', 'cust_demo_03', '[DEMO] - Zero-Trust & GoBD Audit Readiness', 'PRJ-2026-DEMO-03', 130.00, 100.00, 13000.00, '2026-07-01', '2026-10-31', 1, 0, ?, 'ANG-2026-056', 'AB-2026-083', 'ART-SEC-AUDIT', 'michael.mustermann@mail1.contoso.com', 'Michael Mustermann')
    `).bind(now, now, now).run().catch(() => {});
  } catch (err: any) {
    console.error("Demo seed error:", err?.message || err);
  }
}

export async function purgeDemoDataFromProduction(env: Env) {
  try {
    await env.DB.prepare("DELETE FROM approvals WHERE timesheet_version_id LIKE 'ts_demo_%' OR timesheet_version_id IN (SELECT id FROM timesheet_versions WHERE project_id LIKE 'prj_demo_%')").run().catch(() => {});
    await env.DB.prepare("DELETE FROM time_entries WHERE id LIKE 'te_demo_%' OR project_id LIKE 'prj_demo_%'").run().catch(() => {});
    await env.DB.prepare("DELETE FROM trips WHERE id LIKE 'trip_demo_%' OR project_id LIKE 'prj_demo_%'").run().catch(() => {});
    await env.DB.prepare("DELETE FROM timesheet_versions WHERE id LIKE 'ts_demo_%' OR project_id LIKE 'prj_demo_%'").run().catch(() => {});
    await env.DB.prepare("DELETE FROM projects WHERE id LIKE 'prj_demo_%' OR customer_id LIKE 'cust_demo_%'").run().catch(() => {});
    await env.DB.prepare("DELETE FROM customers WHERE id LIKE 'cust_demo_%'").run().catch(() => {});
  } catch (err: any) {
    console.error("Purge demo error:", err?.message || err);
  }
}

export async function ensureCoreDatabase(env: Env) {
  if (isDbBootstrapped) return;
  try {
    // 1. Ensure Auth and Settings
    await ensureAuthTables(env);
    await ensureSettings(env);

    // 2. Ensure Core Tables
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        lexware_contact_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        contact_person TEXT,
        email TEXT,
        street TEXT,
        zip_code TEXT,
        city TEXT,
        country_code TEXT DEFAULT 'DE',
        vat_id TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_archived INTEGER NOT NULL DEFAULT 0,
        customer_number TEXT,
        created_at_utc TEXT NOT NULL,
        updated_at_utc TEXT
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        project_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        purchase_order_number TEXT,
        contract_number TEXT,
        default_hourly_rate REAL NOT NULL DEFAULT 120.00,
        lexware_service_article_id TEXT NOT NULL,
        billing_interval_minutes INTEGER NOT NULL DEFAULT 15,
        approver_email TEXT NOT NULL,
        approver_name TEXT,
        travel_time_billable INTEGER NOT NULL DEFAULT 0,
        travel_time_rate_multiplier REAL NOT NULL DEFAULT 1.0,
        public_transit_reimbursable INTEGER NOT NULL DEFAULT 1,
        planned_hours REAL NOT NULL DEFAULT 0.0,
        total_budget_net REAL NOT NULL DEFAULT 0.0,
        start_date TEXT,
        end_date TEXT,
        lexware_quotation_id TEXT,
        lexware_quotation_number TEXT,
        lexware_order_confirmation_id TEXT,
        lexware_order_confirmation_number TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        is_archived INTEGER NOT NULL DEFAULT 0,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS timesheet_versions (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        version_number INTEGER NOT NULL DEFAULT 1,
        period TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Draft',
        total_actual_hours REAL NOT NULL DEFAULT 0.0,
        total_billable_hours REAL NOT NULL DEFAULT 0.0,
        total_billable_travel_hours REAL NOT NULL DEFAULT 0.0,
        total_reimbursable_expenses REAL NOT NULL DEFAULT 0.0,
        total_amount_net REAL NOT NULL DEFAULT 0.0,
        data_hash_sha256 TEXT NOT NULL,
        pdf_hash_sha256 TEXT,
        pdf_r2_storage_key TEXT,
        xlsx_hash_sha256 TEXT,
        xlsx_r2_storage_key TEXT,
        supersedes_version_id TEXT,
        rejection_reason TEXT,
        lexware_invoice_id TEXT,
        lexware_invoice_number TEXT,
        is_invoice_canceled INTEGER NOT NULL DEFAULT 0,
        invoice_canceled_at_utc TEXT,
        approval_method TEXT,
        approved_by TEXT,
        approved_at_utc TEXT,
        created_at_utc TEXT NOT NULL,
        submitted_at_utc TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
        UNIQUE(project_id, period, version_number)
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        timesheet_version_id TEXT,
        entry_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        break_minutes INTEGER NOT NULL DEFAULT 0,
        actual_duration_hours REAL NOT NULL,
        billable_duration_hours REAL NOT NULL,
        category TEXT NOT NULL,
        location TEXT NOT NULL DEFAULT 'Remote',
        short_description TEXT NOT NULL,
        task_or_ticket_reference TEXT,
        is_billable INTEGER NOT NULL DEFAULT 1,
        billing_rate_snapshot REAL NOT NULL,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE SET NULL
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS activity_evidences (
        id TEXT PRIMARY KEY,
        time_entry_id TEXT NOT NULL UNIQUE,
        problem_statement TEXT NOT NULL,
        methodology TEXT NOT NULL,
        technical_activity TEXT NOT NULL,
        result TEXT NOT NULL,
        responsibility TEXT NOT NULL DEFAULT 'Eigenverantwortliche Konzeption & Durchführung',
        deliverable TEXT,
        FOREIGN KEY (time_entry_id) REFERENCES time_entries(id) ON DELETE CASCADE
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        timesheet_version_id TEXT,
        trip_date TEXT NOT NULL,
        purpose TEXT NOT NULL,
        expense_type TEXT NOT NULL DEFAULT 'PublicTransit',
        origin_location TEXT NOT NULL,
        destination_location TEXT NOT NULL,
        distance_km REAL NOT NULL DEFAULT 0.0,
        rate_per_km REAL NOT NULL DEFAULT 0.30,
        actual_departure_utc TEXT NOT NULL,
        actual_arrival_utc TEXT NOT NULL,
        total_absence_hours REAL NOT NULL,
        elapsed_travel_hours REAL NOT NULL,
        work_time_during_travel_hours REAL NOT NULL DEFAULT 0.0,
        billable_travel_hours REAL NOT NULL DEFAULT 0.0,
        customer_reimbursable_cost REAL NOT NULL DEFAULT 0.0,
        total_actual_cost REAL NOT NULL DEFAULT 0.0,
        vma_amount REAL DEFAULT 0.0,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE SET NULL
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS trip_segments (
        id TEXT PRIMARY KEY,
        trip_id TEXT NOT NULL,
        sequence_number INTEGER NOT NULL,
        travel_mode TEXT NOT NULL,
        from_location TEXT NOT NULL,
        to_location TEXT NOT NULL,
        departure_time TEXT NOT NULL,
        arrival_time TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        operator_and_line TEXT,
        receipt_id TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        trip_id TEXT,
        project_id TEXT,
        receipt_date TEXT NOT NULL,
        merchant_name TEXT NOT NULL,
        amount_net REAL NOT NULL,
        vat_rate REAL NOT NULL DEFAULT 19.0,
        amount_gross REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'EUR',
        is_customer_reimbursable INTEGER NOT NULL DEFAULT 1,
        r2_storage_key TEXT NOT NULL UNIQUE,
        file_name TEXT NOT NULL,
        content_type TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        sha256_hash TEXT NOT NULL,
        retention_class TEXT NOT NULL DEFAULT 'AccountingEvidence',
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        timesheet_version_id TEXT NOT NULL UNIQUE,
        decision TEXT NOT NULL,
        method TEXT NOT NULL DEFAULT 'CloudflareZeroTrustOtp',
        approver_email TEXT NOT NULL,
        approver_name TEXT,
        comment TEXT,
        bound_document_hash_sha256 TEXT NOT NULL,
        client_ip TEXT,
        user_agent TEXT,
        decision_at_utc TEXT NOT NULL,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE RESTRICT
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS billing_batches (
        id TEXT PRIMARY KEY,
        timesheet_version_id TEXT NOT NULL,
        project_id TEXT NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        lexware_invoice_id TEXT,
        invoice_number TEXT,
        billed_hours REAL NOT NULL,
        billed_expenses_net REAL NOT NULL,
        total_billed_amount_net REAL NOT NULL,
        is_finalized_in_lexware INTEGER NOT NULL DEFAULT 0,
        draft_created_utc TEXT NOT NULL,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE RESTRICT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE RESTRICT
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        actor TEXT NOT NULL,
        description TEXT NOT NULL,
        data_payload_json TEXT,
        timestamp_utc TEXT NOT NULL
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS monthly_archive_seals (
        id TEXT PRIMARY KEY,
        period TEXT UNIQUE NOT NULL,
        sealed_at_utc TEXT NOT NULL,
        sealed_by TEXT NOT NULL,
        total_events_count INTEGER NOT NULL DEFAULT 0,
        merkle_root_hash TEXT NOT NULL,
        is_locked INTEGER NOT NULL DEFAULT 1
      )
    `).run();

    await ensureOperationalVouchers(env);
    await ensureTripExpenses(env);
    await ensureProjectColumns(env);

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS invoice_documents (
        id TEXT PRIMARY KEY,
        timesheet_version_id TEXT NOT NULL,
        document_type TEXT NOT NULL,
        file_name TEXT NOT NULL,
        r2_key TEXT NOT NULL,
        file_size_bytes INTEGER NOT NULL,
        sha256_hash TEXT NOT NULL,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (timesheet_version_id) REFERENCES timesheet_versions(id) ON DELETE CASCADE
      )
    `).run();

    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS project_approvers (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        email TEXT NOT NULL,
        name TEXT,
        role_description TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at_utc TEXT NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `).run();

    try { await env.DB.prepare("ALTER TABLE time_entries ADD COLUMN billing_type TEXT NOT NULL DEFAULT 'Billable'").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE projects ADD COLUMN description TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN pdf_frozen_hash TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN frozen_at_utc TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN signed_document_r2_key TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN signed_document_filename TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN reminder_1_sent_at_utc TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN reminder_2_sent_at_utc TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_invoice_paid INTEGER DEFAULT 0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN invoice_paid_at_utc TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN is_archived INTEGER DEFAULT 0").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_number TEXT").run(); } catch {}
    try { await env.DB.prepare("ALTER TABLE timesheet_versions ADD COLUMN external_invoice_date TEXT").run(); } catch {}

    // Ensure internal organization customer exists
    await env.DB.prepare(`
      INSERT OR IGNORE INTO customers (id, lexware_contact_id, name, customer_number, contact_person, email, street, zip_code, city, is_active, is_archived, created_at_utc)
      VALUES ('cust_internal', 'lex_cust_internal', '[INTERN] Eigene Organisation & Administration', 'INT-0001', 'Selbst', 'admin@example.com', 'Musterstraße 1', '20095', 'Hamburg', 1, 0, '2026-05-01T08:00:00.000Z')
    `).run().catch(() => {});

    isDbBootstrapped = true;
  } catch (err) {
    console.error("ensureCoreDatabase error:", err);
  }
}
