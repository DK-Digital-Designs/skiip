# Roadmap

This roadmap is intentionally broad.

The goal is not to keep the list small. The goal is to capture the technical, operational, product, and later UX work that could materially improve SKIIP, then prioritize it properly.

The current target is a launch-ready pilot product that is safe for real payments, real customers, and real operational use.

## Priority 1: Now

These items most directly affect launch safety, payment correctness, security, and operational reliability.

### Auth and Security

- Decide the final protected edge-function auth posture:
  - keep manual `requireUser()` validation with `verify_jwt = false`
  - or re-enable Supabase gateway JWT verification after staged testing
- Run a full RLS audit now that edge functions are the write boundary:
  - buyers can only read their own orders
  - sellers can only access their own store data
  - admin-only paths are truly admin-only
  - service-role-only writes remain service-role-only
- Audit session expiry and token refresh behavior for buyer, seller, and admin flows.
- Audit CORS and `ALLOWED_ORIGINS` across local, preview, staging, and production.
- Create a secrets and environment inventory:
  - what exists
  - what is required
  - what is optional
  - what should be rotated
- Add a formal secret rotation checklist for Supabase, Stripe, email, and WhatsApp providers.
- Decide whether email confirmation remains disabled through pilot launch and document that decision explicitly.

### Payments and Stripe

- Verify Stripe payout behavior end to end:
  - onboarding is complete
  - charge succeeds
  - vendor receives funds correctly
  - platform fee behavior is correct
- Add explicit handling for failed payment events such as `payment_intent.payment_failed`.
- Surface failed payment states clearly in admin reporting and operational logs.
- Verify refund behavior end to end:
  - Stripe refund creation
  - database state update
  - audit log
  - customer notification
- Add financial reconciliation checks for:
  - gross order total
  - Stripe fee
  - platform fee
  - vendor net
- Decide what level of fee and payout reporting should be visible in the admin dashboard before launch.

### Testing and Quality

- Commit and maintain a real Playwright smoke suite for deployed environments.
- Add a repeatable seed/reset flow for test environments.
- Add a test fixture strategy for buyer, seller, admin, store, and product setup.
- Add automated staging smoke coverage for:
  - buyer signup/login
  - order creation
  - Stripe test checkout
  - webhook paid transition
  - vendor state progression
  - admin refund
- Add a webhook simulation strategy for local and CI verification.
- Expand unit and integration tests around:
  - order creation validation
  - inventory finalization
  - refund eligibility
  - auth failure paths
  - notification dispatch logging

### Operations and Reliability

- Define a real launch checklist for switching from test mode to live mode.
- Add operational monitoring and alerting for:
  - webhook failures
  - refund failures
  - notification failure spikes
  - edge-function error spikes
- Add an incident response checklist for payment failures and stuck orders.
- Add an explicit rollback checklist for:
  - frontend deployment
  - function deployment
  - migration rollout
- Verify logging is sufficient for production troubleshooting without leaking secrets or sensitive customer data.
- Add a vendor onboarding checklist for real operators, not just developers.

### Data and Schema

- Protect the current migration discipline:
  - no manual SQL without follow-up migration capture
  - no undocumented remote drift
- Audit remaining legacy schema files and historical SQL references that could mislead future work.
- Confirm the live-working schema is fully represented by committed migrations.
- Add a schema verification step to release discipline so production truth and repo truth stay aligned.

### Notifications

- Verify email notification coverage end to end.
- Verify WhatsApp notification behavior end to end for the chosen provider.
- Confirm which notification events are launch-critical and which are optional.
- Add a retry/recovery strategy for failed notification delivery.
- Decide whether buyer-visible notification history is needed for launch or can wait.

## Priority 2: After

These items matter, but they do not block a safe first launch if the Priority 1 work is complete.

### Infrastructure and Environment Maturity

- Enable Supabase Pro and adopt database branches.
- Set up backup verification and run a restore drill.
- Create a cleaner staging-to-production promotion workflow.
- Add environment comparison checks so staging and production do not drift silently.
- Decide whether preview deployments should have partial or full backend connectivity.

### Product and Operational Capability

- Add vendor-side order search and stronger filtering once order volume grows.
- Add automatic cleanup rules for stale unpaid orders or abandoned checkout states.
- Add better admin tooling for investigating individual orders and notification history.
- Add better operational views for:
  - failed payments
  - refunded orders
  - notification failures
  - payout status
- Improve admin analytics to include more financial and operational reconciliation data.

### Engineering Quality

- Refactor large page components into clearer feature boundaries.
- Reduce inline-style-heavy surfaces where maintainability is suffering.
- Improve test coverage depth, not just smoke coverage.
- Add branch protection and release discipline around staging and production merges.
- Add stronger CI checks for docs, tests, and build consistency.
- Decide whether to introduce stricter typing coverage over time.

### Auth and Account Improvements

- Add Google SSO.
- Add Apple SSO.
- Decide whether passwordless or magic-link flows are desirable after launch.
- Revisit whether email confirmation should return once SMTP and support processes are stronger.
- Add a buyer settings/profile page that stores default checkout details such as country, email, and phone number, then reuse that data at checkout and for phone normalization instead of relying on a single deployment default.

### Notification Strategy

- Finalize the long-term WhatsApp provider decision.
- If moving away from Twilio, define and execute a migration plan to Meta Cloud API or another provider.
- Add provider abstraction if multiple notification backends will be supported.

## Priority 3: Later

These are worthwhile improvements, but they should not distract from launch safety or operational maturity.

### UI and UX

- Full visual polish pass across buyer, vendor, and admin surfaces.
- Design system cleanup and stronger shared component consistency.
- Better typography, spacing, and responsive behavior across the app.
- Improved mobile-first polish for high-traffic buyer flows.
- Better loading, empty, and error states throughout the app.
- Improved visual treatment of order progress, notifications, and operational states.
- Accessibility pass across forms, dashboards, and order tracking.
- Cleanup and redesign of the static marketing site.

### Product Expansion

- Buyer order history across venues.
- Buyer profile and account management.
- Advanced analytics beyond current admin metrics.
- Multi-event and fuller multi-tenant expansion.
- Expanded organiser tooling.
- Global pause / emergency controls.
- QR tooling and event operational utilities.

### Scale and Performance

- Large-scale concurrency and load-test tooling.
- Deeper performance profiling for peak-event traffic.
- Background job strategy if volume eventually exceeds current direct-flow model.
- Data archival strategy for long-term growth in logs and audit tables.

## Ongoing Principles

These apply regardless of priority.

- Prefer safe, reversible changes over broad refactors.
- Keep repo truth aligned with live truth.
- Document operational decisions when they are made.
- Treat payments, auth, refunds, and notifications as critical systems.
- Do not rely on tribal knowledge for deployment or recovery steps.
- When a manual production fix is ever required, capture it in code and docs immediately afterward.
