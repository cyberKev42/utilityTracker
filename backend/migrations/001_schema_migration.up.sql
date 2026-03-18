BEGIN;

-- Step 1: Ensure pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Step 2: Create utility_sections table
CREATE TABLE utility_sections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL,
  name        TEXT        NOT NULL,
  unit        TEXT        NOT NULL,
  icon        TEXT        NOT NULL DEFAULT 'zap',
  sort_order  INT         NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Create utility_meters table
CREATE TABLE utility_meters (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  UUID        NOT NULL REFERENCES utility_sections(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  entry_mode  TEXT        NOT NULL DEFAULT 'usage' CHECK (entry_mode IN ('usage', 'reading')),
  sort_order  INT         NOT NULL DEFAULT 0,
  archived_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 4: Add new columns to utility_entries (nullable initially)
ALTER TABLE utility_entries
  ADD COLUMN meter_id      UUID REFERENCES utility_meters(id) ON DELETE CASCADE,
  ADD COLUMN group_id      UUID,
  ADD COLUMN meter_reading NUMERIC(12,2);

-- Step 5: Add new column to utility_settings (nullable initially)
ALTER TABLE utility_settings
  ADD COLUMN section_id UUID REFERENCES utility_sections(id) ON DELETE CASCADE;

-- Step 6: Seed default sections for all users (union of entries + settings users)

-- Water sections (UNIT-02: unit = 'm³')
INSERT INTO utility_sections (user_id, name, unit, icon, sort_order)
SELECT DISTINCT sub.user_id, 'Water', 'm³', 'droplet', 0
FROM (
  SELECT user_id FROM utility_entries
  UNION
  SELECT user_id FROM utility_settings
) sub;

-- Power sections (UNIT-01: unit = 'kWh')
INSERT INTO utility_sections (user_id, name, unit, icon, sort_order)
SELECT DISTINCT sub.user_id, 'Power', 'kWh', 'zap', 1
FROM (
  SELECT user_id FROM utility_entries
  UNION
  SELECT user_id FROM utility_settings
) sub;

-- Fuel sections
INSERT INTO utility_sections (user_id, name, unit, icon, sort_order)
SELECT DISTINCT sub.user_id, 'Fuel', 'L', 'flame', 2
FROM (
  SELECT user_id FROM utility_entries
  UNION
  SELECT user_id FROM utility_settings
) sub;

-- Step 7: Seed one default meter per section
INSERT INTO utility_meters (section_id, name, entry_mode, sort_order)
SELECT s.id, s.name || ' Meter 1', 'usage', 0
FROM utility_sections s;

-- Step 8: Backfill meter_id on utility_entries (use LOWER for case safety)
UPDATE utility_entries e
SET meter_id = m.id
FROM utility_meters m
JOIN utility_sections s ON s.id = m.section_id
WHERE s.user_id = e.user_id
  AND LOWER(e.type) = LOWER(s.name)
  AND m.name = s.name || ' Meter 1';

-- Step 9: Backfill section_id on utility_settings (use LOWER for case safety)
UPDATE utility_settings us
SET section_id = s.id
FROM utility_sections s
WHERE s.user_id = us.user_id
  AND LOWER(us.type) = LOWER(s.name);

-- Step 10: Assert backfill completeness before destructive steps
DO $$
DECLARE
  missing_entries INT;
  missing_settings INT;
BEGIN
  SELECT COUNT(*) INTO missing_entries FROM utility_entries WHERE meter_id IS NULL;
  IF missing_entries > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % entries missing meter_id', missing_entries;
  END IF;

  SELECT COUNT(*) INTO missing_settings FROM utility_settings WHERE section_id IS NULL;
  IF missing_settings > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % settings missing section_id', missing_settings;
  END IF;
END $$;

-- Step 11: Drop old type columns
ALTER TABLE utility_entries DROP COLUMN type;
ALTER TABLE utility_settings DROP COLUMN type;

-- Step 12: Add NOT NULL constraints now that all rows have values
ALTER TABLE utility_entries ALTER COLUMN meter_id SET NOT NULL;
ALTER TABLE utility_settings ALTER COLUMN section_id SET NOT NULL;

-- Step 13: Drop old unique constraint on utility_settings and add new one
ALTER TABLE utility_settings DROP CONSTRAINT IF EXISTS utility_settings_user_id_type_key;
ALTER TABLE utility_settings ADD CONSTRAINT utility_settings_user_id_section_id_key UNIQUE (user_id, section_id);

-- Step 14: Add indexes for common query patterns
CREATE INDEX idx_utility_sections_user_id ON utility_sections(user_id);
CREATE INDEX idx_utility_meters_section_id ON utility_meters(section_id);
CREATE INDEX idx_utility_entries_meter_id ON utility_entries(meter_id);
CREATE INDEX idx_utility_entries_group_id ON utility_entries(group_id) WHERE group_id IS NOT NULL;

COMMIT;
