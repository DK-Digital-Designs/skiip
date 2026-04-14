# Skiip Security & Stability Analysis and Improvement Plan

## Scope and methodology

This review was based on:
- Frontend auth/session handling and error boundaries.
- Supabase Edge Functions for checkout, onboarding, webhook, and WhatsApp notifications.
- Postgres schema, RLS policies, and helper RPC functions.

## Executive summary

Skiip has strong foundations (RLS enabled, webhook signature verification, transaction-oriented RPC patterns), but there are several **high-priority security/stability gaps**:

1. **Edge Functions currently permit broad cross-origin access and do not enforce caller authentication/authorization at the function boundary.**
2. **Guest access RLS policies are over-permissive (`session_id IS NOT NULL` pattern), creating data exposure risk.**
3. **Payment flow consistency can drift because the checkout function trusts client-provided item prices and quantities.**
4. **Operational resilience needs stronger idempotency, rate limiting, and observability controls.**

Addressing these four areas first will produce the biggest security and reliability improvement.

---

## Key findings

## 1) Edge function access controls are too open (Critical)

### Evidence
- `stripe-checkout`, `stripe-onboarding-link`, and `whatsapp-notify` use `Access-Control-Allow-Origin: *`.
- These functions rely on service-role DB access internally, but do not consistently validate the authenticated caller and role before performing sensitive actions.

### Risk
- Browser abuse from untrusted origins.
- Privilege escalation paths if business-logic checks are bypassed.
- Higher bot/spam pressure and accidental misuse.

### Plan
- Replace wildcard CORS with environment-specific allowlists.
- Require JWT auth for all non-webhook functions.
- Enforce role/store ownership checks inside each function before any mutation.
- Add request schemas and reject unknown fields.

## 2) Guest RLS policies are over-broad (Critical)

### Evidence
- Cart and cart_items policies use conditions equivalent to: allow access when `session_id IS NOT NULL`.
- Guest order visibility policy allows any unauthenticated request where `customer_email IS NOT NULL`.

### Risk
- Unauthorized read/update/delete of cart/order data by guessing IDs or abusing API pathways.

### Plan
- Replace open guest checks with signed guest tokens (JWT/custom claim) tied to a specific cart/order identifier.
- Introduce one-time guest access secrets for order tracking.
- Restrict guest read/update to exact token+resource match.

## 3) Checkout integrity should be server-authoritative (High)

### Evidence
- Checkout line items and totals are derived from client-submitted payload (`items`, `price`, `quantity`).

### Risk
- Price tampering or mismatch between order records and Stripe charge amounts.

### Plan
- Rehydrate items server-side from product IDs and authoritative DB pricing.
- Validate order total equals server-computed total before Stripe session creation.
- Fail closed on mismatches and write structured audit logs.

## 4) Payment and webhook reliability hardening needed (High)

### Evidence
- Webhook signature verification exists (good), but idempotency and replay handling are minimal.
- Inventory decrement can be called repeatedly for duplicate webhook deliveries.

### Risk
- Duplicate state transitions and stock inaccuracies under webhook retries.

### Plan
- Add `processed_events` table keyed by Stripe event ID.
- Make webhook handlers idempotent with transactional guards.
- Add explicit order state machine checks to prevent invalid transitions.

## 5) Frontend resilience and data hygiene improvements (Medium)

### Evidence
- Global error handler clears all local/session storage on error.

### Risk
- User-impacting data loss and harder incident triage.

### Plan
- Replace global storage wipe with targeted key cleanup and circuit-breaker logic.
- Add progressive backoff for auth/session retries.
- Add feature flags for degraded-mode operation during partial outages.

## 6) Platform-level controls are not formalized yet (Medium)

### Plan
- Introduce API/function rate limiting per IP + user + store.
- Implement dependency and secrets scanning in CI.
- Add mandatory migration checks for RLS regressions.
- Define incident runbooks, SLOs, and alert thresholds.

---

## 30-60-90 day implementation roadmap

## First 30 days (Blockers)
1. Lock down CORS and require JWT in edge functions.
2. Patch RLS guest policies to token-bound access patterns.
3. Make checkout server-authoritative for item pricing.
4. Add webhook idempotency table and replay protection.
5. Add baseline structured logging with correlation IDs.

## Days 31-60 (Hardening)
1. Add per-endpoint rate limiting and abuse detection.
2. Add migration tests for RLS and role boundaries.
3. Add chaos testing for payment and realtime workflows.
4. Add queue/retry strategy for outbound WhatsApp notifications.

## Days 61-90 (Operational excellence)
1. Define and monitor SLOs (checkout success, webhook lag, realtime latency).
2. Add automated rollback playbooks and runbook drills.
3. Perform external security review and targeted penetration testing.
4. Complete disaster recovery validation (backup restore + failover exercise).

---

## Suggested owners

- **Backend/Supabase owner:** RLS fixes, function authz, idempotency.
- **Frontend owner:** error boundary hardening, graceful degradation.
- **DevOps owner:** CI scans, secrets management, observability/SLOs.
- **Product/Ops owner:** incident response workflow and communication templates.

## Success criteria

- 0 critical endpoints with wildcard CORS in production.
- 100% sensitive edge functions enforce auth + role checks.
- 0 unauthorized guest cart/order access in security tests.
- 0 duplicate webhook side effects in replay tests.
- Checkout mismatch rate <0.1% and mean webhook processing <5s.
