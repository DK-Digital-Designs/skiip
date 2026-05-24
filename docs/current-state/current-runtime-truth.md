# Current Runtime Truth

Read this when you need the current runtime truth details from [Current State](../CURRENT_STATE.md).

These statements reflect the actual current implementation.

- buyer checkout is authenticated only
- order totals are computed on the server
- payment finalization is webhook-driven
- vendor/admin order status changes go through edge functions
- vendor order queue lanes are frontend grouping only; `order-transition` remains the source of truth for status changes
- admin vendor/store mutations go through `admin-store`
- protected edge functions intentionally use manual bearer validation for the May 2026 launch posture rather than Supabase gateway JWT enforcement
- checkout currency is GBP
- vendor Stripe Connect onboarding is currently hardcoded to GB Express accounts
- vendor Stripe Connect readiness is canonicalized in `stores.stripe_connect_status`
- the marketing site now lives outside this repo in [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing) and is not part of the order/payment source of truth
- Vercel analytics data is directional client-side telemetry; Supabase, Stripe, and the admin dashboard remain authoritative for orders, payments, refunds, and revenue
