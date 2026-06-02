# What Changed Recently

Read this when you need the what changed recently details from [Current State](../CURRENT_STATE.md).

Recent hardening work introduced:

- production-oriented order/payment flow
- vendor kanban order queue for active kitchen operations
- authoritative edge functions for order creation, transitions, onboarding, and refunds
- admin metrics RPC with failed-payment reporting
- audit logging
- Stripe webhook idempotency tracking
- payment failure fields on orders
- queue-backed notification dispatch with richer delivery timestamps
- Resend webhook ingestion
- protected buyer/vendor issue reporting with admin triage
- internal email alerts for new issue-form submissions
- Mains category/tag label for former Burgers menu discovery
- event-readiness update: restored the fixed GBP 1.50 buyer service fee, kept the percentage Connect application fee at GBP 0, and tightened cancellation so orders cannot be cancelled once preparation starts
- country-code based checkout phone capture and E.164 normalization for opted-in notifications
- frontend-configurable per-role inactivity logout, defaulted to disabled
- SEO/search assets, Vercel Analytics, Speed Insights, and privacy-conscious buyer-funnel event tracking
- schema and auth-profile reconciliation migrations

The repo now represents a first operational baseline. It does not yet represent a finished platform or a fully hardened open-launch posture.

---
