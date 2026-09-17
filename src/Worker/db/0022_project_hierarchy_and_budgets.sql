-- ============================================================================
-- FREELANCER EVIDENCE & BILLING HUB - MIGRATION 0022
-- Dynamic 3-Stage Project & Budget Hierarchy (Gesamtprojekt -> Stream/AP -> Teilprojekt/AP)
-- Travel Budgets & Parent-Pooled Budget Allocation
-- ============================================================================

-- 1. Erweiterung der projects-Tabelle um hierarchische Verknüpfung und flexible Budgetmodi
ALTER TABLE projects ADD COLUMN parent_project_id TEXT;
ALTER TABLE projects ADD COLUMN hierarchy_level INTEGER NOT NULL DEFAULT 1; -- 1 = Gesamtprojekt, 2 = Projekt/Programm/Stream/AP, 3 = Teilprojekt/AP
ALTER TABLE projects ADD COLUMN budget_mode TEXT NOT NULL DEFAULT 'Dedicated'; -- 'Dedicated': Eigenes Honorarbudget; 'PooledFromParent': Bucht auf übergeordneten Rahmenvertrag/Stream
ALTER TABLE projects ADD COLUMN travel_budget_net REAL DEFAULT 0.0; -- Separates Reisekostenbudget in Euro
ALTER TABLE projects ADD COLUMN travel_budget_mode TEXT NOT NULL DEFAULT 'Dedicated'; -- 'Dedicated', 'PooledFromParent', 'None'
