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
- SEO/search assets, Vercel Analytics, Speed Insights, and privacy-conscious buyer-funnel event tracking
- schema and auth-profile reconciliation migrations

The repo now represents a first operational baseline. It does not yet represent a finished platform or a fully hardened open-launch posture.

---
