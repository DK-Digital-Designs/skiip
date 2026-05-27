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
- the buyer fixed service fee is GBP 1.50
- Stripe Connect application fees remain 10% of subtotal plus the fixed service fee; Stripe processing fees are recorded separately
- full admin-approved destination-charge refunds request transfer reversal and application-fee refund
- buyer/vendor support requests are stored privately, surfaced through admin triage, and send best-effort internal email alerts
- buyer/vendor menu discovery uses the Mains category/tag label instead of Burgers; product names and descriptions can still mention burgers
- app-controlled inactivity logout is frontend-configurable per role and defaults to disabled when timeout env vars are `0`, unset, or invalid
- vendor Stripe Connect onboarding is currently hardcoded to GB Express accounts
- vendor Stripe Connect readiness is canonicalized in `stores.stripe_connect_status`
- the marketing site now lives outside this repo in [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing) and is not part of the order/payment source of truth
- Vercel analytics data is directional client-side telemetry; Supabase, Stripe, and the admin operations portal remain authoritative for orders, payments, refunds, and revenue
