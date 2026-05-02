# Agent Automation Plan

This plan defines how to turn SKIIP's current Codex, MCP, plugin, GitHub, and project-local skill setup into repeatable launch and operations workflows.

## Objective

Create a small set of SKIIP-specific skills, scripts, and automations that reduce repeated manual project checks around launch readiness, payments, auth/RLS, staging smoke failures, documentation drift, and delivery hygiene.

The goal is not to replace engineering judgment. The goal is to make recurring checks consistent, fast, and easy to run from the current repo state.

## Current Baseline

Available capabilities:

- GitHub connector and authenticated `gh` CLI access for issues, projects, pull requests, workflow runs, and CI triage.
- Gmail connector for email search and launch/vendor/client communication triage.
- Browser Use, Build Web Apps, GitHub, Gmail, Vercel, Documents, Spreadsheets, and Presentations plugins.
- Project-local Supabase/Postgres best-practices skill in `.agents/skills/supabase-postgres-best-practices`.
- GitHub Actions for app quality checks, static site deployment, and weekday staging smoke checks.

Current gaps:

- No SKIIP-specific agent skills for launch operations, payment operations, auth/RLS auditing, smoke triage, or documentation drift.
- No Codex automations currently configured for recurring launch or operational checks.
- Some recurring work depends on manual context gathering from docs, GitHub issues, CI, Supabase functions, Stripe behavior, and environment notes.

## Implementation Status

- Created: `.agents/skills/skiip-doc-truth-maintainer`
- Not started: `skiip-launch-operator`, `skiip-payment-ops`, `skiip-rls-auth-auditor`, `skiip-staging-smoke-triage`
- Not started: proposed deterministic scripts and recurring automations

## Proposed Skills

Create these as project-local skills under `.agents/skills/` so they travel with the repository and are visible to future agents working in SKIIP.

### 1. `skiip-launch-operator`

Use for launch readiness checks, release preparation, go/no-go review, and operational risk summaries.

Core references:

- `docs/CURRENT_STATE.md`
- `docs/ROADMAP.md`
- `docs/launch/LAUNCH_CHECKLIST.md`
- `docs/operations/OPERATIONS.md`
- `docs/delivery/GITHUB_SETUP.md`
- current GitHub P0/P1 launch issues

Expected behavior:

- Summarize launch blockers and unresolved risks.
- Check whether roadmap, launch checklist, GitHub issues, and current implementation still agree.
- Produce a short readiness brief with blockers, warnings, and next actions.

### 2. `skiip-payment-ops`

Use for Stripe Checkout, Connect, refunds, webhook finalization, payment failure, reconciliation, payout rehearsal, and payment incident triage.

Core references:

- `docs/operations/OPERATIONS.md`
- `docs/launch/DEPLOYMENT.md`
- `docs/launch/SECRETS.md`
- `supabase/functions/stripe-webhook/`
- `supabase/functions/stripe-refund/`
- `supabase/functions/stripe-reconcile-order/`
- payment-related migrations and tests

Expected behavior:

- Triage "payment captured but order not paid" incidents.
- Verify order, fee, platform fee, Stripe fee, vendor net, and refund state.
- Guide safe reconciliation and escalation steps.
- Identify missing test coverage for payment-path changes.

### 3. `skiip-rls-auth-auditor`

Use for protected edge-function auth posture, RLS review, buyer/seller/admin/service-role boundary checks, and security-sensitive migrations.

Core references:

- `docs/reference/RLS_ACCESS_MATRIX.md`
- `docs/CURRENT_STATE.md`
- `docs/launch/SECRETS.md`
- `supabase/config.toml`
- `supabase/functions/**`
- `supabase/migrations/**`

Expected behavior:

- Verify launch-explicit manual bearer validation behavior.
- Check protected functions for expected `requireUser()` and authorization paths.
- Review migrations for buyer/seller/admin/service-role boundary regressions.
- Flag drift between RLS docs and actual SQL.

### 4. `skiip-staging-smoke-triage`

Use when staging smoke checks fail or need review.

Core references:

- `.github/workflows/staging-smoke.yml`
- `app/playwright.config.js`
- `app/tests/e2e/`
- `docs/operations/TESTING_DATA.md`
- `docs/operations/OPERATIONS.md`

Expected behavior:

- Inspect latest smoke workflow status.
- Fetch failed job logs and artifacts when available.
- Classify failures as auth, config, deployment, route, fixture, or product regression.
- Recommend the next issue, PR, or environment action.

### 5. `skiip-doc-truth-maintainer`

Use for repo truth checks, documentation drift, stale setup notes, and release documentation updates.

Core references:

- `docs/README.md`
- `docs/CURRENT_STATE.md`
- `docs/ROADMAP.md`
- `docs/launch/DEPLOYMENT.md`
- `docs/launch/SECRETS.md`
- `README.md`
- root legacy notes such as `PLAN.md`, `PROGRESS.md`, `client.md`, and `meeting.md`

Expected behavior:

- Detect stale references to retired flows, env vars, schema snapshots, launch assumptions, and demo copy.
- Keep `docs/` as the source of truth.
- Suggest doc updates when implementation changes affect operations, deployment, or launch state.

## Proposed Scripts

Add deterministic scripts under `scripts/` where agent work benefits from repeatable checks.

### `scripts/check-env-matrix.mjs`

Compare documented environment variables against local examples and known deployment docs.

Inputs:

- `app/.env.example`
- `docs/launch/SECRETS.md`
- `docs/launch/DEPLOYMENT.md`
- `docs/launch/ENVIRONMENT_MATRIX.md`
- `supabase/config.toml`

Output:

- missing variables
- stale variables
- variables documented in one place but absent elsewhere
- risky fallback behavior to review

### `scripts/audit-edge-functions.mjs`

Scan Supabase edge functions for expected launch auth and operational patterns.

Checks:

- protected functions use the expected bearer/session validation helper
- admin-only functions enforce admin authorization
- CORS origin handling does not silently depend on unsafe defaults
- payment/refund functions write audit or failure state where expected

### `scripts/release-readiness.mjs`

Run a lightweight release gate from the repo root.

Checks:

- app lint/test/build
- version sync
- docs index links
- new migrations are present when schema behavior changes
- edge-function changes are reflected in deployment or operations docs

### `scripts/find-stale-launch-refs.mjs`

Search for stale or launch-sensitive references.

Examples:

- `VITE_VENDOR_INVITE_CODE`
- `VITE_STRIPE_PUBLIC_KEY`
- old order statuses such as `processing`, `shipped`, and `delivered`
- schema snapshot references
- marketing localStorage lead-capture assumptions
- retired `/admin/events` assumptions

### `scripts/smoke-summary.mjs`

Parse Playwright output into a compact operational summary.

Inputs:

- `app/playwright-report`
- `app/test-results`

Output:

- failed tests
- first relevant error
- likely failure area
- next suggested diagnostic command

## Proposed Automations

Start with read-only reporting automations. Add write actions only after the summaries are consistently useful.

### Weekday Staging Health Brief

Schedule:

- Weekdays after the existing staging smoke workflow has had time to finish.

Task:

- Inspect the latest staging smoke run.
- Summarize failures, artifacts, and likely causes.
- Cross-reference open launch and smoke-related GitHub issues.

Output:

- short status: green, warning, or failed
- failure classification
- recommended next action

### Monday Launch Readiness Audit

Schedule:

- Weekly on Monday morning.

Task:

- Review open P0/P1 GitHub issues.
- Compare `docs/ROADMAP.md`, `docs/launch/LAUNCH_CHECKLIST.md`, and `docs/CURRENT_STATE.md`.
- Highlight launch blockers, stale docs, and unresolved external dependencies.

Output:

- launch blockers
- risks to watch
- docs or issue updates needed

### Friday Branch And Release Hygiene

Schedule:

- Weekly on Friday afternoon.

Task:

- Check branch state, failed checks, stale short-lived branches, and version/doc drift.
- Compare staging and main release posture.

Output:

- branch hygiene summary
- release-readiness warnings
- suggested cleanup actions

### Daily Blocker Digest

Schedule:

- Daily during launch hardening.

Task:

- Summarize open P0/P1 issues and newly opened bugs.
- Group by auth/RLS, payments, notifications, environment, smoke testing, and frontend operations.

Output:

- top blockers
- changed since previous digest
- suggested next work item

### Gmail Launch And Vendor Digest

Schedule:

- Optional daily or twice weekly.

Task:

- Search Gmail for SKIIP, Stripe, Supabase, Vercel, Resend, Twilio, vendor, and client terms.
- Summarize only actionable project messages.

Output:

- urgent messages
- vendor/client follow-ups
- external account or provider tasks

## Implementation Phases

### Phase 1: Skill Foundation

Create:

- `.agents/skills/skiip-launch-operator/SKILL.md`
- `.agents/skills/skiip-payment-ops/SKILL.md`
- `.agents/skills/skiip-rls-auth-auditor/SKILL.md`

Acceptance criteria:

- Each skill has clear frontmatter triggers.
- Each skill points to the minimum necessary repo references.
- Each skill produces a concise, repeatable output format.
- Skills are validated with the standard skill validation script.

### Phase 2: Deterministic Checks

Create:

- `scripts/check-env-matrix.mjs`
- `scripts/audit-edge-functions.mjs`
- `scripts/find-stale-launch-refs.mjs`

Acceptance criteria:

- Scripts can run locally from the repo root.
- Scripts do not require live production credentials.
- Failures are actionable and not noisy.
- Docs explain when to trust script output versus manual verification.

### Phase 3: Triage And Reporting

Create:

- `.agents/skills/skiip-staging-smoke-triage/SKILL.md`
- `.agents/skills/skiip-doc-truth-maintainer/SKILL.md`
- `scripts/smoke-summary.mjs`
- `scripts/release-readiness.mjs`

Acceptance criteria:

- Smoke triage can inspect GitHub workflow context and local Playwright artifacts.
- Doc truth checks clearly distinguish docs drift from implementation bugs.
- Release-readiness output can be used as a PR or release checklist.

### Phase 4: Recurring Automations

Create read-only Codex automations for:

- Weekday staging health brief
- Monday launch readiness audit
- Friday branch and release hygiene
- Daily blocker digest during launch hardening
- Optional Gmail launch/vendor digest

Acceptance criteria:

- Automations produce concise summaries.
- Automations do not change GitHub, docs, branches, deployments, or provider state.
- Any proposed write action is listed as a recommendation for manual approval.

## Issue-Ready Draft

Title:

```text
Create SKIIP-specific agent skills, scripts, and read-only launch automations
```

Body:

```markdown
## Goal

Turn SKIIP's current Codex/GitHub/Gmail/plugin setup into repeatable launch and operations workflows.

## Scope

- Add project-local skills for launch operations, payment operations, auth/RLS auditing, staging smoke triage, and documentation truth maintenance.
- Add deterministic scripts for environment drift, edge-function auth checks, stale launch references, smoke summaries, and release readiness.
- Add read-only automations for weekday staging health, weekly launch readiness, weekly branch/release hygiene, daily blocker digest, and optional Gmail launch/vendor triage.

## Proposed Skills

- `skiip-launch-operator`
- `skiip-payment-ops`
- `skiip-rls-auth-auditor`
- `skiip-staging-smoke-triage`
- `skiip-doc-truth-maintainer`

## Proposed Scripts

- `scripts/check-env-matrix.mjs`
- `scripts/audit-edge-functions.mjs`
- `scripts/release-readiness.mjs`
- `scripts/find-stale-launch-refs.mjs`
- `scripts/smoke-summary.mjs`

## Acceptance Criteria

- Skills live under `.agents/skills/` and validate successfully.
- Scripts run from the repo root and do not require production credentials.
- Automations are read-only and summarize recommended actions instead of mutating repo or provider state.
- Output formats are concise enough to use during launch hardening.
- Documentation index links to the plan and remains the source of truth.
```

## Recommended First Action

Start with `skiip-launch-operator`, `skiip-payment-ops`, and `skiip-rls-auth-auditor`.

These three skills map directly to the highest-risk current launch areas: launch readiness, payments, and auth/RLS boundaries.