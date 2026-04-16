# Deployment

## Environment Model

SKIIP uses multiple deployment surfaces:
- Vercel for the React app
- Supabase for database, auth, realtime, and edge functions
- Stripe for checkout, onboarding, and webhooks
- optional notification providers such as Twilio and Resend

Current recommendation:
- keep separate Supabase and Stripe environments for staging and production
- keep Vercel env vars aligned to the matching Supabase project
- only include preview domains in `ALLOWED_ORIGINS` when previews are intentionally connected to a backend

## Frontend Environment Variables

Required in Vercel for the app:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLIC_KEY`

These must all belong to the same environment pair. A mixed project URL/key setup will break auth and edge-function calls.

For the full inventory and rotation discipline, see [Secrets and Environment Inventory](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/SECRETS.md).

## Supabase Secrets

Current backend expects these as needed:

Core:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`

Email:
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`

WhatsApp with current implementation:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `TWILIO_WEBHOOK_TOKEN`
- template identifiers used by the notification helper

Use [`supabase/.env.functions.example`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/.env.functions.example) as the template. Keep `supabase/.env.functions` local and untracked.

## Pilot Auth Decision

Closed-pilot launch keeps `auth.email.enable_confirmations = false`.

That is intentional for the current pilot because:
- accounts are operator-created or directly supported
- support staff can verify buyer, seller, and admin access manually
- SMTP and support processes are not yet treated as fully launch-ready

Revisit this before any open self-serve launch. Re-enabling confirmations should happen together with a verified SMTP setup, updated support docs, and a smoke pass over signup and password recovery.

## Migrations

Migrations live in [`supabase/migrations`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations).

Important rule:
- production should not rely on undocumented manual SQL
- if a manual fix is applied, it must be encoded as a migration immediately

The current live-working schema depends on:
- [20260414000000_production_readiness.sql](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations/20260414000000_production_readiness.sql)
- [20260415000000_reconcile_live_schema.sql](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations/20260415000000_reconcile_live_schema.sql)
- [20260415000001_user_profile_reconciliation.sql](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations/20260415000001_user_profile_reconciliation.sql)

Recommended CLI flow:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## Edge Functions

Functions live in [`supabase/functions`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions).

Current critical functions:
- `order-create`
- `stripe-checkout`
- `stripe-webhook`
- `order-transition`
- `stripe-refund`
- `stripe-onboarding-link`

Deploy:

```bash
supabase functions deploy
```

Set secrets:

```bash
supabase secrets set --env-file supabase/.env.functions
```

## Stripe Configuration

Webhook endpoint:

```text
https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

Minimum subscribed events:
- `checkout.session.completed`
- `charge.refunded`
- `account.updated`

Important:
- the webhook signing secret must come from the exact Stripe webhook endpoint in use
- do not mix Stripe CLI listener secrets with hosted endpoint secrets

## Post-Deploy Verification

After any meaningful backend deploy:
1. sign in as a buyer
2. create a test order
3. complete Stripe Checkout in test mode
4. confirm the order flips to `paid`
5. confirm vendor can move the order through statuses
6. confirm admin dashboard loads metrics
7. confirm refund flow still works

For production cutovers, rollback sequencing, and incident handling, use [Launch Checklist](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/LAUNCH_CHECKLIST.md) rather than relying on this short verification list alone.

## Current Auth Deployment Note

Protected edge functions currently rely on:
- explicit bearer token forwarding from the frontend
- manual validation inside the function

That means deployment success depends on both:
- the frontend shipping the auth header
- the function code continuing to call `requireUser()`

## Release Discipline

Before any staging or production release:
1. confirm all live schema changes exist in [`supabase/migrations`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations)
2. confirm no production-only manual SQL is being relied on
3. sync Vercel env vars and Supabase secrets for the same environment pair
4. deploy migrations before or alongside dependent function changes
5. run the Playwright smoke suite locally or against the deployed target
6. capture any emergency manual fix as a committed migration immediately afterward
