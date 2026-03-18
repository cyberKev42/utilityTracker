BEGIN;

-- Step 1: Drop indexes created by up.sql
DROP INDEX IF EXISTS idx_utility_entries_group_id;
DROP INDEX IF EXISTS idx_utility_entries_meter_id;
DROP INDEX IF EXISTS idx_utility_meters_section_id;
DROP INDEX IF EXISTS idx_utility_sections_user_id;

-- Step 2: Drop new unique constraint, re-add type columns (nullable first)
ALTER TABLE utility_settings DROP CONSTRAINT IF EXISTS utility_settings_user_id_section_id_key;

ALTER TABLE utility_entries ADD COLUMN type TEXT;
ALTER TABLE utility_settings ADD COLUMN type TEXT;

-- Step 3: Backfill type from sections via meters
UPDATE utility_entries e
SET type = LOWER(s.name)
FROM utility_meters m
JOIN utility_sections s ON s.id = m.section_id
WHERE m.id = e.meter_id;

UPDATE utility_settings us
SET type = LOWER(s.name)
FROM utility_sections s
WHERE s.id = us.section_id;

-- Step 4: Remove new columns from existing tables
ALTER TABLE utility_entries DROP COLUMN meter_id, DROP COLUMN group_id, DROP COLUMN meter_reading;
ALTER TABLE utility_settings DROP COLUMN section_id;

-- Step 5: Drop new tables (meters first due to FK)
DROP TABLE utility_meters;
DROP TABLE utility_sections;

-- Step 6: Re-add original unique constraint on utility_settings
ALTER TABLE utility_settings ADD CONSTRAINT utility_settings_user_id_type_key UNIQUE (user_id, type);

COMMIT;
