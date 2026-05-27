# Launch Environment Matrix

This is the May 2026 launch source of truth for environment parity. Do not commit real secret values.

## Vercel App Variables

| Variable | Staging | Production | Notes |
| --- | --- | --- | --- |
| `VITE_SUPABASE_URL` | Required | Required | Must point to the matching Supabase project for the anon key. |
| `VITE_SUPABASE_ANON_KEY` | Required | Required | Public but environment-specific. |
| `VITE_PUBLIC_APP_ORIGIN` | Matching staging app origin | `https://www.skiip.co.uk` | Canonical origin used in Supabase Auth email redirects; do not set production to a Vercel deployment URL. |
| `VITE_SENTRY_DSN` | Recommended | Recommended | Browser error reporting. |
| `VITE_BUYER_SESSION_TIMEOUT_HOURS` | `0` unless testing expiry | `0` until an idle policy is approved | App-controlled buyer inactivity sign-out in hours; `0` disables. |
| `VITE_VENDOR_SESSION_TIMEOUT_HOURS` | `0` unless testing expiry | `0` until an idle policy is approved | App-controlled vendor inactivity sign-out in hours; `0` disables. |
| `VITE_ADMIN_SESSION_TIMEOUT_HOURS` | `0` unless testing expiry | `0` until an idle policy is approved | App-controlled admin inactivity sign-out in hours; `0` disables. |
| `VITE_STRIPE_PUBLIC_KEY` | Removed | Removed | Current checkout is redirect-based through edge functions. Do not set this in Vercel production. |
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
| `STRIPE_MODE` | `test` | `live` | Webhooks whose `event.livemode` does not match are rejected before event claiming. |
| `PAYMENTS_ENABLED` | `true` for rehearsals | `false` during cutover, then `true` at live-test window | Environment-level master switch for new Checkout Session creation. Keep live secrets in place for recovery/refunds. |
| `NOTIFICATION_FROM_EMAIL` | Required for email | Required for email | Must use a verified sender/domain. |
| `RESEND_API_KEY` | Test/staging key | Production key | Required for email notifications. |
| `SUPPORT_ALERT_EMAIL` | Optional, defaults to `info@skiip.co.uk` | Optional, defaults to `info@skiip.co.uk` | Internal recipient for new issue-form alerts. |
| `TWILIO_ACCOUNT_SID` | Test/staging account | Production account | Required for WhatsApp notifications if enabled. |
| `TWILIO_AUTH_TOKEN` | Test/staging token | Production token | Required for WhatsApp notifications if enabled. |
| `TWILIO_WHATSAPP_FROM` | Test/staging sender | Production sender | Must match approved Twilio sender. |
| `TWILIO_WEBHOOK_TOKEN` | Required if callback tokenized | Required if callback tokenized | Must match WhatsApp status callback URL. |

## Redirects And Webhooks

| Surface | Staging Check | Production Check |
| --- | --- | --- |
| Stripe checkout success/cancel | Frontend origin in `ALLOWED_ORIGINS`; app returns to `/#/order/track`. | Same as staging with production app origin. |
| Stripe webhook | Dashboard endpoint points to `/functions/v1/stripe-webhook`; secret matches `STRIPE_WEBHOOK_SECRET`. | Same with live endpoint and live secret. |
| Admin payment switch | Admin Settings `Checkout availability` writes `app_settings.payment_controls`; checkout is enabled only when this and `PAYMENTS_ENABLED` are both on. | Same; use this first for curfew/operator stop-sale after the live window opens. |
| WhatsApp status callback | Callback points to `/functions/v1/whatsapp-status-webhook`; token query matches `TWILIO_WEBHOOK_TOKEN` if configured. | Same with production Supabase URL. |
| Resend webhook | Callback points to `/functions/v1/resend-email-webhook` if provider webhooks are enabled. | Same with production Supabase URL. |
| Supabase Auth password recovery | `VITE_PUBLIC_APP_ORIGIN` and Auth redirect allow-list use the staging app `/#/reset-password` callback; send and redeem one reset email through the password form. | Site URL is `https://www.skiip.co.uk/`; Auth redirect allow-list and recovery template return to `https://www.skiip.co.uk/#/reset-password`; custom production SMTP delivers one recovery email whose first click opens the password form. |

## Pre-Test Verification

Before May 12 staging testing:

1. Confirm Vercel staging env points to staging Supabase and Stripe test mode.
2. Confirm Supabase function secrets use the same staging project/account pair.
3. Confirm `ALLOWED_ORIGINS` includes only the staging app origin, local dev origins if needed, and any approved preview origin.
4. Confirm Stripe dashboard webhook endpoint and secret match the deployed staging function.
5. Confirm notification provider sender/callback settings match staging function URLs.
6. Confirm Supabase Auth password recovery callback and email delivery with one test account.
7. Run one immediate order and one scheduled order through Stripe test checkout.
8. Confirm webhook marks payment succeeded, inventory finalizes, notifications queue, and vendor/admin views show the order.
9. Set each session timeout variable to `1` in a test deployment in turn and verify inactivity expiry messaging before returning values to `0` for the pilot baseline.

Before production launch:

1. Repeat the same checks against production app, production Supabase, and Stripe live mode.
2. Do not copy staging test secrets into production.
3. Do not switch Stripe keys without also checking webhook endpoints and connected-account mode.
4. Confirm Web Analytics and Speed Insights are enabled on the production Vercel project.
5. Confirm Search Console ownership, sitemap submission, and root URL inspection for the production domain.
6. Confirm the production Supabase Auth email link visibly uses `https://www.skiip.co.uk`, and its first click delivers a usable password recovery form.
7. Confirm the agreed role-specific idle timeout values are deployed; the default pilot baseline is disabled (`0`) until SKIIP approves a policy.
