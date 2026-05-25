# Priority 1: Current Gaps

Read this when you need the priority 1: current gaps details from [Roadmap](../ROADMAP.md).

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
- Keep `VITE_STRIPE_PUBLIC_KEY` out of active Vercel/env examples unless real Stripe.js usage is deliberately reintroduced.
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
