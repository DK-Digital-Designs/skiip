---
name: skiip-doc-truth-maintainer
description: Maintain SKIIP documentation truth and detect drift between docs, code, GitHub delivery state, environment guidance, migrations, Supabase functions, scripts, and legacy project notes. Use when updating docs, reviewing project state, preparing releases, checking launch readiness documentation, or validating that repo documentation still matches implementation reality.
---

# SKIIP Doc Truth Maintainer

Use this skill to keep SKIIP documentation aligned with the current repository and delivery state.

## Operating Rule

Treat `docs/` as the project documentation source of truth. If root notes, old PR bodies, branch descriptions, setup snippets, or legacy schema snapshots conflict with `docs/`, trust `docs/` first, then verify against implementation before editing.

Do not rewrite docs broadly. Make the smallest changes that correct stale, misleading, missing, or contradictory information.

## Start Points

Read these first for most documentation truth checks:

- `docs/README.md`
- `docs/CURRENT_STATE.md`
- `docs/ROADMAP.md`
- `docs/ARCHITECTURE.md`
- `docs/DEPLOYMENT.md`
- `docs/OPERATIONS.md`

Read these when the topic touches their area:

- Launch gates: `docs/LAUNCH_CHECKLIST.md`
- Secrets and env vars: `docs/SECRETS.md`, `docs/ENVIRONMENT_MATRIX.md`, `app/.env.example`
- RLS and auth: `docs/RLS_ACCESS_MATRIX.md`, `supabase/config.toml`, `supabase/migrations/`, `supabase/functions/`
- GitHub workflow: `docs/BRANCHING_WORKFLOW.md`, `docs/GITHUB_SETUP.md`, `.github/workflows/`
- Test fixtures: `docs/TESTING_DATA.md`, `app/tests/e2e/`, `app/src/**/*.test.*`
- Notifications: `docs/NOTIFICATIONS.md`, `supabase/functions/notification-dispatch/`, webhook functions
- Releases: `docs/RELEASES.md`, `VERSION`, `app/package.json`, `scripts/sync-version.mjs`

For known drift-prone checks, read `references/drift-checks.md`.

## Workflow

1. Identify the documentation claim to verify.
2. Locate the closest source-of-truth doc in `docs/`.
3. Verify the claim against current implementation, scripts, migrations, workflows, or GitHub state as needed.
4. Classify each mismatch as:
   - `stale`: doc describes retired or changed behavior
   - `missing`: implementation has important operational behavior not documented
   - `contradictory`: two docs disagree
   - `ambiguous`: wording could mislead an operator or future agent
   - `external`: live provider or deployment state must be checked outside the repo
5. Patch the narrowest doc set that removes the mismatch.
6. Update `docs/README.md` if a new source-of-truth doc is added.
7. When implementation changed, ensure operational docs are updated in the same pass where relevant.

## Verification Targets

Check implementation before changing docs:

- App behavior: `app/src/`, tests, routes, package scripts
- Supabase schema: `supabase/migrations/`
- Edge functions: `supabase/functions/`
- CI and automation: `.github/workflows/`
- Static marketing site: `site/`
- Repo scripts: `scripts/`

Use GitHub only when the question depends on current issue, project, PR, or workflow-run state.

## Common SKIIP Drift Areas

Pay particular attention to:

- launch auth posture: manual bearer validation with `verify_jwt = false` where currently intentional
- authenticated-only buyer checkout
- admin-created vendor onboarding
- Stripe Checkout, webhook finalization, refunds, and reconciliation fields
- notification outbox behavior and the lack of an in-repo delayed retry scheduler
- `ALLOWED_ORIGINS` and risky fallback assumptions
- stale `VITE_VENDOR_INVITE_CODE` references
- `VITE_STRIPE_PUBLIC_KEY` references where redirect checkout does not use Stripe.js
- legacy order statuses: `processing`, `shipped`, `delivered`
- legacy schema snapshots versus authoritative migrations
- static marketing site contact/waitlist behavior
- retired or hidden admin/event routes

## Output Format

For audits, report:

```markdown
## Documentation Truth Check

- Scope:
- Sources checked:
- Findings:
- Changes made:
- External checks still needed:
```

For implementation work, end with:

- files changed
- claims corrected
- verification performed
- remaining uncertainty, especially anything requiring live provider access

## Boundaries

Do not treat documentation as proof of live production state when the question depends on Vercel, Supabase, Stripe, Resend, Twilio, or Gmail account configuration. Mark those as external checks unless live connector or CLI access is explicitly available and used.

Do not make product, schema, or deployment changes just to satisfy stale docs unless the user asked for implementation work. Correct the docs or open a follow-up issue instead.
