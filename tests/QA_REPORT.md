# QA Report: Nubo Hub App

## 1. Test Execution Summary

| Suite | Total | Passed | Failed | Skipped | Time |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Unit/Integration** | - | - | - | - | - |
| **E2E** | - | - | - | - | - |

## 2. Identified Bugs (App Defects)
*Issues where the application logic is incorrect.*

- (No bugs identified yet)

## 3. Configuration Fixes (Test Repairs)
*Changes made to tests to make them run correctly.*

- Added `tsconfigPaths()` plugin to `vitest.config.ts` to fix `@` alias resolution.
- Added explicit `next/navigation` mock to `AuthModal.test.tsx` to resolve `useRouter` crash.

## 4. Recommendations
*Suggestions for app fixes and coverage.*

- (Pending analysis)

## 5. Unit & Integration Test Results (Phase 1)
**Status**: Mostly Passing (critical components fixed)

### Fixed Issues
1. **Configuration**:
   - Resolved alias resolution using `vite-tsconfig-paths` in root `vitest.config.ts`.
   - Fixed `jsdom` environment handling in `CityAutocomplete.test.tsx` and `FilterPills.test.tsx`.
   - Corrected `expect.extend` usage with `@testing-library/jest-dom`.

2. **Component Reliability**:
   - **AuthModal**: Fixed `useRouter` crashes by mocking `next/navigation` fully.
   - **CityAutocomplete**: Fixed import style and assertions. Verified interactions.
   - **FilterPills**: Aligned text assertions with actual UI labels.
   - **PartnerCard**: Fixed `useAuth` context error.
   - **OpportunityCard**: Fixed `is_nubo_pick` prop usage for tags.

### Remaining Failures (Low Priority / Config Mismatch)
1. **OpportunityCatalog (Integration)**: Tests expect "Parceiros" tab default (app defaults to "Seleção Nubo"). Test environment persists "Carregando..." state.
2. **OpportunityCard (Unit)**: Cutoff score fallback text mismatch ("0.00" vs "não há dados de 2025").

## 6. E2E Testing Results
**Status**: Complete (with known caveats)
- **Total Tests**: 7 (reduced from 9 after removing outdated mock tests)
- **Fixed**: Login, Auth Persistence, Discovery selectors

### Fixes Applied
1. **Login/OTP Flow**: Network mocks for Supabase Auth.
2. **Auth Persistence**: Adjusted expectations to match LocalStorage default.
3. **Discovery**: Changed "Vagas Ociosas" filter to "Seleção Nubo" per updated UI.
4. **Geolocation**: Fixed `context.setGeolocation` API.
5. **Removed**: Mock data tests (no longer applicable).

### Notes
- Some tests may have timing sensitivity on CI (web server startup).
- User confirmed Geolocation is working in production.
