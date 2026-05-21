# Launch Environment Matrix

This is the May 2026 launch source of truth for environment parity. Do not commit real secret values.

## Vercel App Variables

| Variable | Staging | Production | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Required | Required | Must point to the matching Supabase project for the anon key. |
| `VITE_SUPABASE_ANON_KEY` | Required | Required | Public but environment-specific. |
| `VITE_SENTRY_DSN` | Recommended | Recommended | Browser error reporting. |
| `VITE_STRIPE_PUBLIC_KEY` | Not required | Not required | Current checkout is redirect-based through edge functions. |
| `VITE_VENDOR_INVITE_CODE` | Not required | Not required | Vendor onboarding is admin-created for launch. |

## Vercel Project Features

| Feature | Staging | Production | Notes |
| --- | --- | --- | --- |
| Web Analytics | Recommended | Required for public launch reporting | Repo mounts `<Analytics />`; hosted project feature must also be enabled and verified. |
| Speed Insights | Recommended | Required for public launch performance reporting | Repo mounts `<SpeedInsights />`; field data depends on real production traffic. |
| Production domain | Optional | Required | Search Console, sitemap, canonical URL, and social metadata expect `https://www.skiip.co.uk/`. |
| Google Search Console | Optional | Required for search reporting | External account setup; verify property, submit sitemap, and confirm URL Inspection after deploy. |

## Supabase Function Secrets

| Secret | Staging | Production | Notes |
| --- | --- | --- | --- |
| `SUPABASE_URL` | Required | Required | Same project as the deployed functions. |
| `SUPABASE_ANON_KEY` | Required | Required | Used by `requireUser()` token validation. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required | Required | Server-side writes only. Never expose to browser runtime. |
| `ALLOWED_ORIGINS` | Required | Required | Comma-separated exact frontend origins. Do not rely on code fallback for hosted envs. |
| `STRIPE_SECRET_KEY` | Test mode | Live mode | Must match webhook/account environment. |
| `STRIPE_WEBHOOK_SECRET` | Test endpoint | Live endpoint | Must match the deployed `stripe-webhook` endpoint. |
| `NOTIFICATION_FROM_EMAIL` | Required for email | Required for email | Must use a verified sender/domain. |
| `RESEND_API_KEY` | Test/staging key | Production key | Required for email notifications. |
| `TWILIO_ACCOUNT_SID` | Test/staging account | Production account | Required for WhatsApp notifications if enabled. |
| `TWILIO_AUTH_TOKEN` | Test/staging token | Production token | Required for WhatsApp notifications if enabled. |
| `TWILIO_WHATSAPP_FROM` | Test/staging sender | Production sender | Must match approved Twilio sender. |
| `TWILIO_WEBHOOK_TOKEN` | Required if callback tokenized | Required if callback tokenized | Must match WhatsApp status callback URL. |

## Redirects And Webhooks

| Surface | Staging Check | Production Check |
| --- | --- | --- |
| Stripe checkout success/cancel | Frontend origin in `ALLOWED_ORIGINS`; app returns to `/#/order/track`. | Same as staging with production app origin. |
| Stripe webhook | Dashboard endpoint points to `/functions/v1/stripe-webhook`; secret matches `STRIPE_WEBHOOK_SECRET`. | Same with live endpoint and live secret. |
| WhatsApp status callback | Callback points to `/functions/v1/whatsapp-status-webhook`; token query matches `TWILIO_WEBHOOK_TOKEN` if configured. | Same with production Supabase URL. |
| Resend webhook | Callback points to `/functions/v1/resend-email-webhook` if provider webhooks are enabled. | Same with production Supabase URL. |

## Pre-Test Verification

Before May 12 staging testing:

1. Confirm Vercel staging env points to staging Supabase and Stripe test mode.
2. Confirm Supabase function secrets use the same staging project/account pair.
3. Confirm `ALLOWED_ORIGINS` includes only the staging app origin, local dev origins if needed, and any approved preview origin.
4. Confirm Stripe dashboard webhook endpoint and secret match the deployed staging function.
5. Confirm notification provider sender/callback settings match staging function URLs.
6. Run one immediate order and one scheduled order through Stripe test checkout.
7. Confirm webhook marks payment succeeded, inventory finalizes, notifications queue, and vendor/admin views show the order.

Before production launch:

1. Repeat the same checks against production app, production Supabase, and Stripe live mode.
2. Do not copy staging test secrets into production.
3. Do not switch Stripe keys without also checking webhook endpoints and connected-account mode.
4. Confirm Web Analytics and Speed Insights are enabled on the production Vercel project.
5. Confirm Search Console ownership, sitemap submission, and root URL inspection for the production domain.
