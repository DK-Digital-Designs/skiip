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

For the staging GitHub Actions workflow, `PLAYWRIGHT_REQUIRE_AUTH_CREDENTIALS=true` is set so missing role credentials fail the job explicitly instead of skipping auth smoke.

## Staging Smoke Automation

The deployed staging smoke workflow lives in [staging-smoke.yml](C:/Users/deang/OneDrive/Documents/GitHub/skiip/.github/workflows/staging-smoke.yml).

Current scope:
- landing page CTA
- buyer entry/vendor chooser
- protected-route redirect to login
- buyer sign-in
- seller sign-in
- admin sign-in

Current non-scope:
- order creation
- Stripe checkout
- webhook-paid transition
- vendor status progression
- admin refund

Trigger modes:
- manual via GitHub Actions `workflow_dispatch`
- weekday daily at `06:00 UTC`

Manual dispatch behavior:
- `base_url` is optional
- if omitted, the workflow uses the `PLAYWRIGHT_BASE_URL` secret from the GitHub `staging` environment

Required GitHub `staging` environment secrets:
- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_BUYER_EMAIL`
- `PLAYWRIGHT_BUYER_PASSWORD`
- `PLAYWRIGHT_SELLER_EMAIL`
- `PLAYWRIGHT_SELLER_PASSWORD`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`

## GitHub Setup Checklist

To get the staging smoke workflow fully operational in GitHub:
1. push a branch that contains [staging-smoke.yml](C:/Users/deang/OneDrive/Documents/GitHub/skiip/.github/workflows/staging-smoke.yml) to GitHub
2. in the GitHub repository, open `Settings -> Environments` and create the `staging` environment if it does not already exist
3. add these `staging` environment secrets:
   - `PLAYWRIGHT_BASE_URL`: full deployed staging app URL, for example `https://staging.example.com`
   - `PLAYWRIGHT_BUYER_EMAIL`: dedicated CI-only staging buyer account email
   - `PLAYWRIGHT_BUYER_PASSWORD`: matching buyer password
   - `PLAYWRIGHT_SELLER_EMAIL`: dedicated CI-only staging seller account email
   - `PLAYWRIGHT_SELLER_PASSWORD`: matching seller password
   - `PLAYWRIGHT_ADMIN_EMAIL`: dedicated CI-only staging admin account email
   - `PLAYWRIGHT_ADMIN_PASSWORD`: matching admin password
4. if the `staging` environment uses protection rules or required reviewers, allow the workflow to run in that environment
5. open `Actions -> Staging Smoke Checks -> Run workflow`, select the target branch, optionally set `base_url`, and run the workflow manually once
6. confirm the manual run passes or use the `playwright-report` and `test-results` artifacts to fix any failure
7. merge or push the workflow file onto the repository default branch so the weekday schedule can run automatically at `06:00 UTC`
8. confirm the next weekday scheduled run appears after the workflow is present on the default branch

The smoke workflow is only fully operational when all of the following are true:
- the workflow file exists in GitHub
- the GitHub `staging` environment exists with all seven secrets populated
- the `PLAYWRIGHT_BASE_URL` target is reachable
- the dedicated staging buyer, seller, and admin accounts exist and can sign in successfully

Failure artifacts:
- `playwright-report`
- `test-results`

Triage flow for a failed staging smoke run:
1. open the failing GitHub Actions run
2. download `playwright-report` and `test-results`
3. inspect the HTML report first for the failing route or role
4. inspect traces in `test-results` if the HTML report is not enough
5. determine whether the failure is deployment drift, staging data drift, or an auth/config regression

## Fixture Strategy

- Keep one stable buyer, one seller, and one admin account per shared environment.
- Keep the seller account attached to a known store that is safe to use for smoke checks.
- Treat smoke accounts as operational fixtures, not ad hoc developer accounts.
- When any shared credential changes, update both the environment manager and this document in the same change.
- Use dedicated CI-only staging buyer, seller, and admin accounts for the staging smoke workflow.
- Do not reuse those dedicated smoke accounts for ad hoc manual testing.

## Current Seed and Reset Baseline

- Local database reset uses `supabase db reset` from the repo root.
- Shared account seeding currently uses `npm run seed:test-users` from [`app`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app).
- The seeding script expects `SUPABASE_SERVICE_ROLE_KEY` and optionally `SUPABASE_URL`.
- Shared-environment seeding is additive. It does not wipe orders or other live operational data.

## Maintenance Notes

- Do not treat these as production credentials.
- Rotate or remove entries if they become stale.
- If seeded data changes in Supabase, update this file in the same change.
