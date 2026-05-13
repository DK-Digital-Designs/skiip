# Deployment

## Environment Model

SKIIP uses multiple deployment surfaces:

- Vercel for the React product app in `app/`
- Supabase for database, auth, realtime, storage, and edge functions
- Stripe for checkout, Connect onboarding, refunds, and webhooks
- an external marketing repo: [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing)
- optional notification providers: Resend for email and Twilio for WhatsApp

Current deployment split in the repo:

- the product app is the only deployable surface in this repository
- the marketing site is maintained outside this repository
- the product app's Vercel deployment is configured outside the repo, with repo-side behavior defined mainly by [`app/vercel.json`](../../app/vercel.json)

Current recommendation:

- keep separate Supabase and Stripe environments for staging and production
- keep Vercel env vars aligned to the matching Supabase project
- keep `ALLOWED_ORIGINS` explicit per environment
- treat `ALLOWED_ORIGINS` as both the CORS allow-list and the allow-list for checkout/onboarding redirect origins

## Frontend Environment Variables

Current product-app runtime variables:

Required:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Launch note:

- `VITE_VENDOR_INVITE_CODE` is not required for the May 2026 launch app because vendor onboarding is admin-created and `/vendor/signup` is not exposed.

Recommended:

- `VITE_SENTRY_DSN`

Important current clarification:

- use [Environment Matrix](ENVIRONMENT_MATRIX.md) as the parity checklist before staging and production deploys

- `VITE_STRIPE_PUBLIC_KEY` is still present in [`app/.env.example`](../../app/.env.example)
- the current app does not load Stripe.js or read `VITE_STRIPE_PUBLIC_KEY`
- checkout is redirect-based through the `stripe-checkout` edge function, so this variable is not currently required for runtime

For the full inventory and rotation discipline, see [Secrets and Environment Inventory](SECRETS.md).

## Supabase Function Secrets

Current backend expects these secrets as needed.

Core:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`

Recommended for function error visibility:

- `SENTRY_DSN`

Email:

- `EMAIL_PROVIDER`
- `EMAIL_NOTIFICATION_EVENTS`
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`
- `RESEND_WEBHOOK_SECRET`

WhatsApp:

- `WHATSAPP_PROVIDER`
- `WHATSAPP_NOTIFICATION_EVENTS`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WEBHOOK_TOKEN`
- `WHATSAPP_DEFAULT_COUNTRY_CODE`
- `TWILIO_TEMPLATE_ORDER_READY`
- `TWILIO_TEMPLATE_ORDER_PAID` when `order_paid` is enabled
- `TWILIO_TEMPLATE_ORDER_PREPARING` when `order_preparing` is enabled
- `TWILIO_TEMPLATE_ORDER_CANCELLED` when `order_cancelled` is enabled
- `TWILIO_TEMPLATE_ORDER_REFUNDED` when `order_refunded` is enabled

Notification outbox / retry tuning:

- `NOTIFICATION_DISPATCH_SECRET`
- `NOTIFICATION_DISPATCH_BATCH_SIZE`
- `NOTIFICATION_DISPATCH_MAX_BATCHES_PER_RUN`
- `NOTIFICATION_DISPATCH_MAX_ATTEMPTS`
- `NOTIFICATION_PROCESSING_TIMEOUT_SECONDS`
- `NOTIFICATION_RETRY_BASE_DELAY_SECONDS`

Use [`supabase/.env.functions.example`](../../supabase/.env.functions.example) as the template.

Keep `supabase/.env.functions` local and untracked.

Notes:

- Supabase edge functions also read `SUPABASE_URL` and `SUPABASE_ANON_KEY`, which are typically injected by the Supabase runtime rather than managed as custom secrets
- local Node scripts under [`app/scripts`](../../app/scripts) may additionally use `SUPABASE_SERVICE_ROLE_KEY` or legacy `VITE_SUPABASE_SERVICE_ROLE_KEY`

## Allowed Origins

Protected browser-facing functions reject disallowed origins after preflight.

Important current behavior:

- if `ALLOWED_ORIGINS` is set, it becomes the effective allow-list
- if `ALLOWED_ORIGINS` is missing, [`_shared/http.ts`](../../supabase/functions/_shared/http.ts) falls back to this hardcoded list:
  - `https://skiip.co.uk`
  - `https://www.skiip.co.uk`
  - `https://skiip-4nzf8krt6-dkdigital.vercel.app`
  - `https://skiip-git-staging-dkdigital.vercel.app`
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

Hosted environments should not rely on that fallback. Set `ALLOWED_ORIGINS` explicitly.

Because the app uses `HashRouter`, deep links such as `/#/order/track/...` are fine. The allow-list checks only the origin, not the hash path.

## Pilot Auth Decision

The repo configuration currently keeps `auth.email.enable_confirmations = false`.

That is the configuration source of truth for the pilot.

Important caveat:

- buyer signup assumes immediate account availability because email confirmations are disabled in repo auth config
- vendor self-signup is not exposed for launch

Before any broader launch:

- decide whether confirmations stay off or are re-enabled
- align the frontend copy with that decision
- run end-to-end signup, login, and recovery verification in the target environment

## Migrations and Schema Truth

Authoritative schema source:

- [`supabase/migrations`](../../supabase/migrations)

Do not treat these files as the current live-working schema source of truth:

- [`supabase/schema.sql`](../../supabase/schema.sql)
- [`supabase/skiip-schema.sql`](../../supabase/skiip-schema.sql)
- [`supabase/skiip-schema-full-reset.sql`](../../supabase/skiip-schema-full-reset.sql)

Important current caveat:

- [`supabase/config.toml`](../../supabase/config.toml) enables `db reset` seeding from `./seed.sql`
- `supabase/seed.sql` is not committed in this repo

That means:

- `supabase db push` is the reliable repo-supported database sync path
- `supabase db reset` should not be treated as guaranteed working without local seed overrides or a restored seed file

Recommended CLI flow:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## Edge Functions

Functions live in [`supabase/functions`](../../supabase/functions).

Current critical functions:

- `order-create`
- `stripe-checkout`
- `stripe-webhook`
- `order-transition`
- `admin-store`
- `stripe-refund`
- `stripe-reconcile-order`
- `stripe-onboarding-link`
- `stripe-connect-status`
- `notification-dispatch`
- `resend-email-webhook`
- `whatsapp-status-webhook`

Current notification-dispatch behavior:

- business flows queue notification rows
- immediate sends are attempted in edge-runtime background work
- delayed retries or backlog sweeps require `notification-dispatch`

Important current limitation:

- no scheduler for `notification-dispatch` is defined in this repository
- if retry sweeps are required in staging or production, they must be triggered manually or by an external scheduler

Legacy compatibility note:

- `whatsapp-notify` is still configured and deployable
- the ordered migration chain removes the old database trigger that called it
- do not treat `whatsapp-notify` as part of the intended current production flow

Deploy functions:

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

Events currently handled by code:

- `checkout.session.completed`
- `payment_intent.payment_failed`
- `account.updated`
- `charge.refunded`
- `charge.dispute.created`

Current payment specifics:

- checkout currency is `gbp`
- vendor onboarding creates Stripe Express accounts with `country = GB`
- onboarding currently requests `card_payments` and `transfers`
- vendor readiness is enforced through `stores.stripe_connect_status = 'ready'`
- `stripe-connect-status` reconciles live Stripe account state after onboarding return
- application fees are calculated as `10%` of order subtotal in `stripe-checkout`

Important:

- the webhook signing secret must come from the exact hosted Stripe webhook endpoint in use
- do not mix Stripe CLI listener secrets with hosted endpoint secrets
- seeded test seller accounts are not automatically Stripe-onboarded by the repo seeding scripts

## Twilio WhatsApp Status Webhook

Status webhook endpoint:

```text
https://<project-ref>.supabase.co/functions/v1/whatsapp-status-webhook
```

Important:

- outbound WhatsApp sends automatically attach this endpoint as the Twilio `StatusCallback`
- if `TWILIO_WEBHOOK_TOKEN` is set, it is appended to the callback URL and required by the webhook
- launch-safe default WhatsApp scope is `order_ready`
- `TWILIO_TEMPLATE_*` values must match the actual enabled event scope
- phone normalization defaults to country code `44` unless overridden
- `WHATSAPP_SEND_MODE` defaults to `disabled`; staging provider tests should use `allowlist`
- `WHATSAPP_ALLOWED_RECIPIENTS` must contain E.164 test numbers in `allowlist` mode
- `WHATSAPP_DAILY_SEND_LIMIT` and `WHATSAPP_PER_DISPATCH_LIMIT` are local spend brakes before Twilio is called
- non-production `live` mode is blocked unless `WHATSAPP_ALLOW_LIVE_NON_PROD=true`

## Resend Email

Important:

- `NOTIFICATION_FROM_EMAIL` must be a sender verified in Resend
- `RESEND_API_KEY` must exist in the same Supabase environment as the notification functions
- transactional email defaults to the full order event set unless `EMAIL_NOTIFICATION_EVENTS` narrows it

Webhook endpoint:

```text
https://jmqjuvfjthwbsbelgccs.supabase.co/functions/v1/resend-email-webhook
```

Current hosted project reference for this environment:

- `jmqjuvfjthwbsbelgccs`

Subscribe at least to:

- `email.sent`
- `email.delivered`
- `email.delivery_delayed`
- `email.failed`
- `email.bounced`
- `email.complained`
- `email.suppressed`

## Notification Outbox

Manual or externally scheduled dispatcher endpoint:

```text
https://<project-ref>.supabase.co/functions/v1/notification-dispatch
```

Important:

- the endpoint requires `Authorization: Bearer <NOTIFICATION_DISPATCH_SECRET>`
- `notification_logs` is both the delivery log and the durable outbox
- there is no repo-defined scheduler that calls this endpoint for you

## Frontend Security Headers

The product app deploy uses [`app/vercel.json`](../../app/vercel.json) to set baseline browser hardening headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera, microphone, and geolocation
- `Strict-Transport-Security`

## Static Marketing Site Deployment

The marketing site is no longer part of this repository.

Current source of truth:

- [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing)

Current caution:

- do not treat the marketing surface as backend-integrated deployment behavior unless that external repo is explicitly wired for it

## Post-Deploy Verification

After any meaningful backend or frontend deploy:

1. confirm the frontend is pointed at the intended Supabase project
2. confirm `ALLOWED_ORIGINS` is set explicitly for that environment
3. sign in as a buyer
4. create a test order
5. complete Stripe Checkout in test mode
6. confirm the order flips to `paid`
7. confirm vendor can move the order through statuses
8. confirm admin dashboard loads metrics
9. confirm admin refund flow still works
10. confirm the buyer can complete checkout without opting into WhatsApp
11. confirm Resend emails and, when enabled and opted in, Twilio WhatsApp updates
12. confirm `notification_logs` records queued, sent, delivered, and failed states with timestamps
13. if self-serve signup is in scope for the environment, verify actual signup behavior matches the chosen confirmation policy

## Staging Smoke Workflow

The deployed auth smoke lane lives in [staging-smoke.yml](../../.github/workflows/staging-smoke.yml).

Current purpose:

- validate that the deployed staging frontend is reachable
- validate public routing
- validate buyer, seller, and admin sign-in surfaces

Current limit:

- it is not the full payment-path rehearsal
- it does not create orders, open Stripe Checkout, verify webhook transitions, or execute refunds

Use it as an early warning for deployment drift and auth/config regressions, not as proof that the full launch-critical payment loop is healthy.

## Release Discipline

Before any staging or production release:

1. confirm all live schema changes exist in [`supabase/migrations`](../../supabase/migrations)
2. confirm no deployable behavior still depends on legacy schema snapshot files
3. confirm no production-only manual SQL is being relied on
4. sync frontend env vars and Supabase secrets for the same environment pair
5. set `ALLOWED_ORIGINS` explicitly for the target environment
6. deploy migrations before or alongside dependent function changes
7. run the Playwright smoke suite locally or against the deployed target
8. run one manual payment-path rehearsal when payments, auth, onboarding, or notifications changed
9. if notification retry recovery matters in that environment, confirm who or what will call `notification-dispatch`
10. capture any emergency manual fix as a committed migration immediately afterward
