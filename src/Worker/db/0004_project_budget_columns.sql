-- Add budget and timeline columns to projects
ALTER TABLE projects ADD COLUMN planned_hours REAL NOT NULL DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN total_budget_net REAL NOT NULL DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN start_date TEXT;
ALTER TABLE projects ADD COLUMN end_date TEXT;
