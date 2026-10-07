import { Env } from "../types";
import { jsonResponse, errorResponse, isDemoRequest } from "../utils/http";
import { logAuditEvent } from "../utils/audit";
import { ensureSettings } from "../services/db_bootstrap.service";
import {
  fetchLexwareWithRetry,
  getEffectiveLexwareApiKey,
  registerLexwareWebhooks,
  syncFullLexwareStatus,
  handleLexwareWebhook,
} from "../services/lexware.service";

export async function handleSettingsRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  if (path === "/api/v1/webhooks/lexware" && method === "POST") {
    return handleLexwareWebhook(request, env);
  }

  if (path === "/api/v1/settings/register-lexware-webhooks" && method === "POST") {
    return registerLexwareWebhooks(request, env);
  }

  if (path === "/api/v1/sync/full-lexware-status" && method === "POST") {
    return syncFullLexwareStatus(env);
  }

  if (path === "/api/v1/settings" && method === "GET") {
    await ensureSettings(env);
    const isDemo = isDemoRequest(request);

    if (isDemo) {
      return jsonResponse({
        id: "global_config",
        mileage_rate_business: 0.3,
        commute_rate_tier1: 0.3,
        commute_rate_tier2: 0.38,
        vma_rate_8h: 14.0,
        vma_rate_24h: 28.0,
        pdf_storage_mode: env.FILE_STORAGE_MODE || 'R2',
        email_sender_name: "Max Mustercontoso | Cloud & Security Architecture",
        email_sender_email: "max.mustercontoso@mail1.contoso.com",
        email_service: "resend",
        email_api_key: "",
        email_subject_template: "Freigabe Leistungsnachweis {period} für Projekt {projectName}",
        email_body_template: "",
        email_reminder1_subject:
          "1. Erinnerung: Freigabe Leistungsnachweis {period} für Projekt {projectName}",
        email_reminder1_body: "",
        email_reminder2_subject:
          "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})",
        email_reminder2_body: "",
        email_admin_notify_rejection: 1,
        email_admin_notify_reminder: 1,
        use_signature_on_documents: 1,
        contractor_title: "Senior Cloud & Security Architect",
        company_name: "Contoso Cloud & Security Architecture GmbH",
        contractor_name: "Max Mustercontoso",
        company_street: "Contoso Allee 100",
        company_zip: "10115",
        company_city: "Berlin",
        company_address: "Contoso Allee 100, 10115 Berlin",
        company_type: "Freiberufler",
        tax_assessment_type: "EÜR",
        tax_number: "34/123/45678",
        vat_id: "DE123456789",
        w_idnr: "",
        taxation_type: "Ist-Versteuerung",
        enable_ai_vision: 1,
        billing_provider: "lexware",
        chart_of_accounts: "SKR04",
        tax_mode: "standard",
        datev_consultant_number: "1001",
        datev_client_number: "10001",
        lexware_webhook_callback_url: "",
      });
    }

    const defaultEmailBody = `Sehr geehrte(r) {contactPerson},\n\nfür das Projekt "{projectName}" ({customerName}) liegt der Tätigkeits- und Leistungsnachweis für den Abrechnungszeitraum {period} zur Prüfung und Freigabe bereit.\n\nÜbersicht:\n• Projekt: {projectName}\n• Zeitraum: {period}\n• Geleistete Stunden: {hours} Std.\n• Gesamtbetrag (Netto): {amountNet} €\n\nBitte prüfen und signieren Sie den Leistungsnachweis über folgenden Freigabelink:\n{approvalLink}\n\nMit freundlichen Grüßen,\n{senderName}`;
    const defaultReminder1Body = `Sehr geehrte(r) {contactPerson},\n\nwir möchten Sie kurz an die ausstehende Prüfung des Leistungsnachweises für das Projekt "{projectName}" ({period}) erinnern.\n\nLink zur Ansicht & Freigabe:\n{approvalLink}\n\nMit freundlichen Grüßen,\n{senderName}`;
    const defaultReminder2Body = `Sehr geehrte(r) {contactPerson},\n\nwir möchten Sie freundlich daran erinnern, dass die Freigabe des Leistungsnachweises für das Projekt "{projectName}" ({period}) noch aussteht.\n\nBitte prüfen und bestätigen Sie die Posten zeitnah unter folgendem Link:\n{approvalLink}\n\nMit freundlichen Grüßen,\n{senderName}`;

    const settings = await env.DB.prepare(
      "SELECT * FROM app_settings WHERE id = 'global_config'"
    ).first<any>();
    const resSettings = settings || {
      id: "global_config",
      mileage_rate_business: 0.3,
      commute_rate_tier1: 0.3,
      commute_rate_tier2: 0.38,
      vma_rate_8h: 14.0,
      vma_rate_24h: 28.0,
      pdf_storage_mode: "R2",
      email_sender_name: "Max Mustermann | IT Consulting",
      email_sender_email: "noreply@example.com",
      email_service: "resend",
      email_api_key: "",
      email_subject_template: "Freigabe Leistungsnachweis {period} für Projekt {projectName}",
      email_body_template: defaultEmailBody,
      email_reminder1_subject:
        "1. Erinnerung: Freigabe Leistungsnachweis {period} für Projekt {projectName}",
      email_reminder1_body: defaultReminder1Body,
      email_reminder2_subject:
        "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})",
      email_reminder2_body: defaultReminder2Body,
      email_admin_notify_rejection: 1,
      email_admin_notify_reminder: 1,
      use_signature_on_documents: 1,
      billing_provider: "lexware",
      chart_of_accounts: "SKR04",
      tax_mode: "standard",
      datev_consultant_number: "1001",
      datev_client_number: "10001",
      company_name: "Musterfirma IT Consulting",
      contractor_name: "Max Mustermann",
      company_street: "Musterstraße 1",
      company_zip: "10115",
      company_city: "Berlin",
      company_address: "Musterstraße 1, 10115 Berlin",
      company_type: "Freiberufler",
      tax_assessment_type: "EÜR",
      contractor_title: "Senior Cloud & Security Architect",
    };
    if (!resSettings.email_body_template || resSettings.email_body_template.trim() === "") {
      resSettings.email_body_template = defaultEmailBody;
    }
    if (
      !resSettings.email_reminder1_body ||
      resSettings.email_reminder1_body.trim() === "" ||
      resSettings.email_reminder1_body.trim().length < 65
    ) {
      resSettings.email_reminder1_body = defaultReminder1Body;
    }
    if (
      !resSettings.email_reminder2_body ||
      resSettings.email_reminder2_body.trim() === "" ||
      resSettings.email_reminder2_body.trim().length < 65
    ) {
      resSettings.email_reminder2_body = defaultReminder2Body;
    }
    resSettings.has_env_lexware_key = !!(env.LEXWARE_API_KEY && env.LEXWARE_API_KEY.trim());
    resSettings.pdf_storage_mode = env.FILE_STORAGE_MODE || 'R2';
    return jsonResponse(resSettings);
  }

  if (path === "/api/v1/settings" && method === "PUT") {
    await ensureSettings(env);
    const body = (await request.json()) as any;
    const now = new Date().toISOString();

    const existing = await env.DB.prepare(
      "SELECT * FROM app_settings WHERE id = 'global_config'"
    ).first<any>();

    await env.DB.prepare(`
      UPDATE app_settings
      SET mileage_rate_business = ?,
          commute_rate_tier1 = ?,
          commute_rate_tier2 = ?,
          vma_rate_8h = ?,
          vma_rate_24h = ?,
          pdf_storage_mode = ?,
          email_sender_name = ?,
          email_sender_email = ?,
          email_service = ?,
          email_api_key = ?,
          email_subject_template = ?,
          email_body_template = ?,
          email_reminder1_subject = ?,
          email_reminder1_body = ?,
          email_reminder2_subject = ?,
          email_reminder2_body = ?,
          email_admin_notify_rejection = ?,
          email_admin_notify_reminder = ?,
          contractor_signature_data_url = ?,
          use_signature_on_documents = ?,
          contractor_title = ?,
          lexware_webhook_callback_url = ?,
          billing_provider = ?,
          chart_of_accounts = ?,
          tax_mode = ?,
          datev_consultant_number = ?,
          datev_client_number = ?,
          company_name = ?,
          contractor_name = ?,
          company_street = ?,
          company_zip = ?,
          company_city = ?,
          company_address = ?,
          company_type = ?,
          tax_assessment_type = ?,
          tax_number = ?,
          vat_id = ?,
          w_idnr = ?,
          taxation_type = ?,
          enable_ai_vision = ?,
          ai_vision_model = ?,
          ai_pdf_model = ?,
          ai_auto_provider_detect = ?,
          ai_custom_rules_json = ?,
          default_transport_type = ?,
          lexware_api_key = ?,
          lexware_own_vendor_id = ?,
          gemini_api_key = ?,
          gemini_model = ?,
          ai_prompt_image = ?,
          ai_prompt_pdf = ?,
          foreign_rates_custom_json = ?,
          vehicle_planning_json = ?,
          updated_at_utc = ?
      WHERE id = 'global_config'
    `)
      .bind(
        body.mileage_rate_business !== undefined
          ? parseFloat(body.mileage_rate_business)
          : (existing?.mileage_rate_business ?? 0.3),
        body.commute_rate_tier1 !== undefined
          ? parseFloat(body.commute_rate_tier1)
          : (existing?.commute_rate_tier1 ?? 0.3),
        body.commute_rate_tier2 !== undefined
          ? parseFloat(body.commute_rate_tier2)
          : (existing?.commute_rate_tier2 ?? 0.38),
        body.vma_rate_8h !== undefined
          ? parseFloat(body.vma_rate_8h)
          : (existing?.vma_rate_8h ?? 14.0),
        body.vma_rate_24h !== undefined
          ? parseFloat(body.vma_rate_24h)
          : (existing?.vma_rate_24h ?? 28.0),
        env.FILE_STORAGE_MODE || 'R2',
        body.email_sender_name ||
          existing?.email_sender_name ||
          "Max Mustermann | IT Consulting",
        body.email_sender_email || existing?.email_sender_email || "noreply@example.com",
        body.email_service || existing?.email_service || "resend",
        body.email_api_key !== undefined ? body.email_api_key : (existing?.email_api_key || ""),
        body.email_subject_template ||
          existing?.email_subject_template ||
          "Freigabe Leistungsnachweis {period} für Projekt {projectName}",
        body.email_body_template !== undefined
          ? body.email_body_template
          : (existing?.email_body_template || ""),
        body.email_reminder1_subject ||
          existing?.email_reminder1_subject ||
          "1. Erinnerung: Freigabe Leistungsnachweis {period} für Projekt {projectName}",
        body.email_reminder1_body !== undefined
          ? body.email_reminder1_body
          : (existing?.email_reminder1_body || ""),
        body.email_reminder2_subject ||
          existing?.email_reminder2_subject ||
          "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})",
        body.email_reminder2_body !== undefined
          ? body.email_reminder2_body
          : (existing?.email_reminder2_body || ""),
        body.email_admin_notify_rejection !== undefined
          ? body.email_admin_notify_rejection
            ? 1
            : 0
          : (existing?.email_admin_notify_rejection ?? 1),
        body.email_admin_notify_reminder !== undefined
          ? body.email_admin_notify_reminder
            ? 1
            : 0
          : (existing?.email_admin_notify_reminder ?? 1),
        body.contractor_signature_data_url !== undefined
          ? body.contractor_signature_data_url
          : (existing?.contractor_signature_data_url || null),
        body.use_signature_on_documents !== undefined
          ? body.use_signature_on_documents
            ? 1
            : 0
          : (existing?.use_signature_on_documents ?? 1),
        body.contractor_title ||
          existing?.contractor_title ||
          "Senior Cloud & Security Architect",
        body.lexware_webhook_callback_url !== undefined
          ? body.lexware_webhook_callback_url
          : (existing?.lexware_webhook_callback_url || `${new URL(request.url).origin}/api/v1/webhooks/lexware`),
        body.billing_provider || existing?.billing_provider || "lexware",
        body.chart_of_accounts || existing?.chart_of_accounts || "SKR04",
        body.tax_mode || existing?.tax_mode || "standard",
        body.datev_consultant_number || existing?.datev_consultant_number || "1001",
        body.datev_client_number || existing?.datev_client_number || "10001",
        body.company_name ||
          existing?.company_name ||
          "Musterfirma IT Consulting",
        body.contractor_name || existing?.contractor_name || "Max Mustermann",
        body.company_street || existing?.company_street || "Musterstraße 1",
        body.company_zip || existing?.company_zip || "10115",
        body.company_city || existing?.company_city || "Berlin",
        body.company_address ||
          existing?.company_address ||
          "Musterstraße 1, 10115 Berlin",
        body.company_type || existing?.company_type || "Freiberufler",
        body.tax_assessment_type || existing?.tax_assessment_type || "EÜR",
        body.tax_number !== undefined ? body.tax_number : (existing?.tax_number || ""),
        body.vat_id !== undefined ? body.vat_id : (existing?.vat_id || ""),
        body.w_idnr !== undefined ? body.w_idnr : (existing?.w_idnr || ""),
        body.taxation_type || existing?.taxation_type || "Ist-Versteuerung",
        body.enable_ai_vision !== undefined
          ? body.enable_ai_vision
            ? 1
            : 0
          : (existing?.enable_ai_vision ?? 1),
        body.ai_vision_model ||
          existing?.ai_vision_model ||
          "@cf/meta/llama-3.2-11b-vision-instruct",
        body.ai_pdf_model || existing?.ai_pdf_model || "@cf/meta/llama-3.1-8b-instruct",
        body.ai_auto_provider_detect !== undefined
          ? body.ai_auto_provider_detect
            ? 1
            : 0
          : (existing?.ai_auto_provider_detect ?? 1),
        body.ai_custom_rules_json !== undefined
          ? typeof body.ai_custom_rules_json === "string"
            ? body.ai_custom_rules_json
            : JSON.stringify(body.ai_custom_rules_json)
          : (existing?.ai_custom_rules_json || "[]"),
        body.default_transport_type || existing?.default_transport_type || "Train",
        body.lexware_api_key !== undefined
          ? body.lexware_api_key
          : (existing?.lexware_api_key || ""),
        body.lexware_own_vendor_id !== undefined
          ? body.lexware_own_vendor_id
          : (existing?.lexware_own_vendor_id || ""),
        body.gemini_api_key !== undefined
          ? body.gemini_api_key
          : (existing?.gemini_api_key || ""),
        body.gemini_model || existing?.gemini_model || "gemini-3.1-flash-lite-preview",
        body.ai_prompt_image !== undefined
          ? body.ai_prompt_image
          : (existing?.ai_prompt_image || ""),
        body.ai_prompt_pdf !== undefined ? body.ai_prompt_pdf : (existing?.ai_prompt_pdf || ""),
        body.foreign_rates_custom_json !== undefined
          ? typeof body.foreign_rates_custom_json === "string"
            ? body.foreign_rates_custom_json
            : JSON.stringify(body.foreign_rates_custom_json)
          : (existing?.foreign_rates_custom_json || "{}"),
        body.vehicle_planning_json !== undefined
          ? typeof body.vehicle_planning_json === "string"
            ? body.vehicle_planning_json
            : JSON.stringify(body.vehicle_planning_json)
          : (existing?.vehicle_planning_json || "{}"),
        now
      )
      .run();

    await logAuditEvent(env, {
      eventType: "SETTINGS_UPDATED",
      entityType: "system_settings",
      entityId: "global_config",
      actor: "Admin",
      description: `Globale Einstellungen & Firmendaten aktualisiert.`,
    });

    return jsonResponse({ success: true, message: "Einstellungen erfolgreich gespeichert!" });
  }

  if (path === "/api/v1/settings/test-lexware-connection" && method === "POST") {
    let testKey = "";
    try {
      const body = (await request.json()) as any;
      if (body?.apiKey && body.apiKey.trim()) testKey = body.apiKey.trim();
    } catch {}

    if (!testKey) {
      testKey = await getEffectiveLexwareApiKey(env, request);
    }

    if (!testKey) {
      return errorResponse("Kein Lexware API-Schlüssel übergeben oder hinterlegt.", 400);
    }

    try {
      const profileRes = await fetchLexwareWithRetry("https://api.lexware.io/v1/profile", {
        headers: {
          Authorization: `Bearer ${testKey}`,
          Accept: "application/json",
        },
      });

      if (!profileRes.ok) {
        const errTxt = await profileRes.text();
        return errorResponse(`Lexware antwortet mit Fehler (${profileRes.status}): ${errTxt}`, 400);
      }

      const profileData = (await profileRes.json()) as any;
      return jsonResponse({
        success: true,
        companyName: profileData.companyName || profileData.name || "Lexware Organisation",
        email: profileData.email || "",
        message: "Verbindung zu Lexware Office erfolgreich hergestellt.",
      });
    } catch (err: any) {
      return errorResponse(`Verbindungsfehler zu Lexware: ${err?.message || err}`, 500);
    }
  }

  if (path === "/api/v1/settings/import-lexware-profile" && method === "POST") {
    await ensureSettings(env);
    const apiKey = await getEffectiveLexwareApiKey(env, request);
    if (!apiKey) return errorResponse("Kein LEXWARE_API_KEY konfiguriert oder hinterlegt.", 400);

    try {
      const profileRes = await fetchLexwareWithRetry("https://api.lexware.io/v1/profile", {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });

      let compName = "Musterfirma IT Consulting";
      let contName = "Max Mustermann";
      let street = "Musterstraße 1";
      let zip = "10115";
      let city = "Berlin";
      let address = "Musterstraße 1, 10115 Berlin";
      let taxNum = "";
      let vatId = "";

      if (profileRes.ok) {
        const pData = (await profileRes.json()) as any;
        if (pData.companyName || pData.name) compName = pData.companyName || pData.name;
        if (pData.contactPerson) contName = pData.contactPerson;
        if (pData.street) street = pData.street;
        if (pData.zip) zip = pData.zip;
        if (pData.city) city = pData.city;
        if (street && zip && city) address = `${street}, ${zip} ${city}`;
        if (pData.taxNumber) taxNum = pData.taxNumber;
        if (pData.vatId) vatId = pData.vatId;
      }

      const now = new Date().toISOString();
      await env.DB.prepare(`
        UPDATE app_settings
        SET company_name = ?,
            contractor_name = ?,
            company_street = ?,
            company_zip = ?,
            company_city = ?,
            company_address = ?,
            tax_number = COALESCE(NULLIF(?, ''), tax_number),
            vat_id = COALESCE(NULLIF(?, ''), vat_id),
            updated_at_utc = ?
        WHERE id = 'global_config'
      `)
        .bind(compName, contName, street, zip, city, address, taxNum, vatId, now)
        .run();

      return jsonResponse({
        success: true,
        message: "Firmendaten erfolgreich aus Lexware Office importiert!",
        profile: {
          company_name: compName,
          contractor_name: contName,
          company_address: address,
          tax_number: taxNum,
          vat_id: vatId,
        },
      });
    } catch (lexErr: any) {
      return errorResponse(`Lexware-Import fehlgeschlagen: ${lexErr?.message || lexErr}`, 500);
    }
  }

  if (path === "/api/v1/settings/lexware-vendors" && method === "GET") {
    await ensureSettings(env);
    const apiKey = await getEffectiveLexwareApiKey(env, request);
    if (!apiKey)
      return jsonResponse({
        success: true,
        vendors: [],
        message: "Kein LEXWARE_API_KEY konfiguriert",
      });

    try {
      const res = await fetchLexwareWithRetry("https://api.lexware.io/v1/contacts", {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      if (!res.ok) {
        return errorResponse(`Fehler beim Abrufen der Kontakte (${res.status})`, 400);
      }
      const data = (await res.json()) as any;
      const allContacts = data.content || [];

      const vendors = allContacts
        .filter((c: any) => c.roles && c.roles.vendor)
        .map((c: any) => {
          const name =
            c.company?.name ||
            `${c.person?.firstName || ""} ${c.person?.lastName || ""}`.trim() ||
            "Unbekannt";
          const vendorNumber = c.roles?.vendor?.number || "";
          const note = c.note || "";
          const isSuggested =
            name.toLowerCase().includes("eigen") ||
            note.toLowerCase().includes("eigen");
          return {
            id: c.id,
            name,
            vendorNumber,
            note,
            isSuggested,
          };
        });

      const suggested = vendors.find((v: any) => v.isSuggested);
      return jsonResponse({
        vendors,
        suggestedVendorId: suggested?.id || null,
        suggestedVendorNumber: suggested?.vendorNumber || null,
        suggestedName: suggested?.name || null,
      });
    } catch (err: any) {
      return errorResponse(`Fehler beim Abrufen der Lieferanten: ${err.message}`, 500);
    }
  }

  return null;
}
