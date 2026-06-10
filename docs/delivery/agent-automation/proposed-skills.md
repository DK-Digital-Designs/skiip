# Proposed Skills

Read this when you need the proposed skills details from [Agent Automation Plan](../AGENT_AUTOMATION_PLAN.md).

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
- current `PHASE7.md` plus archived notes such as `docs/PROGRESS.md`, `docs/PROGRESS-2.md`, `docs/archive/phase-reports/phase-6/PHASE6.md`, `PLAN.md`, `client.md`, and `meeting.md`

Expected behavior:

- Detect stale references to retired flows, env vars, schema snapshots, launch assumptions, and demo copy.
- Keep `docs/` as the source of truth.
- Suggest doc updates when implementation changes affect operations, deployment, or launch state.
