# PRODUCTION LAUNCH CHECKLIST

Use this as a hard go/no-go gate for a live-money marketplace.

## FINANCIAL SAFETY
- [ ] All monetary calculations performed server-side
- [ ] Stripe webhook signature verification implemented
- [ ] Idempotency keys enforced on all payment operations
- [ ] All prices stored in integer minor units
- [ ] Refund logic tested for partial + full
- [ ] Vendor payout logic verified
- [ ] Platform fee calculation verified
- [ ] Tip passthrough verified
- [ ] Dispute workflow defined
- [ ] Financial audit trail exists
- [ ] Reconciliation job between Stripe and DB

### Evidence / Current State Notes
- [ ] Server-side monetary computation is authoritative for order creation and checkout, but not fully safeguarded by immutable ledger or complete invariant constraints.
- [ ] Stripe webhook signature verification exists; non-Stripe provider webhooks still require robust signature validation parity.
- [ ] Stripe outbound idempotency keys are not consistently enforced across checkout/refund/onboarding operations.
- [ ] Monetary storage currently uses decimal values (`NUMERIC`) rather than strict integer minor units.
- [ ] Partial-refund lifecycle and data model coverage is incomplete.
- [ ] No internal payout lifecycle table/reconciliation layer to verify funds settled as expected.
- [ ] Platform fee is hardcoded and needs policy governance/versioning and reconciliation validation.
- [ ] Tip inclusion/exclusion logic exists, but no explicit settlement proof controls for tip passthrough.
- [ ] Dispute path is not fully operationalized (workflow, ownership, deadlines, evidence chain).
- [ ] Audit logs exist but do not yet provide comprehensive financial event coverage.
- [ ] No automated Stripe-vs-DB reconciliation process found.

## SECURITY
- [ ] Secrets stored securely
- [ ] No secret keys in frontend
- [ ] Proper role-based access
- [ ] Vendor isolation enforced
- [ ] Rate limiting enabled
- [ ] Input validation enforced
- [ ] CSRF protection considered
- [ ] Environment variables validated

### Evidence / Current State Notes
- [ ] Frontend appears to use publishable/anon keys only; verify CI/CD secret injection and rotation policies.
- [ ] Role-assignment path must be hardened to prevent metadata-based privilege escalation.
- [ ] Vendor boundary checks are present in critical functions, but require continuous RLS migration discipline.
- [ ] Endpoint-level anti-abuse/rate-limiting controls are not explicit in edge functions.
- [ ] Input validation is present but should be elevated to strict schema validation on all money-moving endpoints.
- [ ] CSRF considerations are less prominent with token auth, but cross-origin invoke risk should still be explicitly threat-modeled.
- [ ] Runtime env validation should fail-fast for all mandatory payment-security variables in each function.

## RELIABILITY
- [ ] Webhook retry handling
- [ ] Duplicate webhook handling
- [ ] Transactional DB operations
- [ ] Background job resilience
- [ ] Graceful failure handling
- [ ] Logging structured and centralized

### Evidence / Current State Notes
- [ ] Stripe retries are external; internal retry orchestration/dead-letter handling is not comprehensive.
- [ ] Duplicate exact-event handling exists via `stripe_processed_events`, but semantic duplicates remain a risk.
- [ ] Multi-step order creation is not fully atomic at the application layer.
- [ ] No robust background reconciliation/repair workers identified.
- [ ] Some compensation exists (auto-refund on inventory commit failure), but broader failure matrix still has gaps.
- [ ] Logging exists (console + optional Sentry), but operational centralization/SLO alerting is incomplete.

## SCALABILITY
- [ ] Load testing performed
- [ ] Payment spike tested
- [ ] DB indexing reviewed
- [ ] Horizontal scaling plan

### Evidence / Current State Notes
- [ ] No payment-path load test artifacts found.
- [ ] No webhook burst simulation suite found.
- [ ] Core indexes exist; large-scale partitioning/archiving strategy is not yet explicit.
- [ ] Horizontal scaling is platform-implicit, but no documented capacity plan or thresholds present.

## OBSERVABILITY
- [ ] Payment failure alerts
- [ ] Webhook failure alerts
- [ ] Payout anomaly detection
- [ ] Refund tracking dashboard

### Evidence / Current State Notes
- [ ] No explicit automated alert rule definitions found for payment/webhook health.
- [ ] Refund visibility exists in admin metrics but lacks deep anomaly and drilldown tooling.
- [ ] Payout anomaly detection cannot be complete without payout tracking model.

## LEGAL / COMPLIANCE
- [ ] Terms covering refunds & disputes
- [ ] Vendor agreement defined
- [ ] Clear merchant of record defined
- [ ] GDPR / data handling review

### Evidence / Current State Notes
- [ ] Legal/compliance artifacts are not clearly represented as enforceable controls in repository.
- [ ] Merchant-of-record responsibilities in Connect model must be explicitly documented and contractually aligned.
- [ ] Data-retention and subject-right workflows are not clearly encoded in operational runbooks.

## UX / PRODUCT SAFETY
- [ ] Clear order states
- [ ] Clear refund communication
- [ ] Vendor payout visibility
- [ ] Admin override audit logging

### Evidence / Current State Notes
- [ ] Order-state UX is generally clear, but edge cases (duplicate payment attempts, partial refunds, disputes) need explicit user-safe messaging.
- [ ] Refund communications exist but should distinguish pending/partial/settled outcomes.
- [ ] Vendor payout visibility is limited without payout tracking primitives.
- [ ] Admin action logging exists for select flows; complete override traceability should be verified.
