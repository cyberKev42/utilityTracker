---
status: awaiting_human_verify
trigger: "Dashboard does not load. Console shows five 404 errors: api.frankfurter.dev/latest?base=EUR and /api/entries/trend (x4)"
created: 2026-03-18T00:00:00Z
updated: 2026-03-19T00:00:00Z
---

## Current Focus
<!-- OVERWRITE on each update - reflects NOW -->

hypothesis: CONFIRMED (two independent root causes)
  1. /api/entries/trend returns 404 because the route and controller handler were never created in backend
  2. https://api.frankfurter.dev/latest returns 404 because the API moved to /v1/ path prefix

test: read backend routes/entries.js and frontend CurrencyContext.jsx
expecting: missing route + wrong URL confirmed
next_action: add GET /trend route+controller+service, fix Frankfurter URL to /v1/latest

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Dashboard loads and displays utility data normally
actual: Dashboard fails to load, browser console shows 404 errors on Frankfurter exchange rate API and /api/entries/trend endpoint (4 requests)
errors: "Failed to load resource: the server responded with a status of 404 ()" for both api.frankfurter.dev/latest?base=EUR and the Railway production /api/entries/trend endpoint
reproduction: Open the dashboard — errors appear immediately
timeline: Current state after Phase 03 SectionsContext work

## Eliminated
<!-- APPEND only - prevents re-investigating -->

- hypothesis: TypeError on entry.type was still causing the 404s
  evidence: Prior session resolved that; new session has different symptom class (404, not TypeError)
  timestamp: 2026-03-19

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-03-19
  checked: backend/routes/entries.js
  found: routes are GET /, GET /stats, POST /, DELETE /:id — no /trend route at all
  implication: any request to /api/entries/trend will fall through to Express 404

- timestamp: 2026-03-19
  checked: backend/controllers/entriesController.js
  found: exports are create, remove, getEntries, getStats — no getTrend export
  implication: both the route and the handler are missing; this is a feature gap, not a regression

- timestamp: 2026-03-19
  checked: frontend/src/services/entriesService.js line 25
  found: getTrend() calls api.get('/api/entries/trend')
  implication: frontend expects this endpoint to exist; it was wired up on the frontend but never implemented on the backend

- timestamp: 2026-03-19
  checked: frontend/src/context/CurrencyContext.jsx line 66
  found: fetch('https://api.frankfurter.dev/latest?base=EUR')
  implication: wrong path — Frankfurter API migrated to v1 path prefix; correct URL is https://api.frankfurter.dev/v1/latest?base=EUR

- timestamp: 2026-03-19
  checked: backend/services/entriesService.js
  found: no getMonthlyTrend or getTrend function defined; would need to be implemented
  implication: need to implement trend logic: compare current month total cost to prior month total cost

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: Two independent issues. (1) GET /api/entries/trend route, controller handler, and service function were never implemented — frontend calls it but backend returns 404. (2) Frankfurter exchange rate API moved to /v1/ path prefix; CurrencyContext.jsx uses the old /latest path which now returns 404.
fix: (1) Implement getMonthlyTrend in entriesService.js, add getTrend controller handler, add GET /trend route in routes/entries.js. (2) Update CurrencyContext.jsx to use https://api.frankfurter.dev/v1/latest?base=EUR.
verification: self-verified — all three backend files parse without error; route added at correct path; Frankfurter URL updated to /v1/ prefix; awaiting human confirmation in production
files_changed:
  - backend/services/entriesService.js
  - backend/controllers/entriesController.js
  - backend/routes/entries.js
  - frontend/src/context/CurrencyContext.jsx
