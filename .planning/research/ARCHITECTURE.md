# Architecture Patterns

**Domain:** Dynamic category/meter system added to existing utility tracker
**Researched:** 2026-03-18

---

## Recommended Architecture

The existing app uses a layered MVC pattern: React pages → frontend services → API client → Express routes → controllers → backend services → PostgreSQL. The dynamic sections/meters feature extends this pattern without breaking it.

The core design challenge is replacing two hardcoded concepts — `type` (a string enum: water/power/fuel) and a single `utility_entries` record — with a two-level hierarchy: **sections** (user-defined categories) and **meters** (sub-units within a section). Entries then belong to a meter, not a raw type string.

### Proposed Database Schema

```
utility_sections
  id            UUID PRIMARY KEY
  user_id       UUID NOT NULL (FK → auth.users)
  name          TEXT NOT NULL
  unit          TEXT NOT NULL          -- e.g. "kWh", "m³", "L"
  icon          TEXT                   -- emoji or icon identifier
  display_order INTEGER NOT NULL DEFAULT 0
  archived      BOOLEAN NOT NULL DEFAULT false
  created_at    TIMESTAMPTZ DEFAULT now()

utility_meters
  id            UUID PRIMARY KEY
  section_id    UUID NOT NULL (FK → utility_sections)
  user_id       UUID NOT NULL
  name          TEXT NOT NULL          -- e.g. "Main Meter", "Garden Meter"
  display_order INTEGER NOT NULL DEFAULT 0
  archived      BOOLEAN NOT NULL DEFAULT false
  created_at    TIMESTAMPTZ DEFAULT now()

utility_entries  (existing table, modified)
  id            UUID PRIMARY KEY
  user_id       UUID NOT NULL
  meter_id      UUID NOT NULL (FK → utility_meters)  -- replaces "type"
  entry_mode    TEXT NOT NULL CHECK (entry_mode IN ('usage', 'reading'))
  usage_amount  NUMERIC NOT NULL       -- computed for mode=reading
  meter_reading NUMERIC                -- raw reading value (mode=reading only)
  cost_amount   NUMERIC
  unit_price    NUMERIC
  date          DATE NOT NULL
  notes         TEXT
  created_at    TIMESTAMPTZ DEFAULT now()

utility_settings  (existing table, modified)
  id            UUID PRIMARY KEY
  user_id       UUID NOT NULL
  section_id    UUID NOT NULL (FK → utility_sections)  -- replaces "type"
  unit_price    NUMERIC NOT NULL
  updated_at    TIMESTAMPTZ DEFAULT now()
  UNIQUE (user_id, section_id)
```

**Migration strategy:** Seed three default sections (Water/Power/Fuel) per existing user. Seed one default meter per section. Backfill `meter_id` on existing entries by mapping the old `type` column to the seeded meter. Drop `type` column after backfill.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| `utility_sections` table | Source of truth for user-defined categories | meters, settings, entries (via meters) |
| `utility_meters` table | Sub-units within a section; owns entries | sections (parent), entries |
| `utility_entries` table | Individual data points, mode-aware | meters |
| `utility_settings` table | Unit price per section | sections |
| `backend/services/sectionsService.js` (new) | CRUD for sections and meters, archive/reorder | DB only |
| `backend/services/entriesService.js` (modified) | Entry creation with mode logic, stats via joins | DB only |
| `backend/services/settingsService.js` (modified) | Unit price keyed on section_id instead of type string | DB only |
| `backend/controllers/sectionsController.js` (new) | HTTP handlers for sections and meters endpoints | sectionsService |
| `backend/routes/sections.js` (new) | Express routes for /api/sections and /api/sections/:id/meters | sectionsController |
| `frontend/src/services/sectionsService.js` (new) | API calls for sections/meters | api.js |
| `frontend/src/context/SectionsContext.jsx` (new) | Global state for sections/meters list | sectionsService, downstream pages |
| `frontend/src/pages/Settings.jsx` (modified) | Section management UI + unit prices | SectionsContext, settingsService |
| `frontend/src/pages/AddEntry.jsx` (modified) | Dynamic section/meter picker + entry mode toggle | SectionsContext, entriesService |
| `frontend/src/pages/Statistics.jsx` (modified) | Dynamic charts driven by sections | SectionsContext, entriesService |
| `frontend/src/components/charts/` (modified) | Accept sections array instead of hardcoded types | SectionsContext |

### Data Flow

**Section/Meter Setup:**
```
User (Settings page)
  → SectionsContext.createSection(data)
  → frontend sectionsService.createSection(data)
  → POST /api/sections
  → sectionsController → sectionsService → INSERT utility_sections
  → Response propagates back → SectionsContext state updated
  → All downstream pages re-render with new section list
```

**Entry Creation (mode: usage):**
```
User (AddEntry page)
  → Selects section from SectionsContext
  → Selects meter from section.meters
  → Enters usage_amount and date
  → entriesService.createEntry({ meter_id, entry_mode: 'usage', usage_amount, date })
  → POST /api/entries
  → entriesController validates meter belongs to user
  → entriesService inserts with usage_amount as-is
```

**Entry Creation (mode: reading):**
```
User (AddEntry page)
  → Selects meter, enters meter reading value
  → Frontend calls GET /api/meters/:id/last-reading to fetch previous reading
  → If no prior reading → usage_amount = 0 (first entry)
  → If prior reading → usage_amount = current_reading - last_reading
  → POST /api/entries with { entry_mode: 'reading', meter_reading, usage_amount }
  → Backend re-validates the subtraction server-side for integrity
```

**Statistics (dynamic):**
```
Statistics page mounts
  → Loads SectionsContext (already cached)
  → Calls entriesService.getStats() → GET /api/entries/stats
  → Backend service JOINs utility_entries → utility_meters → utility_sections
  → Returns { bySection: [...], byMeter: [...], monthly: [...] }
  → Charts receive sections array from context + stats from API
  → Charts render dynamically — no hardcoded water/power/fuel references
```

**State Management:**
- `SectionsContext` (new) holds the full sections+meters tree; loaded once on app mount, updated optimistically on mutations. All pages consume this context so they all share the same list.
- Entry page-level state (selected meter, entry mode, form values) stays local in `AddEntry.jsx`.
- Stats data stays local in `Statistics.jsx` (fetched per page load, not globally cached).

---

## Patterns to Follow

### Pattern 1: SectionsContext as Single Source of Truth
**What:** Load all sections + their meters once in a React context provider at app mount. Expose `sections`, `createSection`, `updateSection`, `archiveSection`, `deleteSectionPermanently`, `addMeter`, etc.
**When:** Any component needs the section list. Avoids per-page fetching of the same data.
**Why:** Sections rarely change — fetching them once and caching in context is correct. Avoids N-fetch patterns where Dashboard, AddEntry, and Statistics each independently hit `/api/sections`.

### Pattern 2: Derived Meter List from Context
**What:** `AddEntry.jsx` reads `sections` from context, finds the selected section, then renders `section.meters` — no separate meter fetch needed.
**When:** Meter selection in forms.
**Why:** Meters are returned as nested objects in the sections response. One API call covers the full hierarchy.

### Pattern 3: Server-Side Reading Subtraction Validation
**What:** Frontend computes `usage_amount = current - last` to show preview, but backend independently fetches the last reading and re-computes before inserting.
**When:** Entry mode = 'reading'.
**Why:** Prevents client-side tampering; ensures `usage_amount` in the DB is always the canonical difference.

### Pattern 4: Migration with Backfill, Then Column Drop
**What:** Staged migration — add new columns nullable, backfill data, add NOT NULL constraint, then drop old `type` column in a separate migration.
**When:** Schema changes that touch existing data.
**Why:** Atomic migrations that modify + drop in one step risk failure on large tables and can't be rolled back cleanly.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Keeping `type` String Alongside `meter_id`
**What:** Adding `meter_id` but keeping `type` as a "fallback."
**Why bad:** Creates two sources of truth. Statistics queries diverge. Old entries work differently than new ones.
**Instead:** Complete migration. Map `type` → `meter_id` for all existing rows and drop `type`.

### Anti-Pattern 2: Computing Usage Delta Only on the Frontend
**What:** Frontend calculates `usage_amount = reading_now - reading_last` and sends only `usage_amount` to the API.
**Why bad:** If the user manipulates the request, negative or inflated usage amounts are written to the DB. Also loses the raw reading value, making audits impossible.
**Instead:** Send both `meter_reading` and `usage_amount`. Backend validates the delta matches the last stored reading.

### Anti-Pattern 3: Fetching Sections Inside Every Page Component
**What:** Each of AddEntry, Dashboard, Statistics calls `GET /api/sections` independently in its own `useEffect`.
**Why bad:** Three identical round trips on every navigation. Causes visible re-renders as data loads. Race conditions if mutations happen mid-navigation.
**Instead:** `SectionsContext` fetches once at app mount, caches, and is updated on mutation.

### Anti-Pattern 4: Hardcoding Chart Colors/Labels to Section Names
**What:** Chart components map `"water" → blue`, `"power" → yellow` explicitly.
**Why bad:** User-created sections get no color. Renames break the mapping.
**Instead:** Assign colors by index from a palette array (or store a color preference on the section). Labels come from `section.name`.

---

## Build Order (Dependency Graph)

```
1. DB Migration (sections + meters tables, meter_id on entries)
   ↓
2. Backend: sectionsService + sectionsController + routes/sections.js
   ↓ (sections API must exist before frontend can use it)
3. Backend: entriesService updated (JOIN on meters/sections, meter_id FK)
   ↓
4. Backend: settingsService updated (section_id instead of type string)
   ↓ (all backend services ready)
5. Frontend: sectionsService.js (API calls)
   ↓
6. Frontend: SectionsContext.jsx (state management for sections/meters)
   ↓ (context available to all pages)
7. Frontend: Settings.jsx — section CRUD UI + unit prices per section
   ↓ (user must be able to create sections before creating entries)
8. Frontend: AddEntry.jsx — dynamic section/meter picker + entry modes
   ↓
9. Frontend: Entries.jsx — display meter name + section instead of type string
   ↓
10. Frontend: Statistics.jsx + Chart components — dynamic, section-driven charts
    ↓
11. i18n: All new UI strings added to en/common.json + de/common.json throughout
```

**Phase ordering rationale:**
- DB migration first because every other layer depends on it.
- Backend services before frontend because the API contract drives frontend service shapes.
- SectionsContext before page modifications because pages depend on the context being available.
- Settings page before AddEntry because the user needs to configure sections before making entries (edge case: defaults are seeded, but custom sections must be testable end-to-end first).
- Statistics last because it only reads data — it can be updated after write paths are proven.

---

## Scalability Considerations

| Concern | Current (1 user) | At 100 users | At 10K users |
|---------|-----------------|--------------|--------------|
| Sections fetch | Fine, small table | Fine | Add `WHERE user_id` index on sections (should already exist) |
| Stats JOIN depth | entries → meters → sections is 2 JOINs | Fine | Ensure FK indexes exist on `meter_id` and `section_id` |
| Per-meter last-reading lookup | Single row SELECT | Fine | Index on `(meter_id, date DESC)` eliminates full scan |
| Context cache staleness | N/A (single session) | Fine (per-session) | Fine (no cross-user state) |

---

## Sources

- Existing codebase analysis: `/Users/kevinbrauer/Documents/Projects/claude/utilityTracker/.planning/codebase/ARCHITECTURE.md`
- Project requirements: `/Users/kevinbrauer/Documents/Projects/claude/utilityTracker/.planning/PROJECT.md`
- Pattern confidence: HIGH (derived directly from existing code structure + standard Express/React patterns)
