# Pre-Launch Gates

Read this when you need the pre-launch gates details from [Launch Checklist](../LAUNCH_CHECKLIST.md).

Do not treat an environment as launch-ready until all of the following are true:

- auth posture is explicitly signed off
- RLS audit is complete for buyer, seller, admin, and service-role boundaries
- Vercel app vars, Supabase secrets, and Stripe keys all match the same environment pair
- `STRIPE_MODE` matches the Stripe account mode and `PAYMENTS_ENABLED` starts false for production cutover until the live payment test window
- Admin Settings `Checkout availability` can pause buyer checkout after `PAYMENTS_ENABLED=true`; effective checkout requires both switches enabled
- `ALLOWED_ORIGINS` is explicitly set for the target environment and hosted traffic is not relying on fallback origins in code
- notification provider accounts, webhook endpoints, and template IDs are configured for the target environment
- WhatsApp cost gates are explicitly configured: `WHATSAPP_SEND_MODE`, E.164 allowlist if required, daily cap, per-dispatch cap, and non-production live-mode override policy
- one full buyer -> Stripe test-mode payment -> reconciliation -> vendor -> refund rehearsal has passed with a Stripe-onboarded seller account
- the rehearsal confirms the GBP 1.50 buyer service fee, 0% Connect percentage application fee, refund transfer reversal, and paid vendor-cancellation review case
- Stripe payout schedule, pending verification requirements, and any manual/Instant Payout availability are inspected before event-day settlement expectations are agreed
- Admin Issues has an assigned monitor and refund approver during the pilot
- Stripe checkout creation idempotency and existing-session reuse are verified so retry/double-tap requests do not create duplicate sessions
- every visible launch vendor is verified in the live Stripe Dashboard; vendors that are not ready are hidden before go-live
- Playwright smoke checks pass for public routes and configured role credentials
- logging is sufficient to diagnose webhook, refund, notification, and auth failures
- vendor onboarding has been rehearsed with the actual path you plan to use
- all live schema changes are represented in committed migrations
- Vercel Web Analytics and Speed Insights are enabled and verified for the production project if public launch reporting is expected
- Google Search Console ownership, sitemap submission, and URL Inspection are complete for the production domain if search reporting is expected
- Supabase Metrics API scraping, dashboards, and alert routes are configured if external database-health monitoring is expected
- notification retry recovery is defined:
  - operator-only manual sweep is accepted
  - or an external scheduler exists for `notification-dispatch`
- if public buyer or vendor signup is in scope, the signup UX matches the actual auth confirmation policy
- if the external marketing repo is part of the launch surface, its contact/waitlist forms are either replaced with real capture or explicitly treated as non-operational
- `product-images` storage bucket exists with public object serving, no broad public object listing policy, seller/admin `products/<store_id>/*` uploads, PNG/JPG/WebP MIME limits, and a 5MB size limit
