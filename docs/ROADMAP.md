# Roadmap

This roadmap lists work that is not already implemented in the current repo.

Items that already exist in code or docs have been removed from the active roadmap so this file stays grounded in current reality rather than historical intent.

## Priority 1: Current Gaps

These items most directly affect launch safety, payment correctness, security, and operational reliability.

### Auth and Access Control

- Decide the final protected edge-function auth posture:
  - keep manual `requireUser()` validation with `verify_jwt = false`
  - or re-enable Supabase gateway JWT verification after staged testing
- Run a full RLS audit for buyer, seller, admin, and service-role paths against the current migrations and active client queries.

### Payments and Financial Operations

- Rehearse Stripe payout behavior end to end with a real GB-connected seller account:
  - onboarding complete
  - charge succeeds
  - platform fee is correct
  - vendor receives funds correctly
- Add a repeatable reconciliation process for:
  - order total
  - Stripe fee
  - platform fee
  - vendor net
  - refund amount

### Notifications and Recovery

- Verify Resend and Twilio setup end to end in the real target environments.
- Add a real retry/backlog sweep mechanism for notifications:
  - external scheduler
  - operator-triggered job
  - or another explicit recovery process
- Decide whether `whatsapp-notify` should remain deployed as legacy compatibility code or be retired after all environments are confirmed clean.

### Environment and Deployment Safety

- Remove reliance on implicit origin fallback by setting `ALLOWED_ORIGINS` explicitly everywhere.
- Verify staging and production environment parity across:
  - Vercel app vars
  - Supabase secrets
  - Stripe accounts and webhook endpoints
  - notification providers
- Decide whether `VITE_STRIPE_PUBLIC_KEY` should be removed from examples/docs or reintroduced through real Stripe.js usage.
- Fix or replace incomplete setup artifacts outside `docs/`, especially stale schema/setup references that can mislead operators.

### Testing and Fixtures

- Expand Playwright beyond auth smoke into a full payment-path rehearsal:
  - order creation
  - Stripe test checkout
  - webhook paid transition
  - vendor state progression
  - admin refund
- Add a repeatable local reset/seed baseline that actually works with the checked-in repo state.
- Ensure shared test sellers used for payment-path testing are Stripe-onboarded in the relevant environments.

### Product and Operations Gaps

- Fix the static marketing site's operational drift:
  - broken or stale links
  - placeholder contact details

## Priority 2: Next

These items matter, but they do not block a safe first launch if Priority 1 is complete.

### Infrastructure and Environment Maturity

- Enable Supabase Pro features such as database branches if they become part of the deployment model.
- Run a backup verification and restore drill.
- Add environment comparison checks so staging and production do not drift silently.
- Decide whether preview deployments should have backend connectivity.

### Product and Admin Capability

- Improve admin tooling for investigating:
  - failed payments
  - refunded orders
  - notification failures
  - individual vendor performance and payout context
- Add stronger vendor-side search, filtering, and volume handling for larger order queues.
- Add buyer profile defaults for checkout data such as phone and country instead of relying on one deployment default country code.

### Engineering Quality

- Refactor large page components into clearer feature boundaries.
- Reduce inline-style-heavy UI surfaces where maintainability is suffering.
- Improve automated coverage depth around:
  - order creation validation
  - inventory finalization and restock
  - refund eligibility
  - auth failure paths
  - notification dispatch behavior
- Add stronger CI checks for docs, tests, and release consistency.

## Priority 3: Later

These are worthwhile improvements, but they should not distract from launch safety or operational maturity.

### UI and UX

- Full visual polish pass across buyer, vendor, and admin surfaces.
- Design system cleanup and stronger shared component consistency.
- Better mobile-first polish for high-traffic buyer flows.
- Improved loading, empty, and error states throughout the app.
- Accessibility pass across forms, dashboards, and order tracking.
- Cleanup and redesign of the static marketing site.

### Product Expansion

- True multi-event and broader multi-tenant support.
- Expanded organiser tooling.
- Buyer-facing notification history.
- QR tooling and event operations utilities.
- Broader buyer account management.

### Scale and Performance

- Large-scale concurrency and load-test tooling.
- Deeper performance profiling for peak-event traffic.
- Background-job architecture changes if current edge-function plus outbox flow no longer scales.
- Archival and retention strategy for orders, notifications, and audit logs.

## Ongoing Principles

- Prefer safe, reversible changes over broad refactors.
- Keep repo truth aligned with live truth.
- Treat payments, auth, refunds, and notifications as critical systems.
- Do not rely on historical PR titles, setup notes, or schema snapshots as runtime truth.
- When a manual production fix is required, capture it in code and docs immediately afterward.
