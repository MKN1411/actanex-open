import { Env, AuditEvent } from "../types";

export async function logAuditEvent(
  env: Env,
  {
    eventType,
    entityType,
    entityId,
    actor,
    description,
    dataPayload
  }: AuditEvent & { dataPayload?: any }
): Promise<void> {
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO audit_events (id, event_type, entity_type, entity_id, actor, description, data_payload_json, timestamp_utc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      eventType,
      entityType || 'general',
      entityId || null,
      actor || 'System',
      description || '',
      dataPayload ? JSON.stringify(dataPayload) : null,
      now
    ).run();
  } catch (err: any) {
    console.error("Audit log error:", err?.message || err);
  }
}
