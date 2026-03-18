# Testing

## Current State

**No test infrastructure exists.**

- No test runner configured (no Jest, Vitest, Playwright, Cypress)
- No `*.test.js` or `*.spec.js` files
- No testing libraries in either `package.json`
- No test scripts defined
- No CI/CD test pipeline

## Scripts Available

**Backend (`backend/package.json`):**
- `dev` — development server
- `start` — production server

**Frontend (`frontend/package.json`):**
- `dev` — Vite dev server
- `build` — production build
- `preview` — preview production build

## Recommended Setup

Given the stack (React 19 + Vite frontend, Express 5 backend):

**Frontend:** Vitest + @testing-library/react
**Backend:** Vitest or Node test runner
**E2E:** Playwright

## Critical Areas Lacking Tests

- Auth flow (register, login, session management)
- API endpoint validation and error responses
- Entry CRUD operations
- Statistics calculations and aggregations
- Form validation logic
- Protected route guards
- i18n translation completeness
