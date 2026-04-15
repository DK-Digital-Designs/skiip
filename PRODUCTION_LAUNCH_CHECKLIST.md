# PRODUCTION LAUNCH CHECKLIST

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
- [ ] Duplicate checkout session prevention for a single order
- [ ] Payment attempt history persisted (not just final order state)
- [ ] Transfer and payout IDs persisted and queryable per order
- [ ] Refund invariants enforceable (sum of refunds <= captured amount)
- [ ] Financial invariants constrained at DB level (`total` composition, nonnegative values)
- [ ] Auto-refund compensation path tested under inventory race conditions
- [ ] Manual Stripe dashboard actions are reconciled back into DB state

## SECURITY
- [ ] Secrets stored securely
- [ ] No secret keys in frontend
- [ ] Proper role-based access
- [ ] Vendor isolation enforced
- [ ] Rate limiting enabled
- [ ] Input validation enforced
- [ ] CSRF protection considered
- [ ] Environment variables validated
- [ ] Stripe webhook endpoint isolated from public auth-required middleware
- [ ] Twilio webhook signatures cryptographically verified (not token-only)
- [ ] CORS policies restricted to approved origins in production
- [ ] RLS policies reviewed for all financial tables (`orders`, `order_items`, `audit_logs`, `notification_logs`)
- [ ] Service-role usage limited to server-only paths
- [ ] Security logging cannot leak secrets/tokens/PII

## RELIABILITY
- [ ] Webhook retry handling
- [ ] Duplicate webhook handling
- [ ] Transactional DB operations
- [ ] Background job resilience
- [ ] Graceful failure handling
- [ ] Logging structured and centralized
- [ ] Dead-letter strategy for repeatedly failing webhook events
- [ ] Alerting on stuck orders (`pending` too long after payment initiation)
- [ ] Alerting on paid orders missing inventory commit
- [ ] Alerting on refunds that fail after payment capture
- [ ] Explicit timeout and retry policy for Stripe/Twilio/Resend calls
- [ ] Safe deployment/rollback runbook tested in staging

## SCALABILITY
- [ ] Load testing performed
- [ ] Payment spike tested
- [ ] DB indexing reviewed
- [ ] Horizontal scaling plan
- [ ] Webhook burst behavior tested (rate + latency + duplicate deliveries)
- [ ] Inventory locking behavior validated under concurrent checkout completion
- [ ] Analytics query performance reviewed against production-scale data
- [ ] Archival/partition strategy defined for high-growth tables (`orders`, `audit_logs`, `notification_logs`)

## OBSERVABILITY
- [ ] Payment failure alerts
- [ ] Webhook failure alerts
- [ ] Payout anomaly detection
- [ ] Refund tracking dashboard
- [ ] Duplicate charge anomaly detection
- [ ] Duplicate refund anomaly detection
- [ ] Real-time reconciliation mismatch dashboard (Stripe vs DB)
- [ ] Vendor settlement variance reporting
- [ ] Dispute lifecycle dashboard (opened / evidence due / won / lost)
- [ ] End-to-end traceability from order_id -> payment_intent -> charge -> transfer -> payout

## LEGAL / COMPLIANCE
- [ ] Terms covering refunds & disputes
- [ ] Vendor agreement defined
- [ ] Clear merchant of record defined
- [ ] GDPR / data handling review
- [ ] Tip handling policy documented and contractually aligned
- [ ] Chargeback/dispute response SLA documented with owners
- [ ] Data retention policy defined for financial and notification evidence
- [ ] Audit evidence export capability validated
- [ ] Privacy review for customer phone/email usage in notifications

## UX / PRODUCT SAFETY
- [ ] Clear order states
- [ ] Clear refund communication
- [ ] Vendor payout visibility
- [ ] Admin override audit logging
- [ ] Customer-facing payment pending/retry messaging avoids duplicate payment attempts
- [ ] Vendor UI differentiates unpaid vs paid vs refunded operationally
- [ ] Support tooling can safely locate and action orders by financial identifiers
- [ ] Incident banner capability for payment-provider degradation

## PRE-LAUNCH VALIDATION GATE
- [ ] Staging dress rehearsal completed with full buyer→vendor→admin→refund path
- [ ] Stripe test clocks/scenarios executed for delayed webhooks and retries
- [ ] Financial close test run completed (daily totals, refunds, fees, net vendor amounts)
- [ ] Go/no-go sign-off obtained from Engineering, Finance Ops, and Compliance owners
