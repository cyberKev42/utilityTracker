# GSD Debug Knowledge Base

Resolved debug sessions. Used by `gsd-debugger` to surface known-pattern hypotheses at the start of new investigations.

---

## entry-meter-id-required — AddEntry form sends wrong payload after backend meter/section refactor
- **Date:** 2026-03-19
- **Error patterns:** meter_id, required, UUID, entry, form, backend, validation
- **Root cause:** The AddEntry form was designed before the Phase 03 meter/section architecture. The backend create handler was updated to require meter_id + start_date + end_date, but the frontend form was never updated — it still sent the old type/unit/date payload shape.
- **Fix:** Rewrote AddEntry.jsx to use useSections() hook for meter selection (grouped by section), replaced single date with start_date + end_date for usage_amount mode and single date for reading mode, sends correct payload {meter_id, start_date, end_date, usage_amount|meter_reading, unit_price?}. Updated i18n keys in en and de.
- **Files changed:** frontend/src/pages/AddEntry.jsx, frontend/src/i18n/locales/en/common.json, frontend/src/i18n/locales/de/common.json
---

## dashboard-load-failure — Dashboard 404s on /api/entries/trend and Frankfurter exchange rate API
- **Date:** 2026-03-19
- **Error patterns:** 404, trend, entries, Frankfurter, exchange rate, EUR, dashboard, api.frankfurter.dev
- **Root cause:** Two independent issues. (1) GET /api/entries/trend route, controller handler, and service function were never implemented — frontend calls it but backend returns 404. (2) Frankfurter exchange rate API moved to /v1/ path prefix; CurrencyContext.jsx uses the old /latest path which now returns 404.
- **Fix:** (1) Implemented getMonthlyTrend in entriesService.js, added getTrend controller handler, added GET /trend route in routes/entries.js. (2) Updated CurrencyContext.jsx to use https://api.frankfurter.dev/v1/latest?base=EUR.
- **Files changed:** backend/services/entriesService.js, backend/controllers/entriesController.js, backend/routes/entries.js, frontend/src/context/CurrencyContext.jsx
---
