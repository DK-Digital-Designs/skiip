# FINANCIAL AND ENGINEERING RISK REPORT

This report classifies production risks by severity and focuses on concrete loss/legal exposure scenarios.

---

## 🔴 CRITICAL RISKS

### C1) Potential privilege escalation to admin/seller via signup metadata
- **Why dangerous:** Role assignment appears to trust `raw_user_meta_data->>'role'` during profile creation.
- **Trigger scenario:** Attacker signs up and sets metadata role to `admin` (or `seller`).
- **Production impact:** Unauthorized refunds, access to full order data, financial tampering, legal/data breach exposure.

### C2) Duplicate charge risk from multiple checkout sessions per order
- **Why dangerous:** Same pending order can generate multiple Stripe Checkout Sessions without order-level lock/idempotency key.
- **Trigger scenario:** User double-clicks checkout, retries on slow network, or malicious repeats.
- **Production impact:** Customer charged multiple times; duplicate destination transfers to vendor; refunds/manual remediation overhead; trust erosion.

### C3) Webhook idempotency is event-level only (not order-payment semantic)
- **Why dangerous:** Distinct Stripe events for separate successful sessions are all processed once each.
- **Trigger scenario:** Two successful sessions for one order produce two unique `checkout.session.completed` events.
- **Production impact:** Multiple financial side effects (extra inventory decrements, repeated notifications, contradictory ledger state, duplicate money movement).

### C4) No authoritative payout tracking/reconciliation subsystem
- **Why dangerous:** Marketplace liability requires proving exactly what was paid in/out and when.
- **Trigger scenario:** Stripe payout delay/failure/reversal, account reserve adjustments, manual dashboard actions.
- **Production impact:** Inability to verify vendor settlements, unresolved disputes, accounting inaccuracies, regulatory/audit failures.

### C5) Mutable order row used as de facto financial ledger
- **Why dangerous:** Single mutable record cannot preserve forensic trail of payment attempts, partial refunds, disputes, or compensations.
- **Trigger scenario:** Repeated updates by webhook/admin flow overwrite prior values.
- **Production impact:** Financial history ambiguity, weak defensibility in chargeback/legal disputes.

### C6) Partial refunds are not modeled safely
- **Why dangerous:** Refund API path assumes one full refund and sets status to refunded; no robust partial refund lifecycle.
- **Trigger scenario:** Support needs partial refund (item out of stock, service credit).
- **Production impact:** Incorrect state reporting, reconciliation mismatches, customer/vendor financial inaccuracies.

### C7) Refund + webhook dual-writer race conditions
- **Why dangerous:** Both admin refund endpoint and `charge.refunded` webhook update same order fields independently.
- **Trigger scenario:** Manual refund initiated while webhook arrives with different amount/metadata timing.
- **Production impact:** Conflicting final values, lost reason codes, incorrect refund amount recorded.

### C8) Dispute lifecycle is not operationalized
- **Why dangerous:** `charge.dispute.created` is log-only, no persistent workflow.
- **Trigger scenario:** Cardholder dispute filed.
- **Production impact:** Missed evidence deadlines, automatic dispute losses, direct financial loss and elevated fraud metrics.

---

## 🟠 IMPORTANT RISKS

### I1) No idempotency keys on outbound Stripe write operations
- **Why dangerous:** Network retries can create duplicate side effects.
- **Trigger scenario:** Timeout after Stripe receives request but before response to edge function.
- **Production impact:** Duplicate account/session/refund operations requiring manual cleanup.

### I2) Non-atomic multi-step order creation
- **Why dangerous:** Order insert and order-items insert are separate operations.
- **Trigger scenario:** Failure between the two writes.
- **Production impact:** Orphan orders, invalid totals, operational confusion and refund support overhead.

### I3) Numeric/float handling mixed with decimal storage
- **Why dangerous:** JS floating-point arithmetic can drift versus exact cent accounting.
- **Trigger scenario:** Edge rounding under high volume and odd price/tip combinations.
- **Production impact:** penny-level discrepancies, reconciliation noise, customer trust issues at scale.

### I4) No order-payment invariant constraints at DB level
- **Why dangerous:** Application bugs can push impossible combinations (`status=paid`, `payment_status=pending`, etc.).
- **Trigger scenario:** Error path or partial write.
- **Production impact:** inconsistent lifecycle logic and broken downstream workflows.

### I5) Currency is hardcoded and not persisted as first-class field
- **Why dangerous:** Financial systems should persist transaction currency on each order/payment.
- **Trigger scenario:** expansion to multi-region or mixed-currency vendors.
- **Production impact:** reporting inaccuracies and accounting confusion.

### I6) Trust boundary relies heavily on edge function correctness over immutable DB safeguards
- **Why dangerous:** service-role writes bypass RLS; any bug in edge logic can write broad data.
- **Trigger scenario:** malformed input or unhandled branch in edge code.
- **Production impact:** unauthorized state changes or incorrect financial mutation.

### I7) Twilio webhook lacks provider signature verification
- **Why dangerous:** token-only gate is weaker than signed request verification.
- **Trigger scenario:** leaked token or forged callback.
- **Production impact:** falsified notification delivery records and incident response confusion.

### I8) Missing explicit rate limiting on payment/refund endpoints
- **Why dangerous:** abuse can cause operational load and risk.
- **Trigger scenario:** scripted retries or credential abuse.
- **Production impact:** increased Stripe costs, noisy incident surface, potential denial-of-service patterns.

### I9) No automated reconciliation job (Stripe vs DB)
- **Why dangerous:** webhook-only architectures eventually drift.
- **Trigger scenario:** missed webhook, transient outage, manual Stripe dashboard actions.
- **Production impact:** silent financial mismatch persists until customer/vendor complaint.

### I10) No payout verification system
- **Why dangerous:** destination charge does not remove need to verify payout outcomes.
- **Trigger scenario:** reserve holds, payout failures, account compliance freeze.
- **Production impact:** vendors unpaid while platform assumes settlement complete.

### I11) Incomplete audit coverage
- **Why dangerous:** Some key events are logged, but not all financial transitions and failure paths.
- **Trigger scenario:** support-led interventions or dispute events.
- **Production impact:** weak incident forensics and compliance posture.

### I12) Potential over-exposure in legacy/adjacent RLS patterns
- **Why dangerous:** historical policies include broad guest/session-based access behaviors.
- **Trigger scenario:** environment drift where old policies/functions persist.
- **Production impact:** data leakage of orders/carts/profile fields.

---

## 🟢 NICE-TO-HAVE RISKS

### N1) Limited financial observability dashboards
- **Why dangerous:** slower detection of anomalies.
- **Trigger scenario:** gradual drift in fees/refunds.
- **Production impact:** delayed reaction, larger cleanup windows.

### N2) No built-in anomaly detection rules
- **Why dangerous:** manual oversight misses patterns.
- **Trigger scenario:** burst of refunds/disputes/duplicate payment intents.
- **Production impact:** increased loss before alert.

### N3) Limited stress/failure-mode test suite for payments
- **Why dangerous:** unknown behavior under realistic failure conditions.
- **Trigger scenario:** production incident conditions not represented in tests.
- **Production impact:** longer outages and unpredictable remediation.

---

## FINANCIAL RISK COVERAGE (Requested Topics)

### Double charges
- Possible through repeated checkout session creation for same order and absent request idempotency.

### Double payouts
- Possible as a downstream effect of duplicate successful charges in destination-charge flow.

### Missing idempotency
- Present in webhook event table only; absent on multiple critical outbound Stripe operations and order-level locks.

### Inconsistent order states
- Multi-writer paths and missing invariant constraints can create lifecycle inconsistencies.

### Currency rounding issues
- JS floats + decimal DB + Stripe cents conversions can produce edge-case drift.

### Trusting client-calculated totals
- Improved: backend recomputation exists in `order-create` and subtotal check in `stripe-checkout`.
- Residual risk: trust still depends on edge function logic and consistency of product snapshots over time.

### Missing server-side recalculation
- Mitigated for initial order and checkout consistency checks.
- Not fully extended to all mutation paths (refund/dispute reconciliation semantics).

### Webhook replay risks
- Duplicate same-event replay mitigated by unique `stripe_event_id`.
- Distinct-event semantic replay (multi-session same order) remains.

### Missing audit logs
- Baseline audit logs exist but are not comprehensive enough for full financial governance.

### Incomplete refund tracking
- Single-row refund fields cannot represent complete refund history and partial sequences.

### Payout before refund window
- No platform-enforced reserve/window logic in code.

### Platform fee miscalculation
- Hardcoded percent and mixed arithmetic can drift; lacks policy/versioning per merchant.

### Tip leakage
- Fee excludes tip (intentional), but no dedicated reconciliation proving tips always passed through.

---

## SECURITY RISK COVERAGE (Requested Topics)

### Missing webhook signature verification
- Stripe: implemented.
- Twilio status webhook: not cryptographically verified via provider signature.

### Exposed secret keys
- No direct evidence of committed live secrets in scanned files.
- Security relies on environment discipline and deployment controls.

### Weak role validation
- Role bootstrap path is high risk if metadata is user-controlled.

### Insecure vendor data exposure
- Current flow mostly scoped by ownership checks + RLS; historical policy debt increases migration drift risk.

### Improper JWT/session handling
- Standard Supabase auth used; key risk is role trust and authorization branching, not token parsing.

### Missing rate limiting
- No explicit endpoint-level rate limiting logic observed in edge functions.

### Missing input validation
- Basic validation exists; deeper schema validation and bounds enforcement are limited.

---

## ENGINEERING RISK COVERAGE (Requested Topics)

### Lack of transaction boundaries
- Present in order creation multi-write path.

### No DB-level constraints
- Important invariants absent (one successful payment intent per order, strict status/payment consistency).

### Missing indexes
- Core indexes exist; financial event/journal indexing model is still incomplete because ledger tables are absent.

### Non-atomic operations
- Multiple payment and order state updates occur as separate statements.

### Silent failure paths
- Notification failures are logged but do not always trigger operational escalation.

### Poor error handling
- Errors are returned and logged; however, compensating actions are partial across paths.

### Missing retries for webhooks
- Stripe handles redelivery; internal reprocessing/repair pipeline for failed events is absent.

### No reconciliation job
- Confirmed absent.

### No financial audit trail
- Partial trail exists; not sufficient for full forensic accounting.

---

## OPERATIONAL RISK COVERAGE (Requested Topics)

### No monitoring / alerting
- No in-repo alert policy definitions for payment failures, webhook failure rates, or anomaly thresholds.

### No payout anomaly detection
- No payout records or anomaly jobs.

### No dispute handling workflow
- Confirmed (log-only event handling).

### No backup strategy documentation
- Not found in repo artifacts reviewed.

---

## TESTING RISK COVERAGE (Requested Topics)

### No Stripe webhook simulation tests
- No automated tests found for webhook signature validation and event path correctness.

### No failure-mode tests
- No tests for network timeout, duplicate checkout attempts, inventory-finalization rollback edge cases.

### No idempotency tests
- No tests proving one-and-only-once semantics at order/payment level.

### No refund flow tests
- No automated tests for full/partial refund behavior and reconciliation.

### No payout reconciliation tests
- Not possible currently due absent reconciliation subsystem.

---

## Overall Risk Posture
Current implementation is **not yet financially hardened** for high-assurance production where platform money-flow liability is catastrophic. The largest blockers are role-security trust, duplicate charge prevention, absence of reconciliation/payout subsystems, and incomplete dispute/refund accounting depth.
