# CODEBASE FINANCIAL ARCHITECTURE ANALYSIS

## Scope and Method
This review examined the full repository with emphasis on runtime payment flows, Supabase database design, edge-function behavior, Stripe Connect integration, and operational controls for a live-money marketplace.

---

## 1) SYSTEM OVERVIEW

### High-level architecture
- **Frontend:** React/Vite app calls Supabase directly for read-heavy app data and invokes Supabase Edge Functions for privileged operations (order creation, checkout session creation, status transitions, refunds, onboarding links).
- **Backend/API:** Supabase Edge Functions (Deno) are the transactional control plane for payment-critical operations.
- **Database:** Postgres (Supabase) with RLS policies and helper RPC functions for inventory and metrics.
- **Payments:** Stripe Checkout + Stripe Connect (Express accounts) + webhook-driven state finalization.
- **Notifications:** Twilio WhatsApp + Resend email through shared notification dispatcher and persistent `notification_logs`.

### Marketplace structure (customer ↔ platform ↔ vendor)
- **Customer** creates order through platform API and pays via Stripe Checkout.
- **Platform** creates destination charges with application fees, records ledger fields on `orders`, and manages state transitions.
- **Vendor** receives funds through Stripe Connect destination transfer path (subject to Stripe payout schedule) and fulfills orders through vendor dashboard/transition endpoint.

### Request lifecycle: frontend → backend → Stripe → DB
1. Buyer checkout page collects items + contact + tip.
2. Frontend invokes `order-create` edge function.
3. `order-create` recomputes totals from DB prices, inserts `orders`, then inserts `order_items`.
4. Frontend invokes `stripe-checkout` edge function with `order_id`.
5. `stripe-checkout` validates order state and recomputes subtotal consistency, creates Checkout Session with `payment_intent_data.transfer_data.destination` and `application_fee_amount`.
6. Stripe redirects customer, then emits webhook (`checkout.session.completed`).
7. `stripe-webhook` verifies signature, deduplicates event by Stripe event ID table, updates order financial fields, finalizes inventory via RPC, emits audit log + notifications.
8. Additional webhook paths handle account updates and refund/dispute events at limited depth.

### Order lifecycle (created → paid → fulfilled → refunded → disputed)
- **Created:** `status=pending`, `payment_status=pending` from `order-create`.
- **Paid:** webhook sets `status=paid`, `payment_status=succeeded`, sets `paid_at`, fee fields, and payment IDs.
- **Fulfillment:** vendor/admin triggers `order-transition` (`paid -> preparing -> ready -> collected`; cancellation allowed on intermediate states).
- **Refunded:** admin endpoint `stripe-refund` initiates Stripe refund then updates DB to `refunded`; webhook `charge.refunded` can also mark refunded.
- **Disputed:** only a warning log on `charge.dispute.created`; no persisted dispute workflow or order state model for dispute lifecycle.

---

## 2) STRIPE INTEGRATION ANALYSIS

### Charge model used
- **Model in use:** **Destination charges** (`transfer_data.destination`) with **platform application fee** (`application_fee_amount`) set at checkout session creation.
- Platform fee is computed as `10% of subtotal` (tip excluded from fee basis), while tip is part of total and transferred in destination charge path.

### Webhook handling logic
- Signature verification is implemented using `stripe.webhooks.constructEventAsync` and `STRIPE_WEBHOOK_SECRET`.
- Event types handled:
  - `checkout.session.completed`: marks payment success, computes fee fields, finalizes inventory, or auto-refunds on inventory failure.
  - `account.updated`: marks store onboarding complete when account capabilities are enabled/submitted.
  - `charge.refunded`: updates order to refunded.
  - `charge.dispute.created`: log-only.

### Idempotency handling
- **Implemented:** webhook event dedup table `stripe_processed_events` keyed by unique `stripe_event_id`.
- **Missing:** explicit Stripe API idempotency keys for:
  - checkout session creation,
  - refund creation,
  - connect account creation/account-link generation.
- **Gap:** idempotency is event-level, not order-intent-level; multiple successful Checkout Sessions for same order are not blocked structurally.

### PaymentIntent lifecycle management
- PaymentIntent is created implicitly by Checkout.
- Webhook reads PaymentIntent + latest charge and records `payment_intent_id`, `charge_id`, fee metrics.
- No explicit cancellation of stale/duplicate checkout sessions when one payment succeeds.

### Connect account onboarding flow
- `stripe-onboarding-link` creates Express account if missing and stores `stripe_account_id`.
- Vendor readiness enforced in checkout (`stripe_account_id` + `stripe_onboarding_complete` must be true).
- `stripe_onboarding_complete` is updated from Stripe `account.updated` webhook.

### Payout timing logic
- No internal payout scheduler in repo.
- Payout timing appears delegated fully to Stripe Connect account settings and Stripe payout schedules.
- No platform-side payout state machine or payout reconciliation table.

### Platform fee logic
- Platform fee hardcoded at `10%` of **subtotal**.
- Fee recorded twice: expected fee at checkout (`platform_fee` from local computation), then overwritten/confirmed from webhook using `payment_intent.application_fee_amount`.
- No per-vendor/per-event configurable fee rules.

### Tip passthrough logic
- Tip captured in `orders.tip_amount` and included as checkout line item.
- Platform fee excludes tip, implying operational intent: tips pass through to vendor/staff.
- No separate ledger object for tip settlement verification; only aggregate order-level values.

### Refund processing flow
- Admin-only `stripe-refund` endpoint validates role and order state, triggers Stripe refund, updates order rows and audit logs, optionally restocks inventory.
- Webhook `charge.refunded` also mutates order status to refunded.
- Risk of dual mutation paths with differing metadata completeness if webhook and admin flow race.

### Partial refund logic
- **Not implemented** in admin flow: refund amount is always full `order.total` in DB update.
- Webhook can receive partial `amount_refunded`, but local state model does not support partial lifecycle state semantics (e.g., partially_refunded vs refunded).

### Dispute handling considerations
- Dispute creation is not persisted to dedicated dispute table.
- No automated order flagging, no workflow routing, no reserve/liability tracking, no evidence submission support flow.

### Reconciliation approach (Stripe vs DB)
- No scheduled reconciliation job found.
- No periodic matching of Stripe charges/refunds/payouts against internal order ledger.
- Admin dashboard is order-table aggregate, not a Stripe reconciliation report.

---

## 3) DATA CONSISTENCY

### Where monetary values are stored
- Monetary fields are on `orders` and `order_items` as `NUMERIC(10,2)` (subtotal, total, fees, tip, refund fields).
- No dedicated immutable financial ledger table for double-entry or event-sourced accounting.

### Currency handling
- Currency is hardcoded as `gbp` at checkout line item creation.
- Formatting and notifications assume GBP text.
- No multi-currency support model; no currency column on orders.

### Precision handling (integer cents vs float)
- Database uses decimal numeric columns.
- Application logic uses JS numbers with rounding helpers and `*100` conversions when calling Stripe.
- This mixed numeric model increases subtle drift risk vs strict integer minor-unit model end-to-end.

### Source of truth for financial records
- Operationally: `orders` table is the primary source of truth.
- Stripe is external settlement source.
- No immutable journal or append-only ledger means records are mutable and can be overwritten.

### Idempotency safeguards
- Strongest safeguard is webhook event ID uniqueness.
- Missing request-idempotency for order-create, checkout-session creation, and refund endpoint.
- No unique constraint preventing multiple successful payment intents per order.

### Race condition risks
- `order-create` performs separate inserts (`orders` then `order_items`) without explicit DB transaction wrapper at application layer.
- Webhook updates order then independently finalizes inventory; second payment events can trigger repeated post-payment actions.
- Refund/update + webhook updates can race with state transitions.

### Double-charge risks
- Multiple checkout session creations for same pending order are possible.
- First successful session marks order paid; subsequent session can still capture funds unless proactively canceled/blocked.
- No order-level payment lock/version check before creating checkout session.

### Double-payout risks
- Destination charge flow transfers funds per successful charge automatically.
- If duplicate charges occur, vendor receives duplicate transfers unless separate remediation/refund logic catches all duplicates.
- Internal model lacks payout-level dedup/reversal controls.

---

## 4) DATABASE ANALYSIS

### Order schema
- Rich order state and payment fields exist (`status`, `payment_status`, IDs, fee columns, paid/cancelled/refunded timestamps).
- Refund columns exist but model conflates full/partial refunds.

### Payment schema
- No standalone payments table.
- Payment identifiers and fee data are embedded directly in `orders`.
- Limits support for retries, multi-attempt histories, chargebacks, and forensic auditability.

### Vendor schema
- `stores` includes `stripe_account_id` and `stripe_onboarding_complete`.
- Good baseline for Connect linkage.

### Payout tracking
- No payout table (e.g., Stripe payout IDs, payout status, payout amounts by vendor).
- No internal representation of payout lifecycle.

### Refund tracking
- Refund fields on `orders` exist, but no many-to-one refund records table.
- Cannot represent multiple partial refunds, adjustments, or refund events over time.

### Financial audit trail presence
- `audit_logs` table exists and key edge functions insert events.
- Not comprehensive for all financial transitions (e.g., webhook dispute path, failed retries, payout events).

### Missing integrity constraints
- No unique partial index enforcing one successful payment per order.
- No strict check constraints tying `status` and `payment_status` invariants.
- No explicit not-null/format constraints on key financial IDs after payment success.

---

## 5) SECURITY MODEL

### Authentication system
- Supabase Auth with bearer-token validation in edge functions.
- `requireUser` fetches profile role before privileged operations.

### Authorization roles
- Role determined from `user_profiles.role`.
- Critical concern: auth signup trigger sources role from user metadata; if unguarded, role escalation to admin/seller can occur.

### Vendor access boundaries
- Vendor order transitions are authorized by store ownership checks in edge function.
- RLS plus service-role usage means function-level checks are critical; some direct table policies were tightened in production migration.

### Admin access boundaries
- Refund endpoint and admin RPC require admin role check.
- If role assignment path is compromised, admin boundary collapses.

### Webhook signature verification
- Stripe webhook signature verification is present.
- Twilio status webhook uses shared token only; no Twilio request signature validation.

### Secret management strategy
- Relies on environment variables for Stripe, Supabase service keys, Twilio, Resend.
- No runtime secret rotation framework surfaced in code.

### Environment configuration safety
- Frontend uses anon keys; service role keys confined to edge functions.
- CORS allowlist present but defaults include localhost and production domain list from env.

---

## 6) FAILURE SCENARIOS

### Stripe webhook fails
- Payment may succeed in Stripe but local order remains pending until webhook retry succeeds.
- No explicit compensating poller/reconciliation job to heal missed events.

### Stripe webhook delayed
- Buyer might see delayed paid state and vendor may not receive order promptly.
- Inventory reservation/commit timing depends on webhook completion.

### Server crash during transaction
- `order-create` can leave orphan pending order if item insert fails after order insert.
- No explicit application-level transaction wrapping across inserts.

### Duplicate webhook delivery
- Event-level dedup table handles exact event re-delivery correctly.
- Does not protect against semantically duplicate but distinct events from multiple successful payment sessions.

### Network timeout during charge
- Checkout handles hosted Stripe flow; network interruptions may create ambiguous buyer state if return URL not reached.
- Recovery depends on webhook and later order polling.

### Partial failure states
- Payment captured but inventory finalization failure triggers automatic refund path; this is strong.
- However, if refund attempt fails after inventory failure, intermediate inconsistent states are possible.

### Lost payout state
- No local payout tracking means payout failures/holds are opaque unless manually checked in Stripe.

### Refund after payout
- Supported operationally by Stripe (negative balances/offsets possible), but no internal liability accounting or reserve strategy.

### Vendor account disabled
- Checkout blocks non-onboarded vendors but does not continuously evaluate later restrictions (e.g., post-onboarding compliance disablement) beyond webhook account.updated toggles.

---

## 7) SCALABILITY

### Concurrency handling
- Inventory finalization uses row-level locking and atomic decrement checks in DB function.
- Good for stock integrity at commit moment.

### High-traffic event handling
- Edge functions are stateless and scale horizontally via Supabase platform.
- No explicit queueing for webhook bursts or notification fan-out.

### Payment surge scenario
- Potential hotspot on `orders` updates and inventory RPC under bursts.
- No evidence of load shedding, queue-based smoothing, or backpressure controls.

### Webhook burst handling
- Idempotency table helps duplicates.
- No dead-letter queue, retry orchestration, or observability SLO tooling in-repo.

### DB bottlenecks
- Core indexes exist for order lookups and webhook IDs.
- No partitioning, archiving, or historical table strategy for very high order volumes.

---

## 8) TECHNICAL DEBT / RISK EXPOSURE

### Architectural tradeoffs
- Fast implementation uses mutable order row as the single financial record instead of immutable ledger + payment attempts tables.
- Business logic concentrated in edge functions, but transactionality is uneven across multi-step operations.

### Areas of fragility
- Role bootstrap path and metadata-derived privileges.
- Multi-session checkout race leading to duplicate payment risk.
- Missing payout/dispute/reconciliation subsystems for production finance controls.

### Risk exposure summary
- The codebase demonstrates meaningful progress toward production readiness (signature verification, webhook idempotency table, inventory commit/refund compensation path, audit logs), but still has **material financial-control gaps** that are incompatible with low-risk launch for a real-money marketplace with platform liability.
