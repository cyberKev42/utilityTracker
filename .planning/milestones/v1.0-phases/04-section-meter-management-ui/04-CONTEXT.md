# Phase 4: Section & Meter Management UI - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can define and manage their utility sections and meters from the Settings page. Create, edit, reorder, and archive/delete sections; add, rename, reorder, and delete meters within sections. All new UI labels translated to EN and DE. No entry forms or statistics in this phase.

</domain>

<decisions>
## Implementation Decisions

### Page placement & layout
- Section & meter management lives on the existing Settings page as a new card group, positioned between Account and Language cards
- Each section is an expandable card: collapsed shows icon + name + unit + edit/drag handles; expanded reveals meter list
- Cards collapse/expand on click — keeps the page compact with many sections
- "Archived" area at the bottom of the sections list (collapsible) shows archived sections with restore and permanent delete options
- "+" Add Section button below the section list

### Section editing UX
- Create and edit sections via a dialog/modal (reuse existing shadcn dialog.jsx)
- Dialog fields: name (text input), unit (dropdown), icon (picker grid)
- Same dialog for create and edit — pre-filled for edit, empty for create
- Section archive action available from the section card (not in the edit dialog)
- Meters use inline editing: click meter name to rename in-place, press Enter or blur to save
- "+" Add Meter inserts a new row at the bottom of the meter list in edit mode, auto-focused

### Unit selection
- Dropdown with predefined common units: kWh, m³, L, gal, therms, etc.
- "Custom..." option at the bottom reveals a free text input for non-standard units
- Default units for seeded sections: Water = m³, Power = kWh, Fuel = L

### Icon selection
- Predefined grid of ~30 utility-relevant icons from the HiOutline (Heroicons) set already in the project
- Icons displayed as a grid within the section edit dialog
- Consistent with existing Settings page icon style — professional SVG icons, same rendering everywhere
- No emoji — React Icons / HiOutline only

### Delete & archive behavior
- Sections: archive first, then delete from the archived area (two-step safety)
- Archived sections shown in a collapsible "Archived" area at the bottom with restore and permanent delete options
- Permanent delete shows confirmation dialog warning about data loss
- Meters: direct delete with confirmation dialog ("Delete Meter X? This will remove all entries.")
- No archive layer for meters — simpler entities

### Drag-and-drop reorder
- Library: @dnd-kit/core (new dependency)
- Both sections AND meters are reorderable via drag-and-drop
- Visual feedback: lifted card with shadow + drop indicator line between items
- Optimistic reorder (per Phase 3 SectionsContext decision) — reverts on server failure with error toast
- Drag handle visible on each section card and meter row

### Internationalization
- All new UI labels (button text, dialog titles, field labels, confirmation messages, archived section area) added to both EN and DE translation files
- Section and meter names display as typed by the user (not translated) — per I18N-02

### Claude's Discretion
- Exact icon selection for the ~30 predefined icons
- Animation/transition details for expand/collapse and drag
- Exact layout spacing and responsive breakpoints
- Error toast implementation for failed operations
- Keyboard accessibility details for drag-and-drop

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/REQUIREMENTS.md` — SECT-01 through SECT-04, METR-01, METR-02, I18N-01, I18N-02 requirements
- `.planning/ROADMAP.md` — Phase 4 success criteria (5 conditions that must be TRUE)
- `.planning/PROJECT.md` — Key decisions table, tech stack constraints

### Prior phase decisions (schema, API, and context this UI builds on)
- `.planning/phases/01-schema-migration/01-CONTEXT.md` — Schema: sections/meters tables, archived_at column, sort_order, icon column
- `.planning/phases/02-backend-services/02-CONTEXT.md` — API contract: nested section→meters tree, CRUD endpoints, reorder mechanism, archive/delete behavior
- `.planning/phases/03-sectionscontext/03-CONTEXT.md` — SectionsContext: mutation functions, optimistic reorder, server-wait for structural changes, fetchWithArchived()

### Existing frontend code (patterns to follow)
- `frontend/src/pages/Settings.jsx` — Current Settings page structure to extend
- `frontend/src/context/SectionsContext.jsx` — Section/meter state and mutations (built in Phase 3)
- `frontend/src/hooks/useSections.js` — Consumer hook for sections context
- `frontend/src/components/ui/dialog.jsx` — Shadcn dialog component to reuse for section edit
- `frontend/src/components/ui/card.jsx` — Card component used throughout Settings page
- `frontend/src/i18n/locales/en/common.json` — English translations to extend
- `frontend/src/i18n/locales/de/common.json` — German translations to extend

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/ui/dialog.jsx` — Shadcn dialog for section create/edit modal
- `frontend/src/components/ui/card.jsx` — Card component for section cards (used in current Settings)
- `frontend/src/components/ui/button.jsx` — Button component for actions
- `frontend/src/components/ui/input.jsx` — Input component for name/unit fields
- `frontend/src/context/SectionsContext.jsx` — All section/meter CRUD mutations ready to consume
- `react-icons/hi2` — HiOutline icon set already installed and used in Settings

### Established Patterns
- Settings page uses staggered Framer Motion animations (fadeUp variants)
- Each settings group is a Card with CardContent, icon header, and content area
- Buttons use `motion.button` with `whileTap={{ scale: 0.98 }}`
- Grid-based selection UI for language/currency — could inform icon picker layout
- Context consumer hooks at top of component (`useSections()`, `useAuth()`, `useTranslation()`)

### Integration Points
- `frontend/src/pages/Settings.jsx` — Add sections management card group
- `frontend/src/App.jsx` — No new routes needed (stays on /settings)
- `frontend/src/i18n/locales/{en,de}/common.json` — New translation keys
- `package.json` — Add @dnd-kit/core and @dnd-kit/sortable dependencies

</code_context>

<specifics>
## Specific Ideas

- 30 predefined icons in the icon picker grid (user specified quantity)
- Expandable card pattern similar to accordion — compact by default, reveals meters on click
- Archived sections area is collapsible and positioned at the bottom of the sections list

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-section-meter-management-ui*
*Context gathered: 2026-03-19*
