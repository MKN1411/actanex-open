-- Migration 0023: Add vehicle_planning_json to app_settings for individual mileage rate planning
ALTER TABLE app_settings ADD COLUMN vehicle_planning_json TEXT DEFAULT '{}';
