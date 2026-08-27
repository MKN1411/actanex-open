-- Migration 0011: Admin Benutzerverwaltung und Session-Authentifizierung

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
);

CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at_utc TEXT NOT NULL,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Initialer Admin-Seed: michael_kirst@hotmail.com (Passwort: Viktor##2027##)
INSERT OR REPLACE INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
VALUES (
    'usr_admin_01',
    'michael_kirst@hotmail.com',
    '2173e5a4c2d7848ff8834a103b32211fb3b64248826cc36e4f0d8de0a275a2e07b8e06da97ecaee7db75bfac4cb5752fd0bbd997ed5f0f73a1e217c1fda77c29',
    'f5de90270b9f7d2cb8efea3b9ff63eda',
    'Michael Kirst-Neshva',
    'Admin',
    1,
    '2026-08-21T09:00:00.000Z'
);
