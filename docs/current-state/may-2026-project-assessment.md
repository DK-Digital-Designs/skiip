# May 2026 Project Assessment

Read this when you need the may 2026 project assessment details from [Current State](../CURRENT_STATE.md).

*Recorded 2026-05-04. Based on a full codebase review at v0.21.0.*

### What Is Strong

- **Server-authoritative order flow.** No client-trusted pricing or order creation. All critical mutations go through edge functions. The April 2026 refactor was the right architectural decision.
- **Edge function coverage is comprehensive.** 14 functions cover the full order, payment, notification, and reconciliation lifecycle, including recovery paths (`stripe-reconcile-order`, `notification-dispatch`) that most projects omit.
- **Notification outbox pattern is durable.** Business mutations and notifications are decoupled. A failed notification cannot fail an order.
- **Migration history is clean.** 24 timestamped, sequential migrations tell the full database history. No schema drift.
- **Payment resilience is layered.** Stripe webhook idempotency, auto-refund on inventory failure, multiple webhook secrets, and admin-level payment state recovery.
- **Audit logging covers the money path.** `audit_logs` captures order creation, payment, transitions, refunds, and admin vendor mutations.
- **Documentation is honest and maintained.** `ARCHITECTURE.md`, `CURRENT_STATE.md`, `ROADMAP.md`, and `LAUNCH_CHECKLIST.md` are current and reflect actual implementation, not historical intent.

### Additional Pre-Launch Risk Items

These extend the [Known Weak Spots](./known-weak-spots.md) topic with items identified in the May 2026 review.

#### Test coverage is the single largest launch risk

Current automated coverage: 35 unit tests, 3 public e2e smoke tests, 3 skipped auth tests.

The following paths have no automated test coverage:

- inventory finalization (`finalize_paid_order_inventory`)
- automatic refund on inventory failure after capture
- Stripe webhook idempotency and retry behavior
- order status transition guards
- notification dispatch failure behavior

If something breaks in the payment finalization path, there is no automated signal. The existing Vitest and Playwright infrastructure is in place to extend coverage.

#### Notification retry has no automatic trigger

The outbox is durable and `notification-dispatch` can drain the backlog, but nothing calls it automatically. A failed background dispatch in `waitUntil()` leaves notifications stuck in `notification_logs` until a manual trigger. A `pg_cron` job or external scheduler calling `notification-dispatch` on a fixed interval would close this gap.

#### `seed.sql` is missing

`supabase/config.toml` references `supabase/seed.sql` for `db reset`, but that file is not committed. Local reset is currently broken for any fresh environment. A minimal seed with test roles, a store, and a few products is sufficient.

#### `ALLOWED_ORIGINS` hardcoded fallback is unresolved

The `_shared/http.ts` fallback list contains specific production and preview URLs baked into code. This is already noted under environment drift above. Resolving it before go-live means setting `ALLOWED_ORIGINS` explicitly in every hosted environment and making the in-code fallback localhost-only.

### Technical Debt — Not Launch Blocking

These items do not block a safe first launch but carry ongoing maintenance cost.

#### Legacy files still present in the repo

The following files are not part of the active routed application:

- `app/src/pages/attendee/BuyerLogin.jsx`
- `app/src/pages/attendee/BuyerSignup.jsx`
- `app/src/pages/admin/Dashboard.jsx` — superseded by `DashboardV2.jsx`
- `app/src/pages/vendor/Signup.jsx` — unexposed stub
- `supabase/schema.sql`, `supabase/skiip-schema.sql`, `supabase/skiip-schema-full-reset.sql` — non-authoritative legacy snapshots

`ARCHITECTURE.md` flags the legacy schema files correctly. The page files are not flagged and can cause confusion on returning to the codebase.

#### Large monolithic page components

| File | Approximate size |
| :--- | :--- |
| `app/src/pages/attendee/Checkout.jsx` | 17 KB |
| `app/src/pages/vendor/Dashboard.jsx` | 16 KB |
| `app/src/pages/admin/DashboardV2.jsx` | 16 KB |
| `app/src/pages/attendee/OrderTracker.jsx` | 13 KB |
| `app/src/pages/admin/Vendors.jsx` | 13 KB |
| `app/src/components/shared/GlobalHeader.jsx` | 10 KB |

`Checkout.jsx` is the highest-risk surface to have in a single large file. Decomposing it into step components would improve debuggability under launch pressure.

#### `whatsapp-notify` is still deployed as legacy code

The migration chain removed the database trigger that originally called `whatsapp-notify`. The function is effectively dead but still deployed on every `supabase functions deploy`. It should be retired when confirmed clean across all environments.

#### Sentry integration is unverified in production

`@sentry/browser` and `@sentry/react` are runtime dependencies. Whether a live DSN is configured in the production Vercel environment and whether payment-path errors are reaching the Sentry dashboard has not been confirmed.

### Improvement Candidates for After Launch

- **Notification retry scheduler.** See pre-launch risk item above. If deferred past launch, ensure the manual operator sweep process is documented and understood.
- **Mobile-first buyer flow polish.** Event-day buyers are on phones. The current roadmap places this at Priority 3, but the use case warrants moving it earlier post-launch.
- **Admin investigation tooling.** `audit_logs` and `notification_logs` have the data. Surfacing failed payments, notification failures, and per-vendor payout context in the admin UI reduces dependency on direct database access during incidents.
- **Marketing site operational integration.** If the external marketing repo needs real lead capture, connect it to a supported backend path instead of treating it as a static brochure surface.
- **Buyer profile defaults for checkout.** Storing country and phone on the buyer profile would reduce checkout friction, particularly at an event where users are on mobile under time pressure.
