# SKIIP Drift Checks

Use this reference when checking documentation against implementation.

## Documentation Hierarchy

Primary source of truth:

- `docs/README.md`
- documents linked from `docs/README.md`

Secondary context:

- root `README.md`
- active `PHASE7.md`
- GitHub issues and project board
- recent PR descriptions
- current branch changes

Legacy or cautionary context:

- `PLAN.md`
- `docs/PROGRESS.md`
- `docs/PROGRESS-2.md`
- `client.md`
- `meeting.md`
- old setup snippets
- schema snapshots outside `supabase/migrations/`

If legacy notes conflict with current docs and implementation, update or ignore the legacy notes rather than letting them override `docs/`.

## High-Value Searches

Use targeted searches for common stale references:

```powershell
Select-String -Path docs\*.md,README.md,app\.env.example -Pattern 'VITE_VENDOR_INVITE_CODE','VITE_STRIPE_PUBLIC_KEY','processing','shipped','delivered','localStorage','admin/events'
```

```powershell
Select-String -Path docs\*.md,README.md -Pattern 'schema snapshot','seed.sql','verify_jwt','ALLOWED_ORIGINS','notification-dispatch'
```

Prefer `rg` when it works in the environment. Use PowerShell `Select-String` as the fallback.

## Claim-To-Code Map

Auth and roles:

- Docs: `docs/CURRENT_STATE.md`, `docs/reference/RLS_ACCESS_MATRIX.md`, `docs/launch/SECRETS.md`
- Code: `supabase/config.toml`, `supabase/functions/**`, `supabase/migrations/**`

Payments:

- Docs: `docs/operations/OPERATIONS.md`, `docs/launch/DEPLOYMENT.md`, `docs/ROADMAP.md`
- Code: `supabase/functions/stripe-*`, payment migrations, app admin order views

Notifications:

- Docs: `docs/operations/NOTIFICATIONS.md`, `docs/operations/OPERATIONS.md`
- Code: `supabase/functions/notification-dispatch`, Resend/Twilio webhook functions, notification migrations

Release and CI:

- Docs: `docs/launch/RELEASES.md`, `docs/delivery/BRANCHING_WORKFLOW.md`, `docs/delivery/GITHUB_SETUP.md`
- Code: `.github/workflows/`, `VERSION`, `app/package.json`, `scripts/sync-version.mjs`

Marketing site:

- Docs: `docs/CURRENT_STATE.md`, `docs/ROADMAP.md`, `docs/operations/OPERATIONS.md`
- Code: `site/`

## Findings Guidance

Use severity based on operator risk:

- `High`: could cause unsafe launch, wrong payment/refund action, bad auth/security assumption, or production deployment error
- `Medium`: could waste engineering time or mislead staging/release work
- `Low`: stale wording, old examples, or cleanup that does not affect launch decisions

Prefer concrete file references and exact claims. Avoid vague statements like "docs need cleanup" without pointing to the mismatched behavior.
