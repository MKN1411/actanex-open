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


