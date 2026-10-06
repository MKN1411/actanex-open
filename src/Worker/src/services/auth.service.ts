import { Env, AuthUser } from "../types";
import { jsonResponse, errorResponse, isDemoRequest } from "../utils/http";
import { hashPassword } from "../utils/crypto";
import { logAuditEvent } from "../utils/audit";
import { ensureAuthTables } from "./db_bootstrap.service";

export async function getAuthenticatedUser(request: Request, env: Env): Promise<AuthUser | null> {
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  try {
    const session = await env.DB.prepare(`
      SELECT s.user_id, u.email, u.full_name, u.role, u.is_active
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND datetime(s.expires_at_utc) > datetime('now')
    `).bind(token).first<any>();
    if (!session || session.is_active === 0) return null;
    return {
      id: session.user_id,
      email: session.email,
      fullName: session.full_name,
      role: session.role
    };
  } catch (err) {
    console.error("Auth check failed:", err);
    return null;
  }
}

export async function handleLogin(request: Request, env: Env): Promise<Response> {
  await ensureAuthTables(env);
  const body = await request.json() as any;
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const rememberMe = !!body.rememberMe;

  if (!email || !password) {
    return errorResponse("Bitte geben Sie Ihre E-Mail-Adresse und Ihr Passwort ein.", 400);
  }

  let user = await env.DB.prepare("SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND is_active = 1").bind(email).first<any>();

  // Demo Admin Self-Healing & Provisioning (Start123!)
  if (email === "admin@example.com") {
    const demoSalt = "f5de90270b9f7d2cb8efea3b9ff63eda";
    const demoHash = "e6c33c123794cd954f17331d81efe78dd889af0f0dc346a6b18a21608d494c527371202d847ab9e7d4d1c6a5e6a2d097e04c48635719c5ff06165e567d89b7e9";
    if (!user || user.password_hash !== demoHash) {
      await env.DB.prepare(`
        INSERT OR REPLACE INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
        VALUES ('usr_demo_admin', 'admin@example.com', ?, ?, 'Max Mustermann', 'Admin', 1, ?)
      `).bind(demoHash, demoSalt, new Date().toISOString()).run().catch(() => {});
      user = await env.DB.prepare("SELECT * FROM users WHERE LOWER(email) = 'admin@example.com' AND is_active = 1").first<any>();
    }
  }

  if (!user) {
    return errorResponse("Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre Eingabe.", 401);
  }

  const computedHash = await hashPassword(password, user.salt);

  if (computedHash !== user.password_hash) {
    return errorResponse("Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre Eingabe.", 401);
  }

  const token = "auth_" + crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const now = new Date();
  const durationDays = rememberMe ? 30 : 1;
  const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(`
    INSERT INTO user_sessions (token, user_id, expires_at_utc, created_at_utc)
    VALUES (?, ?, ?, ?)
  `).bind(token, user.id, expiresAt, now.toISOString()).run();

  await env.DB.prepare("UPDATE users SET last_login_utc = ? WHERE id = ?").bind(now.toISOString(), user.id).run();

  const isDemo = isDemoRequest(request, user.email);
  const isDefault = !isDemo && user.email === 'admin@example.com' && user.salt === 'f5de90270b9f7d2cb8efea3b9ff63eda';

  return jsonResponse({
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role
    },
    requiresCredentialChange: isDefault,
    expiresAt
  });
}

export async function handleLogout(request: Request, env: Env): Promise<Response> {
  await ensureAuthTables(env);
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (token) {
    await env.DB.prepare("DELETE FROM user_sessions WHERE token = ?").bind(token).run();
  }
  return jsonResponse({ success: true, message: "Erfolgreich abgemeldet." });
}

export async function handleGetMe(request: Request, env: Env): Promise<Response> {
  await ensureAuthTables(env);
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return errorResponse("Nicht authentifiziert.", 401);
  }

  const session = await env.DB.prepare(`
    SELECT s.*, u.email, u.full_name, u.role, u.is_active, u.salt
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND datetime(s.expires_at_utc) > datetime('now')
  `).bind(token).first<any>();

  if (!session || session.is_active === 0) {
    return errorResponse("Sitzung abgelaufen oder ungültig.", 401);
  }

  const isDemo = isDemoRequest(request, session.email);
  const isDefault = !isDemo && session.email === 'admin@example.com' && session.salt === 'f5de90270b9f7d2cb8efea3b9ff63eda';

  return jsonResponse({
    authenticated: true,
    user: {
      id: session.user_id,
      email: session.email,
      fullName: session.full_name,
      role: session.role
    },
    requiresCredentialChange: isDefault
  });
}

export async function handleChangeCredentials(request: Request, env: Env): Promise<Response> {
  await ensureAuthTables(env);
  const authHeader = request.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();

  if (!token) {
    return errorResponse("Nicht authentifiziert.", 401);
  }

  const session = await env.DB.prepare(`
    SELECT s.*, u.id as user_id, u.email, u.password_hash, u.salt, u.full_name, u.role
    FROM user_sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND datetime(s.expires_at_utc) > datetime('now')
  `).bind(token).first<any>();

  if (!session) {
    return errorResponse("Sitzung abgelaufen oder ungültig.", 401);
  }

  const body = await request.json() as any;
  const currentPassword = (body.currentPassword || "").trim();
  const newEmail = (body.newEmail || "").trim().toLowerCase();
  const newFullName = (body.newFullName || "").trim();
  const newPassword = (body.newPassword || "").trim();

  if (!currentPassword) {
    return errorResponse("Bitte geben Sie Ihr aktuelles Passwort zur Bestätigung ein.", 400);
  }

  const currentHash = await hashPassword(currentPassword, session.salt);
  if (currentHash !== session.password_hash) {
    return errorResponse("Das aktuelle Passwort ist leider nicht korrekt.", 403);
  }

  let updatedEmail = session.email;
  if (newEmail && newEmail !== session.email) {
    if (!newEmail.includes("@") || !newEmail.includes(".")) {
      return errorResponse("Bitte geben Sie eine gültige neue E-Mail-Adresse ein.", 400);
    }
    const emailCheck = await env.DB.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(newEmail, session.user_id).first();
    if (emailCheck) {
      return errorResponse("Diese E-Mail-Adresse wird bereits von einem anderen Benutzer verwendet.", 400);
    }
    updatedEmail = newEmail;
  }

  const updatedFullName = newFullName || session.full_name;

  const newSalt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  let updatedHash = session.password_hash;
  if (newPassword) {
    if (newPassword.length < 8) {
      return errorResponse("Das neue Passwort muss mindestens 8 Zeichen lang sein.", 400);
    }
    updatedHash = await hashPassword(newPassword, newSalt);
  } else {
    updatedHash = await hashPassword(currentPassword, newSalt);
  }

  await env.DB.prepare(`
    UPDATE users
    SET email = ?, full_name = ?, password_hash = ?, salt = ?
    WHERE id = ?
  `).bind(updatedEmail, updatedFullName, updatedHash, newSalt, session.user_id).run();

  await logAuditEvent(env, {
    eventType: "USER_CREDENTIALS_UPDATED",
    entityType: "users",
    entityId: session.user_id,
    actor: updatedFullName,
    description: `Zugangsdaten für ${updatedEmail} (${updatedFullName}) erfolgreich aktualisiert.`
  });

  return jsonResponse({
    success: true,
    message: "Zugangsdaten & Profil wurden erfolgreich aktualisiert!",
    user: {
      id: session.user_id,
      email: updatedEmail,
      fullName: updatedFullName,
      role: session.role
    },
    requiresCredentialChange: false
  });
}
