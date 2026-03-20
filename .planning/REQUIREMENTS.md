# Requirements: UtilityTracker

**Defined:** 2026-03-20
**Core Value:** Users can track any utility across multiple meters with accurate, flexible data entry

## v1.1 Requirements

Requirements for polish & UX milestone. Each maps to roadmap phases.

### Performance

- [x] **PERF-01**: App navigates between pages without full-page reload or loading spinners — feels like a single-page app
- [x] **PERF-02**: Creating/editing sections and meters in settings updates the UI instantly without page refresh

### Mobile

- [ ] **MOBI-01**: All pages render correctly on mobile without horizontal scroll or cut-off elements (including settings toggles)

### Data Entry

- [ ] **ENTR-01**: Comma (",") is accepted as a decimal separator in numeric entry fields alongside period (".")
- [ ] **ENTR-02**: Section names in the new entry dropdown are translated to the active language (German/English)

### Navigation

- [ ] **NAVI-01**: Clicking a section on the dashboard navigates to the statistics page with that section pre-selected

### Dashboard

- [ ] **DASH-01**: Dashboard includes a toggle to switch between displaying data as usage amounts or cost values

### Settings

- [ ] **SETT-01**: Meter names are editable inline, same as section names

### Visual

- [ ] **VISL-01**: Water sections offer improved icon options including droplet, wave, and additional water-themed icons

## Future Requirements

- Import/export of data (CSV, etc.)
- Notifications or alerts for usage thresholds
- Archive + delete options for sections (deferred SECT-05 from v1.0)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-only for now |
| Real-time multi-user collaboration | Single-user tracking |
| Full SPA framework migration (e.g. Next.js) | Must stay within React + Express stack |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PERF-01 | Phase 7 | Complete |
| PERF-02 | Phase 7 | Complete |
| NAVI-01 | Phase 7 | Pending |
| ENTR-01 | Phase 8 | Pending |
| ENTR-02 | Phase 8 | Pending |
| MOBI-01 | Phase 8 | Pending |
| DASH-01 | Phase 9 | Pending |
| SETT-01 | Phase 9 | Pending |
| VISL-01 | Phase 9 | Pending |

**Coverage:**
- v1.1 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 — Traceability populated after roadmap creation*
