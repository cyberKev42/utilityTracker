# Requirements: UtilityTracker v2

**Defined:** 2026-03-18
**Core Value:** Users can track any utility across multiple meters with accurate, flexible data entry

## v1 Requirements

### Section Management

- [x] **SECT-01**: User can create a new utility section with name, unit, and icon
- [x] **SECT-02**: User can edit a section's name, unit, and icon
- [x] **SECT-03**: User can reorder sections via drag-and-drop
- [x] **SECT-04**: Default Water (m³), Power (kWh), and Fuel sections are editable like custom sections

### Sub-Meters

- [x] **METR-01**: User can add multiple meters to any section (e.g. Water Meter 1, Water Meter 2)
- [x] **METR-02**: User can rename or delete a meter
- [ ] **METR-03**: User can view statistics per individual meter
- [ ] **METR-04**: User can view aggregated statistics rolled up to the section level

### Entry Modes

- [x] **ENTR-01**: User can enter a usage amount for a single date, added to the meter's running total
- [x] **ENTR-02**: User can enter a usage amount for a date range, split evenly across the days
- [x] **ENTR-03**: User can enter a current meter reading and the app calculates usage since last reading
- [x] **ENTR-04**: First entry for a meter prompts for initial reading (usage = 0 baseline)

### Units & Display

- [x] **UNIT-01**: Power section defaults to "kWh" unit
- [x] **UNIT-02**: Water section defaults to "m³" unit
- [ ] **UNIT-03**: Custom sections display their user-defined unit throughout the app

### Internationalization

- [x] **I18N-01**: All new UI text, labels, and messages are displayed in the language chosen by the user's language setting (EN or DE)
- [x] **I18N-02**: Custom section/meter names display as-is (user data, not translated)

## v2 Requirements

### Section Management

- **SECT-05**: User can delete or archive sections (choose archive to preserve data, or permanent delete)

### Differentiators

- **DIFF-01**: Section color theming
- **DIFF-02**: Section usage targets/budgets
- **DIFF-03**: Meter location metadata
- **DIFF-04**: Bulk import from CSV

## Out of Scope

| Feature | Reason |
|---------|--------|
| Photo/OCR meter reading | High complexity, mobile-first feature |
| Real-time multi-user collaboration | Single-user app |
| Mobile native app | Web-only for now |
| Notifications/alerts for usage thresholds | Future feature |
| Import/export (CSV) | Deferred to v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SECT-01 | Phase 4 | Complete |
| SECT-02 | Phase 4 | Complete |
| SECT-03 | Phase 4 | Complete |
| SECT-04 | Phase 4 | Complete |
| METR-01 | Phase 4 | Complete |
| METR-02 | Phase 4 | Complete |
| METR-03 | Phase 6 | Pending |
| METR-04 | Phase 6 | Pending |
| ENTR-01 | Phase 5 | Complete |
| ENTR-02 | Phase 5 | Complete |
| ENTR-03 | Phase 5 | Complete |
| ENTR-04 | Phase 5 | Complete |
| UNIT-01 | Phase 1 | Complete |
| UNIT-02 | Phase 1 | Complete |
| UNIT-03 | Phase 6 | Pending |
| I18N-01 | Phase 4 | Complete |
| I18N-02 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation*
