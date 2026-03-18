# Technology Stack

**Project:** UtilityTracker v2 — Dynamic Sections & Meters Milestone
**Researched:** 2026-03-18
**Scope:** Additive research only. Documents new libraries/patterns needed for this milestone. Does not re-document the existing stack (see `.planning/codebase/STACK.md`).

---

## Existing Stack (locked — do not change)

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 19.1.0 |
| Routing | React Router | 7.13.0 |
| Build | Vite | 6.3.5 |
| Styling | Tailwind CSS | 3.4.17 |
| Animation | Framer Motion | 11.18.2 |
| Backend | Express | 5.1.0 |
| Database driver | pg | 8.13.1 |
| Auth | Supabase | frontend 2.97.0 / backend 2.49.1 |
| Charts | Recharts | 3.7.0 |
| UI primitives | Radix UI (dialog, slot) | installed |
| i18n | i18next + react-i18next | 25.8.13 / 16.5.4 |

The constraint from PROJECT.md is explicit: stay within React + Express + PostgreSQL + Supabase. No framework changes.

---

## New Dependencies Required This Milestone

### 1. Drag-and-Drop: @dnd-kit/core + @dnd-kit/sortable

**Requirement:** Sections and meters must be reorderable by the user.

| Property | Value |
|----------|-------|
| Package | `@dnd-kit/core` + `@dnd-kit/sortable` |
| Approximate version | 6.x (latest stable as of Aug 2025) |
| Confidence | MEDIUM — training data; could not verify npm registry |

**Why @dnd-kit, not react-beautiful-dnd:**
- `react-beautiful-dnd` is unmaintained (last release 2023, known React 18/19 issues). Using it with React 19 would introduce a fragile dependency.
- `@dnd-kit/core` is actively maintained, designed for React 18+ with hooks-first API, has no peer-dependency conflicts with React 19.
- `@dnd-kit/sortable` is the canonical extension for list reordering and plugs directly into core.
- Bundle cost is low (~15KB gzipped) compared to alternatives.

**Why not HTML5 drag-and-drop API directly:**
- No touch support, no keyboard accessibility, janky UX without significant wrapper code. @dnd-kit handles all of this.

**Installation:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

---

### 2. Database Migrations: node-pg-migrate

**Requirement:** The schema must add `sections`, `meters` tables, modify `utility_entries`, and migrate existing Water/Power/Fuel rows into the new structure — without data loss.

| Property | Value |
|----------|-------|
| Package | `node-pg-migrate` |
| Approximate version | 7.x (latest stable as of Aug 2025) |
| Confidence | MEDIUM — training data; could not verify npm registry |

**Why node-pg-migrate:**
- Designed explicitly for Node.js + pg (exact stack in use). No ORM required, no framework change.
- Migrations are plain SQL or JS with `pgm` helpers — easy to review, easy to roll back.
- Runs against the same `DATABASE_URL` environment variable already in use.
- Flyway and Liquibase are JVM-based — wrong runtime for this project.
- Knex has a migration system but pulling in Knex just for migrations when `pg` is already in use adds unnecessary abstraction.

**Why migrations are mandatory (not optional):**
The concerns doc flags "Database Schema Unknown" as a fragile area — no schema file exists in the repo. This milestone makes a complex multi-table schema change (new tables, foreign keys, data backfill). Without tracked migrations, the production database and developer databases will diverge, making the Railway deployment unreliable.

**Installation (backend devDependency):**
```bash
npm install -D node-pg-migrate
```

**Usage pattern:**
```bash
# create a migration
npx node-pg-migrate create add-sections-and-meters

# run all pending migrations
npx node-pg-migrate up

# roll back one migration
npx node-pg-migrate down
```

---

### 3. Form State: react-hook-form

**Requirement:** The Add Entry form gains a mode toggle (usage amount vs. meter reading), a section selector, and a meter selector — all dynamic. The existing form is uncontrolled HTML; that approach does not scale to this complexity cleanly.

| Property | Value |
|----------|-------|
| Package | `react-hook-form` |
| Approximate version | 7.x (latest stable as of Aug 2025) |
| Confidence | MEDIUM — training data; could not verify npm registry |

**Why react-hook-form:**
- The existing `AddEntry.jsx` concerns doc flags the cost calculation as "fragile" with multiple interacting state pieces and a race condition risk. Adding two more dependent fields (section, meter) without a proper form manager will compound this.
- `react-hook-form` manages field registration, validation, and inter-field dependencies via `watch()` — exactly what the mode toggle (entry mode A vs B) needs.
- No controlled component overhead: works well with Radix UI primitives already in use.
- Widely adopted in React 18/19 ecosystem; compatible with the existing stack.

**Why not Formik:**
- Formik's controlled-input model adds re-render overhead. For a tracker app used daily, form responsiveness matters. `react-hook-form` outperforms Formik on re-renders.

**Why not plain useState:**
- The concerns doc already identifies the existing useState-based form as fragile. Adding more state here without structure is the wrong direction.

**Installation:**
```bash
npm install react-hook-form
```

---

### 4. Data Fetching / Caching: No New Library — Use Pattern Instead

**Requirement:** With dynamic sections and meters, multiple pages (Dashboard, AddEntry, Statistics, Settings) will all need the same sections/meters list. The concerns doc explicitly flags "Manual State Synchronization" as a problem.

**Recommendation: React Query (TanStack Query) is the right long-term solution, but is out of scope for this milestone.**

Rationale for deferral:
- React Query would require wrapping the entire app in `QueryClientProvider` and migrating all existing data fetching. That is a significant cross-cutting refactor that risks regressions across Dashboard, Statistics, Entries, and Settings — all pages that currently work.
- This milestone's goal is sections/meters, not data fetching architecture.

**What to do instead for this milestone:**
- Create a `SectionsContext` (same pattern as existing `AuthContext`) that loads all sections and meters once on app init, caches them in context, and exposes an `invalidate()` function to refetch after mutations.
- This is zero new dependencies, follows existing project patterns, and is good enough for single-user scope.
- Document the React Query migration as tech debt to address in a future milestone.

---

### 5. Icon Picker: react-icons (already installed)

**Requirement:** When creating a custom section, the user picks an icon.

`react-icons` 5.5.0 is already installed. No new package needed. Build a simple icon picker component using a curated subset of icons (e.g., 20-30 icons from `react-icons/md` or `react-icons/fa`) rather than showing all thousands. A full icon search UI would be over-engineered for this use case.

**Confidence:** HIGH — `react-icons` is confirmed in the existing `package.json`.

---

### 6. Additional Radix UI Primitives

**Requirement:** The section management UI needs a dropdown/select for entry mode and for meter selection. A tab-like toggle for entry mode A vs B is also needed.

| Package | Purpose | Status |
|---------|---------|--------|
| `@radix-ui/react-select` | Section and meter dropdowns | Install |
| `@radix-ui/react-tabs` | Entry mode toggle (usage vs reading) | Install |
| `@radix-ui/react-switch` | Optional: archive/active toggle on sections | Install if needed |

**Why Radix UI (not a different component library):**
`@radix-ui/react-dialog` is already installed and in use. Expanding within the same Radix family maintains consistent accessibility patterns, consistent styling approach (Tailwind), and avoids introducing a second component system.

**Approximate versions:** 1.x or 2.x (consistent with existing `@radix-ui/react-dialog ^1.1.4`). Confirm exact versions match Radix's versioning per package — they version each package independently.

**Installation:**
```bash
npm install @radix-ui/react-select @radix-ui/react-tabs
```

**Confidence:** MEDIUM — Radix UI packaging confirmed in existing codebase; specific package version numbers not verified against current npm registry.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Drag and drop | @dnd-kit/core + sortable | react-beautiful-dnd | Unmaintained, React 19 incompatible |
| Drag and drop | @dnd-kit/core + sortable | HTML5 native DnD | No touch, no keyboard, poor UX |
| Migrations | node-pg-migrate | Knex migrations | Pulls in ORM overhead unnecessarily |
| Migrations | node-pg-migrate | Flyway / Liquibase | JVM runtime, wrong ecosystem |
| Migrations | node-pg-migrate | Manual SQL scripts | No rollback, no version tracking, risky |
| Form state | react-hook-form | Formik | Higher re-render cost, weaker TS support |
| Form state | react-hook-form | More useState | Existing approach already flagged fragile |
| Data fetching | Context pattern (this milestone) | React Query | Right choice long-term, too broad for this milestone |
| UI components | Radix UI | shadcn/ui | shadcn generates code from Radix; adds build tooling complexity; overkill for this scope |

---

## Installation Summary

**Frontend additions:**
```bash
cd frontend
npm install @dnd-kit/core @dnd-kit/sortable react-hook-form @radix-ui/react-select @radix-ui/react-tabs
```

**Backend additions:**
```bash
cd backend
npm install -D node-pg-migrate
```

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| @dnd-kit recommendation | MEDIUM | Training data (Aug 2025); npm registry not accessible to verify latest version |
| react-beautiful-dnd deprecation | HIGH | Well-documented; multiple sources; last commit 2023 |
| node-pg-migrate suitability | MEDIUM | Training data; official docs not verified this session |
| react-hook-form recommendation | MEDIUM | Training data; npm registry not accessible |
| Radix UI expansion | HIGH | Existing package.json confirms Radix already in use; same-family expansion is low risk |
| react-icons icon picker | HIGH | Confirmed in existing package.json at 5.5.0 |
| SectionsContext pattern fit | HIGH | Matches existing AuthContext/LanguageContext patterns exactly; no external library |

**Overall confidence: MEDIUM.** The core recommendations (dnd-kit, node-pg-migrate, react-hook-form) are well-founded but version numbers should be verified against current npm registry before installation. Run `npm info <package> version` for each before committing to a pinned version.

---

## Sources

- Existing codebase: `/frontend/package.json`, `.planning/codebase/STACK.md`, `.planning/codebase/CONCERNS.md`, `.planning/codebase/ARCHITECTURE.md`
- Training data (cutoff August 2025) for @dnd-kit, react-hook-form, node-pg-migrate assessments
- External verification attempted but tool access was denied in this session — version numbers marked MEDIUM confidence accordingly
