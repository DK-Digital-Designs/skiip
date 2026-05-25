# Known Weak Spots

Read this when you need the known weak spots details from [Current State](../CURRENT_STATE.md).

These are the main remaining risks in the current baseline.

### 1. Auth posture is launch-explicit but should be revisited after launch

`verify_jwt = false` is still used for protected browser-facing edge functions, with manual auth enforcement in code through `requireUser()`. For the May 2026 launch this is explicit: missing, invalid, and expired bearer tokens should return `401`; authenticated users without a readable profile or required authorization should return `403`.

### 2. Environment drift remains easy to introduce

- `VITE_VENDOR_INVITE_CODE` is no longer part of the launch app route, but stale references may remain in legacy docs or unmounted code
- `ALLOWED_ORIGINS` has a hardcoded fallback list in code if the env var is missing
- `VITE_STRIPE_PUBLIC_KEY` has been removed from active env examples; continue avoiding frontend Stripe public-key setup unless Stripe.js is deliberately reintroduced

### 3. Local reset and schema guidance still have drift

- `supabase/config.toml` points `db reset` at `supabase/seed.sql`, but that file is not committed
- legacy schema snapshots still exist in `supabase/` and can be mistaken for the authoritative schema if someone ignores migrations

### 4. Some schema and UI remnants are legacy

- legacy order statuses such as `processing`, `shipped`, and `delivered` still exist in the schema
- the current UI and edge-function lifecycle do not use them
- event management remains deferred and `/admin/events` is not exposed in normal admin navigation/routing

### 5. Analytics provider activation is external

- the repo mounts Vercel Web Analytics and Speed Insights, but the hosted Vercel project still needs those features enabled and verified
- Google Search Console verification, sitemap submission, URL Inspection, and reporting access are external account tasks
- Search Console and Speed Insights reporting can lag until Google recrawls the site and real traffic reaches the production deployment

### 6. External database observability is documented but not configured

- the repo now documents Supabase Metrics API setup for Prometheus-compatible collectors
- no Prometheus, Grafana, Datadog, or hosted collector config is committed in this repository
- if launch monitoring requires external database-health alerts, that setup remains a provider-side operations task
