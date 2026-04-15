# CODEBASE FINANCIAL ARCHITECTURE ANALYSIS

## Scope and Method
This document is a full repository-level financial architecture audit of the SKIIP codebase, focused on payment correctness, Stripe Connect behavior, order integrity, and production risk surfaces. The analysis is based on schema/migration SQL, edge functions, frontend payment flows, service calls, and operational docs.

---

## SYSTEM OVERVIEW

### High-Level Architecture
- **Frontend**: React + Vite SPA with role-specific experiences (attendee, vendor, admin).
- **Backend/API**: Supabase PostgREST + Supabase Edge Functions for financial workflows.
- **Database**: Postgres (Supabase) with RLS and SQL migrations as primary state authority.
- **Payments**: Stripe Checkout + Stripe Connect (Express accounts, destination charges).
- **Notifications**: Twilio WhatsApp + Resend email via shared notification dispatcher.

### Marketplace Structure (Customer ↔ Platform ↔ Vendor)
- **Customer** places order in attendee frontend.
- **Platform** creates pending order in DB, initializes Stripe Checkout, receives webhooks, controls state transitions, executes refunds.
- **Vendor** owns a `store`, onboarded to Stripe Connect; receives transfer destination on charge capture.
- **Platform fee** is collected as application fee on destination charge and persisted to `orders.platform_fee`.
- **Vendor net** is computed at webhook time and persisted to `orders.vendor_net`.

### Request Lifecycle (Frontend → Backend → Stripe → DB)
1. Attendee selects products (client cart).
2. Frontend calls `order-create` edge function with product IDs + quantities + tip.
3. `order-create` re-fetches products server-side, computes authoritative totals, inserts `orders` and `order_items`.
4. Frontend calls `stripe-checkout` edge function with `order_id`.
5. `stripe-checkout` verifies ownership/state/store readiness, re-validates totals against order items, creates Stripe Checkout Session with destination transfer and application fee.
6. Stripe redirects customer for payment.
7. Stripe sends `checkout.session.completed` webhook to `stripe-webhook`.
8. Webhook verifies signature, inserts event idempotency row, updates payment/order ledger fields, attempts inventory finalization.
9. If inventory finalization fails, webhook attempts auto-refund and marks order refunded.
10. Notifications and audit log entries are written for paid/refunded events.

### Order Lifecycle (Created → Paid → Fulfilled → Refunded → Disputed)
- **Created**: `order-create` inserts `status='pending'`, `payment_status='pending'`.
- **Paid**: Stripe webhook sets `status='paid'`, `payment_status='succeeded'`, fee/net fields, `paid_at`.
- **Fulfilled**: Vendor/admin moves paid order via `order-transition`: `paid -> preparing -> ready -> collected`.
- **Cancelled**: Allowed from `paid/preparing/ready`, with optional inventory restock if committed.
- **Refunded**:
  - Manual admin flow through `stripe-refund` (full refund only).
  - Automatic webhook flow on paid inventory finalization failure.
  - External Stripe-originating refund event (`charge.refunded`) also updates order.
- **Disputed**: only log warning on `charge.dispute.created`; no persisted dispute model or workflow.

---

## STRIPE INTEGRATION ANALYSIS

### Charge Model Used
- Implementation uses **Stripe Checkout Sessions** with `payment_intent_data.transfer_data.destination` and `application_fee_amount`.
- This is **Connect destination charge** pattern.
- Merchant flow is platform-collected charge with automatic transfer to connected account.

### Webhook Handling Logic
- Webhook endpoint:
  - Requires `stripe-signature` header.
  - Verifies signature with `STRIPE_WEBHOOK_SECRET` using Stripe SDK.
- Handles event types:
  - `checkout.session.completed`
  - `account.updated`
  - `charge.refunded`
  - `charge.dispute.created` (logging only)
- Payment completion path enriches order ledger with payment intent, charge ID, fee breakdown.

### Idempotency Handling
- Webhook-level idempotency via `stripe_processed_events` table with unique `stripe_event_id`.
- Duplicate delivery returns success and short-circuits.
- **Gap**: idempotency covers event replay, not all side effects transactionally (e.g., external Stripe refund call occurs outside DB transaction).
- **Gap**: checkout session creation has no explicit Stripe idempotency key; repeated client retries can generate multiple sessions.

### PaymentIntent Lifecycle Management
- PaymentIntent is created indirectly by Checkout Session.
- Webhook reads `session.payment_intent`, retrieves expanded latest charge and balance transaction.
- Order stores `payment_intent_id`, `charge_id`, `platform_fee`, `stripe_fee`, `vendor_net`, `paid_at`.
- No explicit handling for `payment_intent.payment_failed`, `checkout.session.expired`, async payment states.

### Connect Account Onboarding Flow
- Vendor/admin calls `stripe-onboarding-link` with `store_id`.
- If `stripe_account_id` absent, function creates Express account (`country: GB`, `business_type: individual`), stores account ID.
- Returns Stripe Account Link for onboarding.
- Webhook `account.updated` marks `stripe_onboarding_complete=true` when `charges_enabled && details_submitted`.
- **Gap**: no deactivation path when account later becomes restricted/disabled.

### Payout Timing Logic
- No custom payout scheduler in codebase.
- Timing appears fully delegated to Stripe Connect account payout schedule.
- No local table tracking Stripe transfers, payout status, failed payouts, or payout reconciliation windows.

### Platform Fee Logic
- Platform fee is fixed constant `PLATFORM_FEE_PERCENT = 0.10` in checkout function.
- Fee calculated on **subtotal only** (`storedSubtotal * 10%`), not on tip.
- Saved as `orders.platform_fee` both at checkout pre-commit and webhook finalization.
- **Risk**: hard-coded fee in code, no versioned fee schedule per vendor/event/order.

### Tip Passthrough Logic
- Tip supplied in order-create input, server clamps to `>=0` and rounds to 2 decimals.
- Checkout adds tip as separate line item.
- Application fee excludes tip (since fee uses subtotal); tip effectively passed through to vendor transfer destination.
- **Risk**: policy exists in code but not strongly documented/guarded with DB constraints or compliance tests.

### Refund Processing Flow
- Admin refunds via `stripe-refund` function (requires admin role).
- Refund created using payment_intent (preferred) or charge.
- Order marked refunded and audit log created; notifications sent.
- Inventory restocked if previously committed and not yet restocked.
- Stripe webhook also updates refunded state on `charge.refunded`.

### Partial Refund Logic
- No first-class partial refund capability exposed by API.
- `stripe-refund` always refunds full `order.total` (no amount parameter).
- `charge.refunded` webhook sets refund amount from Stripe payload; can reflect partial refunds initiated externally, but local behavior does not reconcile partial-vs-full lifecycle or status model.

### Dispute Handling Considerations
- Current behavior for `charge.dispute.created`: log warning only.
- No DB persistence, no order flagging, no admin queueing, no evidence packaging workflow, no liability reserve logic.

### Reconciliation Approach (Stripe vs Database)
- Present approach is **event-driven updates**, not formal reconciliation.
- No scheduled job comparing Stripe balance transactions/charges/refunds/transfers against DB orders.
- `audit_logs` and `stripe_processed_events` support forensic analysis but do not enforce financial reconciliation completeness.

---

## DATA CONSISTENCY

### Where Monetary Values Are Stored
- `orders`: `subtotal`, `tax`, `shipping`, `total`, `tip_amount`, `platform_fee`, `stripe_fee`, `vendor_net`, `refund_amount`.
- `order_items`: `price`, `total`.
- All are `NUMERIC(10,2)` (major units, decimal pounds).

### Currency Handling
- Stripe line items and Checkout are hard-coded to `gbp`.
- Notification templates and UI also hard-code GBP formatting.
- No per-order/per-store currency column.

### Precision Handling
- Code uses floating-point JS arithmetic + custom round function; DB stores 2-decimal numeric.
- Stripe conversion uses `Math.round(value*100)` for minor units.
- **Risk**: float conversion drift is partially guarded, but not fully eliminated vs integer-minor-unit design.

### Source of Truth for Financial Records
- Intended source of truth is DB order + order_item rows, with Stripe as external settlement authority.
- `order-create` is server-authoritative for price recalculation.
- `stripe-checkout` re-validates subtotal/total from DB before creating session.
- **Risk**: no immutable ledger table; mutable order row acts as both operational and accounting record.

### Idempotency Safeguards
- Webhook replay guarded by unique processed event table.
- Order status update to paid includes `.neq('payment_status', 'succeeded')` preventing duplicate paid transitions.
- **Gap**: no idempotency key for order creation API request retries.
- **Gap**: no idempotency key for refund API request retries.

### Race Condition Risks
- Inventory is checked at order creation but only committed at payment webhook.
- Between order creation and payment completion, inventory can be oversubscribed.
- `finalize_paid_order_inventory` uses row locking and fails atomically if insufficient stock, then auto-refund path compensates.
- **Residual risk**: customer pays then instant refund due to stock race; high-frequency contention may generate elevated refund churn.

### Double-Charge Risks
- Multiple checkout sessions may be created for same pending order if user retries.
- If multiple sessions complete, webhook updates order once (paid already) but additional charges may still succeed at Stripe side unless prevented by session/payment strategy.
- No explicit cancellation/expiration of prior sessions when new one created.

### Double-Payout Risks
- Destination charge payout behavior is Stripe-managed per charge.
- Duplicate successful charges for same order would each create corresponding transfer flows to vendor.
- Local DB may only reflect first successful payment path cleanly, creating reconciliation mismatch and potential financial loss.

---

## DATABASE

### Order Schema
- `orders` captures lifecycle statuses, payment status, financial fields, checkout/payment IDs, timestamps for paid/cancelled/refunded/inventory events.
- Has indexes on user/store/status/created_at and payment identifiers via migration.

### Payment Schema
- Payment data is denormalized directly in `orders` rather than separate `payments` table.
- `stripe_processed_events` tracks webhook idempotency only.
- No table for payment attempts, session retries, transfer records, payout records, disputes.

### Vendor Schema
- `stores` includes `stripe_account_id`, `stripe_onboarding_complete`.
- No explicit constraint tying `stripe_account_id` uniqueness to store (index exists, not declared unique).

### Payout Tracking
- No payout tracking table.
- No linkage to Stripe transfers/payout events.
- No payout status lifecycle in DB.

### Refund Tracking
- Single set of refund fields in `orders` (`refund_id`, `refund_amount`, `refund_reason`, `refunded_at`).
- Supports one primary refund narrative but not multiple partial refunds/refund attempts.

### Financial Audit Trail Presence
- `audit_logs` table records key operational events (`order_created`, `payment_captured`, `order_status_changed`, `order_refunded`, store status changes).
- Useful for event history but not an append-only double-entry ledger.

### Missing Integrity Constraints
- No DB constraint enforcing `total = subtotal + tip + tax + shipping`.
- No DB constraint enforcing nonnegative `vendor_net/platform_fee/stripe_fee/refund_amount` relationships.
- No unique constraint preventing multiple active checkout sessions per order.
- No enum type enforcement at schema type level (text + check used).
- Legacy schema files in repo create ambiguity over actual production schema source.

---

## SECURITY MODEL

### Authentication System
- Supabase Auth JWT bearer token required for non-webhook critical edge functions via `requireUser`.
- Role derived from `user_profiles.role`.

### Authorization Roles
- Roles: buyer, seller, admin.
- Admin gates enforced in refund function and dashboard metrics RPC.
- Seller ownership checks performed in order transition and store-specific operations.

### Vendor Access Boundaries
- Vendor order updates routed through server function with ownership check against store user_id.
- RLS also governs direct table reads/writes.

### Admin Access Boundaries
- `is_admin()` function with SECURITY DEFINER used in RLS and admin RPC.
- Admin reads all orders/products/stores/profiles via dedicated policies.

### Webhook Signature Verification
- Stripe webhook signature verification implemented and required.
- Twilio status webhook uses shared token (header or query token) if configured; no Twilio signature validation.

### Secret Management Strategy
- Edge functions read secrets from environment variables.
- No hardcoded Stripe secret values in source.
- Documentation references required secrets but does not evidence runtime secret rotation policy.

### Environment Configuration Safety
- CORS helper restricts to allowed origins set; default includes production + localhost.
- Some webhook endpoints still use permissive `Access-Control-Allow-Origin: *` (whatsapp-status-webhook).
- No centralized runtime startup check that all production-critical env vars are present for every service.

---

## FAILURE SCENARIOS

### Stripe Webhook Fails
- Current behavior returns 400; Stripe retries.
- If repeated failures, orders remain pending though payment might be captured; requires manual reconciliation.

### Stripe Webhook Delayed
- Vendor sees pending payment until webhook arrives.
- Inventory commit and operational flow deferred; may affect fulfillment SLAs.

### Server Crash During Transaction
- Edge functions execute multi-step operations without DB transaction across all steps.
- Example: payment updated before downstream side effects; partial updates possible.

### Duplicate Webhook Delivery
- Handled via unique `stripe_processed_events` insert guard.
- Side effects for exact same event generally suppressed.

### Network Timeout During Charge
- Customer may retry checkout, creating additional sessions.
- Without checkout idempotency key/session-locking, ambiguous charge outcomes are possible.

### Partial Failure States
- In webhook paid flow, if inventory finalization fails, refund attempted; if refund call fails after payment capture, order can remain paid with inventory unresolved.
- Notification failures are logged but do not block financial state transitions.

### Lost Payout State
- No payout tables/jobs means platform cannot assert transfer/payout completion from internal data.

### Refund After Payout
- No explicit policy timing checks; admin can refund succeeded order regardless of payout stage.
- Could generate platform negative balance exposure depending on Stripe account funds and timing.

### Vendor Account Disabled
- Onboarding complete flag only set true on positive update; no negative sync path to false when account loses capability.
- Risk of checkout targeting restricted account until Stripe charge-time failure occurs.

---

## SCALABILITY

### Concurrency Handling
- Inventory finalization uses row locks and guarded updates in SQL RPC for paid orders.
- Good correctness primitive for stock commit under concurrency.

### High-Traffic Event Handling
- Webhook path is synchronous and does external calls (Stripe retrieve/refund, notifications). Burst events may increase latency/timeouts.
- No queue/deferred worker architecture for heavy webhook fanout.

### Payment Surge Scenario
- Order creation + checkout are stateless edge functions; horizontally scalable in principle.
- DB hot spots: orders insert/update, order_items insert, inventory row locking, audit logs writes.

### Webhook Burst Handling
- Idempotency table insert per event scales reasonably with indexing.
- No explicit throttling/backpressure controls; potential contention on single order records and product rows during peaks.

### DB Bottlenecks
- Core indexes exist for primary read paths.
- No partitioning/archive strategy for orders/audit_logs/notification_logs.
- No dedicated read model for analytics beyond runtime aggregation RPC.

---

## TECHNICAL DEBT

### Architectural Tradeoffs
- Favoring single `orders` row as operational + financial aggregate simplifies MVP but weakens accounting rigor.
- Event-driven webhook updates are pragmatic but absence of reconciliation job leaves blind spots.
- Destination charges with simple fixed fee reduce complexity but hardcode business policy.

### Areas of Fragility
- Multiple canonical schema files (`schema.sql`, `skiip-schema.sql`, migrations) increase deployment drift risk.
- Float-to-minor-unit conversions in JS across request path.
- No dispute domain model despite live-money Connect platform.
- No persistent payout state or Stripe transfer ledger.
- Missing robust idempotency for non-webhook endpoints.

### Risk Exposure Summary
- Greatest risk areas are duplicate payment session handling, incomplete reconciliation/payout observability, partial refund/dispute lifecycle incompleteness, and mutable-order-as-ledger design.
- Platform currently has meaningful safeguards (server-side pricing, webhook signature checks, event idempotency, inventory lock on commit) but remains below strict financial-grade marketplace control standards required for low-liability operation.
