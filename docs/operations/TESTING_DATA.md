# Testing Data

This document tracks the shared test accounts and fixture assumptions currently used to validate SKIIP flows.

Keep this file current when:

- new seeded accounts are added
- old credentials are retired
- store setup or role assignments change
- payment-path fixture expectations change

## Preferred Shared Accounts

These are the current preferred repo-supported shared accounts because they match the active seeding script in [`app/scripts/seed-test-users.js`](../../app/scripts/seed-test-users.js).

| Role | Email | Password | Setup Status |
| :--- | :--- | :--- | :--- |
| Super Admin | `admin2026@example.com` | `password2026` | Confirmed |
| Vendor (Skiip Test Kitchen) | `vendor2026@example.com` | `password2026` | Confirmed, store created |
| Standard Buyer | `buyer2026@example.com` | `password2026` | Confirmed |

Important current limitation:

- the seed script creates the vendor user and store
- it does not create a Stripe Connect account or mark `stripe_onboarding_complete = true`

Do not assume the seeded seller can complete payment-path tests until onboarding is completed in the target environment.

## Legacy Accounts

Legacy credentials still appear in older reset/schema files and may still exist in some environments, but they are no longer the preferred baseline.

| Role | Email | Password |
| :--- | :--- | :--- |
| Super Admin | `admin@example.com` | `password123` |
| Vendor (Burger Bliss) | `vendor@example.com` | `password123` |
| Standard Buyer | `buyer@example.com` | `password123` |

Use these only when you know the target environment still contains them.

## Usage Notes

- Use buyer accounts to test login, ordering, Stripe checkout, order tracking, and order history.
- Use vendor accounts to test product management, paid-order handling, and order-status transitions.
- Use admin accounts to test vendor management, dashboard metrics, and refunds.
- Use a Stripe-onboarded seller fixture for any payment-path rehearsal beyond login.

## Playwright Smoke Inputs

The smoke suite in [`app/tests/e2e/smoke.spec.js`](../../app/tests/e2e/smoke.spec.js) supports two layers:

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

Current local behavior from [`app/playwright.config.js`](../../app/playwright.config.js):

- if `PLAYWRIGHT_BASE_URL` is unset, Playwright starts `npm run preview -- --host 127.0.0.1 --port 4173`
- local smoke then runs against `http://127.0.0.1:4173`

If the credential pairs are not set, the authenticated tests are skipped automatically unless `PLAYWRIGHT_REQUIRE_AUTH_CREDENTIALS=true`.

## Current Smoke Coverage

Current staging smoke scope:

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

Treat the current Playwright lane as auth and reachability smoke, not payment-path proof.

## Staging Smoke Automation

The deployed staging smoke workflow lives in [staging-smoke.yml](../../.github/workflows/staging-smoke.yml).

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

1. push a branch that contains [staging-smoke.yml](../../.github/workflows/staging-smoke.yml) to GitHub
2. in the GitHub repository, open `Settings -> Environments` and create the `staging` environment if it does not already exist
3. add the seven required staging environment secrets listed above
4. if the `staging` environment uses protection rules or required reviewers, allow the workflow to run in that environment
5. open `Actions -> Staging Smoke Checks -> Run workflow`, select the target branch, optionally set `base_url`, and run the workflow manually once
6. confirm the manual run passes or use the `playwright-report` and `test-results` artifacts to fix any failure
7. merge or push the workflow file onto the repository default branch so the weekday schedule can run automatically
8. confirm the next weekday scheduled run appears after the workflow is present on the default branch

The smoke workflow is only fully operational when all of the following are true:

- the workflow file exists in GitHub
- the GitHub `staging` environment exists with all seven secrets populated
- the `PLAYWRIGHT_BASE_URL` target is reachable
- the dedicated staging buyer, seller, and admin accounts exist and can sign in successfully

Failure artifacts:

- `playwright-report`
- `test-results`

## Fixture Strategy

- Keep one stable buyer, one seller, and one admin account per shared environment.
- Keep the seller account attached to a known store that is safe to use for smoke checks.
- Use a separately verified Stripe-onboarded seller if payment-path rehearsal is required.
- Treat smoke accounts as operational fixtures, not ad hoc developer accounts.
- Use dedicated CI-only staging buyer, seller, and admin accounts for the staging smoke workflow.
- Do not reuse those dedicated CI accounts for ad hoc manual testing.

## Current Seed and Reset Baseline

Current shared-account seeding path:

- run `npm run seed:test-users` from [`app`](../../app)

Current environment expectations for the seeding script:

- `SUPABASE_SERVICE_ROLE_KEY` is preferred
- `SUPABASE_URL` is optional but recommended
- legacy `VITE_SUPABASE_SERVICE_ROLE_KEY` and `VITE_SUPABASE_URL` are still accepted by some local scripts

Important current caveats:

- shared-environment seeding is additive
- it does not wipe orders or live operational data
- local `supabase db reset` should not be treated as repo-guaranteed working today because `supabase/config.toml` references `supabase/seed.sql`, and that file is not committed

## Maintenance Notes

- Do not treat these as production credentials.
- Rotate or remove entries if they become stale.
- If seeded data or role assignments change in Supabase, update this file in the same change.
