# Current Runtime Truth

Read this when you need the current runtime truth details from [Current State](../CURRENT_STATE.md).

These statements reflect the actual current implementation.

- buyer checkout is authenticated only
- buyer checkout currently creates immediate-collection orders only; scheduled-order controls are hidden from the checkout screen, while backend/vendor/admin scheduled collection support remains present
- checkout shows client-approved informational allergen confirmation and late-collection wording; neither adds backend enforcement or a new stored field
- buyer-facing WhatsApp controls and status labels are hidden for the pilot, and new checkout payloads explicitly keep WhatsApp opt-in disabled
- order totals are computed on the server
- payment finalization is webhook-driven
- vendor/admin order status changes go through edge functions
- vendor order queue lanes are frontend grouping only; `order-transition` remains the source of truth for status changes
- admin vendor/store mutations go through `admin-store`
- protected edge functions intentionally use manual bearer validation for the May 2026 launch posture rather than Supabase gateway JWT enforcement
- checkout currency is GBP
- the buyer fixed service fee is GBP 1.50 per order
- Stripe Connect application fees are percentage-disabled for the current event, while the fixed GBP 1.50 buyer service fee is retained through the Connect application-fee path; Stripe processing fees are recorded separately
- full admin-approved destination-charge refunds request transfer reversal and application-fee refund
- buyer/vendor support requests are stored privately, surfaced through admin triage, and send best-effort internal email alerts
- buyer/vendor menu discovery uses the Mains category/tag label instead of Burgers; product names and descriptions can still mention burgers
- app-controlled inactivity logout is frontend-configurable per role; the approved pilot values are approximately 10 minutes for buyers and 30 minutes for sellers/admins
- vendor Stripe Connect onboarding is currently hardcoded to GB Express accounts
- vendor Stripe Connect readiness is canonicalized in `stores.stripe_connect_status`
- the marketing site now lives outside this repo in [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing), publishes client-supplied legal wording at `/terms`, `/privacy`, and `/cookies`, and is not part of the order/payment source of truth
- Vercel analytics data is directional client-side telemetry; Supabase, Stripe, and the admin operations portal remain authoritative for orders, payments, refunds, and revenue
