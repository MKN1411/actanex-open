-- ============================================================================
-- FREELANCER EVIDENCE & BILLING HUB - MIGRATION 0021
-- Trip Legs, Future Planning (Forecast), Multi-Transport & VMA Enhancements
-- ============================================================================

-- 1. Erweiterung der trips-Tabelle
ALTER TABLE trips ADD COLUMN status TEXT NOT NULL DEFAULT  \Completed\'; -- \Planned\', \Completed\', \Archived\'
ALTER TABLE trips ADD COLUMN is_round_trip INTEGER NOT NULL DEFAULT 0;
ALTER TABLE trips ADD COLUMN total_planned_cost_net REAL DEFAULT 0.0;
ALTER TABLE trips ADD COLUMN breakfast_days_json TEXT DEFAULT \[]\';

-- 2. Neue Tabelle für Etappen bei Rundreisen & Zwischenstopps
CREATE TABLE IF NOT EXISTS trip_legs (
    id TEXT PRIMARY KEY,
    trip_id TEXT NOT NULL,
    leg_order INTEGER NOT NULL DEFAULT 1,
    date_leg TEXT NOT NULL,
    start_location TEXT NOT NULL,
    destination_location TEXT NOT NULL,
    transport_type TEXT NOT NULL DEFAULT \Train\', -- \Train\', \Flight\', \Car\', \RentalCar\', \Passenger\', \RentalBike\', \BikeFoot\'
    distance_km REAL DEFAULT 0.0,
    rate_per_km REAL DEFAULT 0.0,
    travel_cost_net REAL DEFAULT 0.0,
    layover_hours REAL DEFAULT 0.0,
    layover_purpose TEXT,
    customer_id TEXT,
    project_id TEXT,
    is_billable_to_client INTEGER NOT NULL DEFAULT 1,
    created_at_utc TEXT NOT NULL,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

-- 3. Erweiterung der globalen Konfiguration für Standard-Verkehrsmittel
ALTER TABLE app_settings ADD COLUMN default_transport_type TEXT DEFAULT \Train\';