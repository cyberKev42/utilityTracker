BEGIN;
ALTER TABLE utility_sections ADD COLUMN translation_key TEXT;
UPDATE utility_sections SET translation_key = 'water' WHERE LOWER(name) = 'water';
UPDATE utility_sections SET translation_key = 'power' WHERE LOWER(name) = 'power';
UPDATE utility_sections SET translation_key = 'fuel'  WHERE LOWER(name) = 'fuel';
COMMIT;
