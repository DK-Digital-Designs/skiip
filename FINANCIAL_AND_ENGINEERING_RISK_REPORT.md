# FINANCIAL AND ENGINEERING RISK REPORT

## Severity Model
- 🔴 **CRITICAL**: Could cause monetary loss, legal/regulatory exposure, or corruption of financial truth.
- 🟠 **IMPORTANT**: Could produce instability, inconsistency, or incident amplification.
- 🟢 **NICE-TO-HAVE**: Improves resilience/operability but not immediate catastrophic risk.

---

## FINANCIAL RISKS

### 🔴 CRITICAL: Multiple Checkout Sessions Can Be Created for One Pending Order
- **Why dangerous**: Same order can potentially be paid more than once if customer retries checkout and completes a later/duplicate session.
- **Trigger scenario**: Browser retries, user double-clicks pay flow, network timeout after session creation.
- **Production impact**: Duplicate charges, duplicate Connect transfers, customer chargebacks, platform-funded refunds, reconciliation mismatch.

### 🔴 CRITICAL: No Explicit Idempotency Keys on Checkout and Refund API Calls
- **Why dangerous**: Retried API requests can execute side effects repeatedly.
- **Trigger scenario**: client retries due to 5xx/timeout; load balancer retries; user rapid-clicks admin refund.
- **Production impact**: duplicate Stripe objects (sessions/refunds attempts), inconsistent DB state vs Stripe truth, incident triage complexity.

### 🔴 CRITICAL: No Formal Stripe↔Database Reconciliation Job
- **Why dangerous**: Event-driven systems can miss events or enter partial states; without reconciliation, silent financial drift accumulates.
- **Trigger scenario**: webhook outage, temporary Stripe API failure mid-handler, manual Stripe dashboard actions.
- **Production impact**: undetected captured-but-unfulfilled orders, unrecorded refunds, payout discrepancies, accounting and audit failure.

### 🔴 CRITICAL: Payout Lifecycle Not Tracked in Platform DB
- **Why dangerous**: Platform cannot prove when/if vendors were paid, or correlate payouts to order liabilities.
- **Trigger scenario**: payout failure, delayed payout, negative balance offset due to refund/dispute.
- **Production impact**: vendor disputes, inability to defend legal claims, cash forecasting errors.

### 🔴 CRITICAL: Refund Model Is Single-Record and Not Multi-Refund Safe
- **Why dangerous**: Partial/multi-step refunds are not represented as immutable events; one order row field can overwrite reality.
- **Trigger scenario**: partial refunds from Stripe dashboard or repeated refund operations.
- **Production impact**: incorrect refund totals, customer support disputes, audit evidence gaps.

### 🔴 CRITICAL: Dispute Handling Is Logging-Only
- **Why dangerous**: Charge disputes are liability-bearing events requiring workflow and evidence retention.
- **Trigger scenario**: `charge.dispute.created` webhook event.
- **Production impact**: missed response deadlines, automatic dispute losses, fee accumulation, potential account restrictions.

### 🔴 CRITICAL: Monetary Values Stored in Decimal Pounds + Float Arithmetic in App Tier
- **Why dangerous**: Float/rounding drift can create off-by-cent inconsistencies at scale.
- **Trigger scenario**: many line items, repeated transforms between decimal and minor units.
- **Production impact**: reconciliation deltas, under/over charging, trust erosion.

### 🔴 CRITICAL: Refund After Vendor Transfer/Payout Exposure Not Guarded
- **Why dangerous**: Platform may owe refunds after funds transferred out; no reserve/eligibility policy enforcement present.
- **Trigger scenario**: late cancellation/refund request, fraud, post-payout disputes.
- **Production impact**: platform balance deficits, negative cash flow, liability concentration.

### 🟠 IMPORTANT: Tip Passthrough Relies on Code Convention, Not Explicit Accounting Constraints
- **Why dangerous**: accidental future fee changes could include tips without detection.
- **Trigger scenario**: fee logic edits, new pricing mode.
- **Production impact**: tip leakage, wage/tip compliance issues, vendor legal complaints.

### 🟠 IMPORTANT: No Server-Enforced Invariant Constraint for `total` Composition
- **Why dangerous**: order totals can diverge from component amounts by bad writes/migrations/manual ops.
- **Trigger scenario**: direct DB updates, buggy future code path.
- **Production impact**: inconsistent receipts, tax/reporting inaccuracies.

### 🟢 NICE-TO-HAVE: Platform Fee Is Hard-Coded, Not Versioned
- **Why dangerous**: operationally brittle for contract differences across vendors/events/time.
- **Trigger scenario**: fee policy updates.
- **Production impact**: incorrect billing in edge cases, manual corrections.

---

## SECURITY RISKS

### 🔴 CRITICAL: Twilio Status Webhook Uses Token Check Instead of Provider Signature Validation
- **Why dangerous**: bearer/query token can leak; lacks cryptographic origin proof from Twilio.
- **Trigger scenario**: leaked token in logs/browser history/query strings.
- **Production impact**: forged delivery statuses, corrupted notification evidence trails.

### 🔴 CRITICAL: Legacy/Parallel Schema Files Can Reintroduce Weak RLS in Wrong Deployment Flow
- **Why dangerous**: operators may apply outdated schema scripts with permissive policies.
- **Trigger scenario**: manual reset using `schema.sql`/`skiip-schema.sql` instead of migrations.
- **Production impact**: unauthorized order visibility/modification; potential data breach.

### 🟠 IMPORTANT: Some Endpoints Retain Permissive CORS (`*`) Patterns
- **Why dangerous**: expands attack surface and misuse potential for public endpoints.
- **Trigger scenario**: malicious origin posting crafted requests.
- **Production impact**: abuse/noise injection, monitoring pollution.

### 🟠 IMPORTANT: Role Validation Depends on Profile Read Path Availability
- **Why dangerous**: auth enforcement path may fail closed but operational complexity increases under profile inconsistencies.
- **Trigger scenario**: profile row missing/corrupt during auth.
- **Production impact**: blocked critical operations, emergency bypass temptations.

### 🟠 IMPORTANT: No Evident Global Rate Limiting on Financial Edge Functions
- **Why dangerous**: brute-force or accidental burst traffic can stress Stripe/API and create retry storms.
- **Trigger scenario**: scripted abuse, bot traffic, client bug loops.
- **Production impact**: cost spikes, degraded service, throttling-induced failures.

### 🟢 NICE-TO-HAVE: No Explicit Environment Variable Schema Validation Layer
- **Why dangerous**: misconfiguration discovered only at runtime path execution.
- **Trigger scenario**: deployment missing optional/required env var.
- **Production impact**: intermittent feature outages.

---

## ENGINEERING RISKS

### 🔴 CRITICAL: Cross-System Operations Are Not Fully Atomic
- **Why dangerous**: DB updates and Stripe calls happen in sequence without distributed transaction guarantees.
- **Trigger scenario**: function crash between payment state update and compensating refund/update.
- **Production impact**: orphan states (charged but not fulfilled/refunded), manual incident load.

### 🔴 CRITICAL: Missing Dedicated Financial Ledger/Event Sourcing Layer
- **Why dangerous**: mutable order row can be overwritten, reducing forensic fidelity.
- **Trigger scenario**: repeated updates, operational backfills, partial refunds/disputes.
- **Production impact**: inability to reconstruct financial truth with confidence.

### 🟠 IMPORTANT: No DB Constraints for Critical Financial Invariants
- **Why dangerous**: app bugs can write invalid monetary combinations.
- **Trigger scenario**: edge function change or manual SQL intervention.
- **Production impact**: silent corruption.

### 🟠 IMPORTANT: Missing Index/Structure for High-Volume Reconciliation Queries
- **Why dangerous**: as volume grows, manual reconciliation and incident queries become slow/unreliable.
- **Trigger scenario**: peak event day + incident investigation.
- **Production impact**: delayed financial response and SLA breaches.

### 🟠 IMPORTANT: Silent/Best-Effort Notification Failure Handling
- **Why dangerous**: customer communication reliability decoupled from financial truth is good, but unresolved failures need operational closure.
- **Trigger scenario**: provider outage.
- **Production impact**: support burden, customer trust damage.

### 🟢 NICE-TO-HAVE: Hard-Coded Country/Currency in Connect Account Creation
- **Why dangerous**: future expansion complexity.
- **Trigger scenario**: multi-region onboarding.
- **Production impact**: onboarding errors and policy mismatch.

---

## OPERATIONAL RISKS

### 🔴 CRITICAL: No Automated Financial Anomaly Detection
- **Why dangerous**: duplicate charge spikes/refund spikes can go unnoticed until damage grows.
- **Trigger scenario**: bad deploy, webhook outage, fraud patterns.
- **Production impact**: prolonged money leakage.

### 🔴 CRITICAL: No Payout Verification System
- **Why dangerous**: platform cannot assert vendor settlement correctness.
- **Trigger scenario**: payout failures/holds.
- **Production impact**: vendor payment disputes and legal exposure.

### 🟠 IMPORTANT: Monitoring Strategy Is Mentioned but Not Codified as SLO/Alert Rules in Repo
- **Why dangerous**: operational readiness depends on external/manual setup not verifiable in codebase.
- **Trigger scenario**: incident at off-hours.
- **Production impact**: delayed detection and response.

### 🟠 IMPORTANT: No Documented Backup/Restore Drill Evidence
- **Why dangerous**: financial systems need tested recovery, not assumed recovery.
- **Trigger scenario**: data corruption or accidental deletion.
- **Production impact**: prolonged outage, audit/regulatory complications.

### 🟢 NICE-TO-HAVE: Runbooks Exist but Limited Depth on Disputes and Reconciliation Escalation
- **Why dangerous**: incident handling can become ad hoc.
- **Trigger scenario**: complex multi-party dispute.
- **Production impact**: inconsistent operational decisions.

---

## TESTING RISKS

### 🔴 CRITICAL: No Stripe Webhook Simulation Test Suite
- **Why dangerous**: core money-state transitions are untested under event variants.
- **Trigger scenario**: schema or function change.
- **Production impact**: regressions in paid/refunded/dispute handling.

### 🔴 CRITICAL: No Idempotency/Replay Tests for Payment Webhooks
- **Why dangerous**: replay behavior is central to correctness under Stripe retry model.
- **Trigger scenario**: duplicate event delivery.
- **Production impact**: duplicate side effects or hidden failures.

### 🔴 CRITICAL: No Failure-Mode Tests (Stripe timeout, DB failure mid-webhook, inventory race)
- **Why dangerous**: compensating logic unverified where risk is highest.
- **Trigger scenario**: real infra instability.
- **Production impact**: financially inconsistent states.

### 🟠 IMPORTANT: No End-to-End Refund Matrix Tests (full/partial/repeated/externally initiated)
- **Why dangerous**: refund correctness is legal and trust-critical.
- **Trigger scenario**: support-initiated refund patterns.
- **Production impact**: customer harm and accounting mismatch.

### 🟠 IMPORTANT: No Payout Reconciliation Tests
- **Why dangerous**: absence of payout model already risky; no tests further reduces confidence.
- **Trigger scenario**: settlement edge cases.
- **Production impact**: latent liabilities.

### 🟢 NICE-TO-HAVE: Existing test coverage is mostly utility/smoke, not financial-contract level
- **Why dangerous**: low confidence during rapid iteration.
- **Trigger scenario**: frequent feature changes.
- **Production impact**: increased regression probability.

---

## Consolidated Risk Posture
Current implementation includes meaningful safeguards (server-authoritative order pricing, webhook signature verification, webhook idempotency table, inventory lock-on-payment strategy, audit log table), but it remains **high-risk for full production financial scale** due to unresolved critical controls around duplicate payment attempt containment, payout/dispute lifecycle management, reconciliation automation, and financial-event-level test rigor.
