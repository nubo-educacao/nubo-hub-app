# Nubo Hub Automated Test Plan

**Status:** Draft / Gap Analysis Phase
**Date:** Jan 19, 2026
**Context:** Synchronization with `nubo-ops/docs/test_scenarios.md` (Phase 2)

## 1. Overview
This document outlines the strategy to align automated tests with the manual test scenarios. Currently, the test suite covers Authentication heavily but lacks coverage for the new "Discovery" features (Location Filtering, Vagas Ociosas, advanced Search).

## 2. Gap Analysis (Docs vs. Code)

| Scenario ID | Name | Automation Status | Details / Missing Coverage |
| :--- | :--- | :--- | :--- |
| **1.1 - 1.8** | **Authentication** | ✅ Covered | `AuthModal.test.tsx` and `login.spec.ts` provide good coverage. |
| **3.1** | **Listagem Geral** | ⚠️ Partial | `OpportunityCatalog.test.tsx` covers basic rendering, but E2E is missing. |
| **3.12** | **Filtro por Localização** | ❌ Missing | **Critical Gap.** No tests for City/State selection or parameter passing. |
| **3.13** | **Vagas Ociosas** | ❌ Missing | No unit test checks for the Red Tag display when `vagas_ociosas > 0`. |
| **3.14** | **Nota de Corte** | ⚠️ Partial | `OpportunityCard` tests rendering, but strict `null` vs `0.00` formatting logic is not explicitly tested. |
| **3.4** | **Seleção de Curso** | ❌ Missing | No E2E test for the "Search by Text" flow. |
| **3.6** | **Proximidade** | ❌ Missing | No test for "Próximas a você" (Geolocation). |

## 3. Implementation Roadmap

### Phase A: Unit Test Enhancements (Immediate)
**Goal:** Verify UI logic for new tags and formatting.

1.  **Update `tests/unit/components/OpportunityCard.test.tsx`**:
    *   Add test case: `renders "Vagas Ociosas" tag when vacancies > 0`.
    *   Add test case: `formats cutoff_score 0 as "0.00"`.
    *   Add test case: `formats cutoff_score null as "-"`.

2.  **Create `tests/unit/components/CityAutocomplete.test.tsx`** (If component exists):
    *   Mock `cityService`.
    *   Test input handling and list rendering.
    *   Test selection events.

### Phase B: Integration Tests (Service Layer)
**Goal:** Verify filter parameter integration.

1.  **Update `tests/integration/components/OpportunityCatalog.test.tsx`**:
    *   Add test: `fetches opportunities with city/state filters`.
    *   Verify that selecting a city updates the service call arguments.

### Phase C: E2E Automation (Playwright)
**Goal:** Verify the full User Journey.

1.  **Create `tests/e2e/discovery.spec.ts`**:
    *   **Test 1 (Search):** User types "Medicina" -> Verify results.
    *   **Test 2 (Location):** User selects "SP" -> "São Paulo" -> Verify results match location.
    *   **Test 3 (Filters):** User clicks "Vagas Ociosas" pill -> Verify distinct URL or UI state.

2.  **Create `tests/e2e/engagement.spec.ts`**:
    *   Test Cloudinha chat widget open/close (Scenario 4.1).

## 4. Proposed File Structure Changes
```text
nubo-hub-app/tests/
├── e2e/
│   ├── auth.spec.ts (renamed from login.spec.ts)
│   ├── discovery.spec.ts  <-- NEW
│   └── engagement.spec.ts <-- NEW
├── unit/
│   └── components/
│       ├── CityAutocomplete.test.tsx <-- NEW
│       └── ...
└── README.md (This file)
```
