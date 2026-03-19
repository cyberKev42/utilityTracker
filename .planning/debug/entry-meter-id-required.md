---
status: awaiting_human_verify
trigger: "When trying to add a new entry, user gets error 'meter_id is required and must be a valid UUID' but there's no way to select/add a meter_id in the UI."
created: 2026-03-19T00:00:00Z
updated: 2026-03-19T00:00:00Z
---

## Current Focus

hypothesis: CONFIRMED — entry form sends {type, usage_amount, unit, date} but backend now requires {meter_id, start_date, end_date, usage_amount|meter_reading}
test: N/A — root cause confirmed from code reading
expecting: N/A
next_action: Rewrite AddEntry.jsx to add section/meter selector, replace date with start_date/end_date, update i18n keys

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: User can add a new entry (utility reading) through the UI without errors
actual: Backend rejects the entry creation with "meter_id is required and must be a valid UUID"
errors: "meter_id is required and must be a valid UUID"
reproduction: Try to add a new entry via the UI form
started: Current state — the entry form likely predates the meter/section architecture from Phase 03

## Eliminated

(none — root cause found immediately from code reading)

## Evidence

- timestamp: 2026-03-19T00:00:00Z
  checked: backend/controllers/entriesController.js create() handler
  found: Requires meter_id (UUID), start_date, end_date, and either usage_amount or meter_reading. Does NOT accept type or unit fields.
  implication: The frontend form sends entirely the wrong payload shape.

- timestamp: 2026-03-19T00:00:00Z
  checked: frontend/src/pages/AddEntry.jsx
  found: Form collects type, usage_amount, unit, date, unitPrice. Sends {type, usage_amount, unit, date, unit_price} via createEntry(). No meter_id, no start_date, no end_date.
  implication: Every submission will fail at the first backend validation check (meter_id missing).

- timestamp: 2026-03-19T00:00:00Z
  checked: frontend/src/context/SectionsContext.jsx
  found: SectionsContext provides sections[] array, each with id, name, meters[]. Meters have id and name. useSections() hook available.
  implication: Meter selection data is already in context — just needs to be wired into AddEntry form.

## Resolution

root_cause: The AddEntry form was designed before the Phase 03 meter/section architecture. The backend create handler was updated to require meter_id + start_date + end_date, but the frontend form was never updated — it still sends the old type/unit/date payload shape.
fix: Rewrote AddEntry.jsx to use useSections() hook for meter selection (grouped by section), replaced the single date field with start_date + end_date for usage_amount mode and a single date for reading mode, sends correct payload {meter_id, start_date, end_date, usage_amount|meter_reading, unit_price?} to backend. Also handles empty-meters state gracefully. Updated i18n keys in en and de.
verification: awaiting human confirmation
files_changed: [frontend/src/pages/AddEntry.jsx, frontend/src/i18n/locales/en/common.json, frontend/src/i18n/locales/de/common.json]
