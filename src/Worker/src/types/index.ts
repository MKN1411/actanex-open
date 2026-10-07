export interface Env {
  DB: D1Database;
  STORAGE?: R2Bucket;
  FILE_STORAGE_MODE?: 'R2' | 'D1';
  DOCUMENTS_BUCKET?: R2Bucket;
  APP_NAME: string;
  APP_VERSION: string;
  ACTANEX_RELEASE_ID?: string;
  ACTANEX_MANAGED_SCHEMA?: string;
  GITHUB_REPO_OWNER: string;
  GITHUB_REPO_NAME: string;
  GITHUB_DISPATCH_TOKEN?: string;
  LEXWARE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  RESEND_API_KEY?: string;
  JWT_SECRET?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  AI?: any;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuditEvent {
  eventType: string;
  entityType?: string;
  entityId?: string;
  actor?: string;
  description: string;
}

export interface AppSettings {
  id: string;
  mileage_rate_business: number;
  commute_rate_tier1: number;
  commute_rate_tier2: number;
  vma_rate_8h: number;
  vma_rate_24h: number;
  pdf_storage_mode: string;
  email_sender_name: string;
  email_sender_email: string;
  email_service: string;
  email_api_key?: string;
  email_subject_template?: string;
  email_body_template?: string;
  email_reminder1_subject?: string;
  email_reminder1_body?: string;
  email_reminder2_subject?: string;
  email_reminder2_body?: string;
  email_admin_notify_rejection?: number;
  email_admin_notify_reminder?: number;
  use_signature_on_documents?: number;
  billing_provider: string;
  chart_of_accounts: string;
  tax_mode: string;
  datev_consultant_number?: string;
  datev_client_number?: string;
  company_name?: string;
  contractor_name?: string;
  company_street?: string;
  company_zip?: string;
  company_city?: string;
  company_address?: string;
  company_type?: string;
  tax_assessment_type?: string;
  contractor_title?: string;
  has_env_lexware_key?: boolean;
}
