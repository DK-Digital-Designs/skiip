# Testing Data

This document tracks the shared test accounts currently used to validate SKIIP flows.

Keep this file current when:
- new seeded accounts are added
- old credentials are retired
- store setup or role assignments change

## Test Accounts

### Legacy Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| Super Admin | `admin@example.com` | `password123` |
| Vendor (Burger Bliss) | `vendor@example.com` | `password123` |
| Standard Buyer | `buyer@example.com` | `password123` |

### 2026 Test Accounts

| Role | Email | Password | Setup Status |
| :--- | :--- | :--- | :--- |
| Super Admin | `admin2026@example.com` | `password2026` | Confirmed |
| Vendor (Skiip Test Kitchen) | `vendor2026@example.com` | `password2026` | Confirmed, store created |
| Standard Buyer | `buyer2026@example.com` | `password2026` | Confirmed |

## Usage Notes

- Use buyer accounts to test signup/login, ordering, Stripe checkout, and order tracking.
- Use vendor accounts to test product management, paid-order handling, and order-status transitions.
- Use admin accounts to test vendor management, dashboard metrics, and refunds.

## Playwright Smoke Inputs

The smoke suite in [`app/tests/e2e/smoke.spec.js`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/tests/e2e/smoke.spec.js) supports two layers:
- public smoke checks that always run
- authenticated smoke checks that activate only when role credentials are present

Environment variables used by the suite:
- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_BUYER_EMAIL`
- `PLAYWRIGHT_BUYER_PASSWORD`
- `PLAYWRIGHT_SELLER_EMAIL`
- `PLAYWRIGHT_SELLER_PASSWORD`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`

If the credential pairs are not set, the authenticated tests are skipped automatically.

## Fixture Strategy

- Keep one stable buyer, one seller, and one admin account per shared environment.
- Keep the seller account attached to a known store that is safe to use for smoke checks.
- Treat smoke accounts as operational fixtures, not ad hoc developer accounts.
- When any shared credential changes, update both the environment manager and this document in the same change.

## Current Seed and Reset Baseline

- Local database reset uses `supabase db reset` from the repo root.
- Shared account seeding currently uses `npm run seed:test-users` from [`app`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app).
- The seeding script expects `SUPABASE_SERVICE_ROLE_KEY` and optionally `SUPABASE_URL`.
- Shared-environment seeding is additive. It does not wipe orders or other live operational data.

## Maintenance Notes

- Do not treat these as production credentials.
- Rotate or remove entries if they become stale.
- If seeded data changes in Supabase, update this file in the same change.
