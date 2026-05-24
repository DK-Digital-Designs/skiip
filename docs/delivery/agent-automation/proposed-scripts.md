# Proposed Scripts

Read this when you need the proposed scripts details from [Agent Automation Plan](../AGENT_AUTOMATION_PLAN.md).

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
