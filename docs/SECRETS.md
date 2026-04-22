# Secrets and Environment Inventory

This document is the launch-facing inventory for SKIIP secrets, environment variables, and auth-sensitive settings.

Do not commit real secrets. Use [`supabase/.env.functions.example`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/.env.functions.example) as the local template for edge-function secrets.

## Environment Surfaces

| Surface              | Setting                              | Required          | Notes                                                                                                                               |
| :------------------- | :----------------------------------- | :---------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| Vercel app           | `VITE_SUPABASE_URL`                  | Yes               | Must match the same Supabase project as the anon key.                                                                               |
| Vercel app           | `VITE_SUPABASE_ANON_KEY`             | Yes               | Public key, but still environment-specific.                                                                                         |
| Vercel app           | `VITE_STRIPE_PUBLIC_KEY`             | Yes               | Must match the Stripe environment used by checkout and webhooks.                                                                    |
| Vercel app           | `VITE_SENTRY_DSN`                    | Recommended       | Strongly recommended for staging and production error visibility.                                                                   |
| Supabase functions   | `SUPABASE_SERVICE_ROLE_KEY`          | Yes               | Required for privileged writes, refunds, webhook processing, and admin flows.                                                       |
| Supabase functions   | `STRIPE_SECRET_KEY`                  | Yes               | Required anywhere checkout, onboarding, refunds, or webhooks run.                                                                   |
| Supabase functions   | `STRIPE_WEBHOOK_SECRET`              | Yes               | Must come from the exact hosted Stripe webhook endpoint in use.                                                                     |
| Supabase functions   | `ALLOWED_ORIGINS`                    | Yes               | Must include every intentional frontend origin and nothing broader.                                                                 |
| Supabase functions   | `RESEND_API_KEY`                     | Required          | Required for customer email notifications in any environment that should send them.                                                 |
| Supabase functions   | `NOTIFICATION_FROM_EMAIL`            | Required          | Required with `RESEND_API_KEY`; must be a Resend-verified sender.                                                                   |
| Supabase functions   | `RESEND_WEBHOOK_SECRET`              | Required          | Required for verifying incoming Resend delivery-status webhooks.                                                                    |
| Supabase functions   | `EMAIL_PROVIDER`                     | Optional          | Defaults to `resend`; kept explicit so email can stay adapter-driven if the provider changes later.                                 |
| Supabase functions   | `EMAIL_NOTIFICATION_EVENTS`          | Optional          | Defaults to all transactional events; comma-separated list if launch scope needs to be narrowed.                                    |
| Supabase functions   | `TWILIO_ACCOUNT_SID`                 | Required          | Required for WhatsApp delivery via Twilio.                                                                                          |
| Supabase functions   | `TWILIO_AUTH_TOKEN`                  | Required          | Required for WhatsApp delivery via Twilio and status callback authentication.                                                       |
| Supabase functions   | `TWILIO_WHATSAPP_FROM`               | Required          | Twilio sender address for outbound WhatsApp, for example `whatsapp:+14155238886`. Legacy `TWILIO_WHATSAPP_NUMBER` is also accepted. |
| Supabase functions   | `TWILIO_WEBHOOK_TOKEN`               | Recommended       | Added to the status callback URL and checked by `whatsapp-status-webhook`.                                                          |
| Supabase functions   | `WHATSAPP_PROVIDER`                  | Optional          | Defaults to `twilio`; kept explicit so the channel can move behind the adapter layer later.                                         |
| Supabase functions   | `WHATSAPP_NOTIFICATION_EVENTS`       | Optional          | Defaults to `order_ready`; widen only if you intentionally want more WhatsApp touchpoints.                                          |
| Supabase functions   | `WHATSAPP_DEFAULT_COUNTRY_CODE`      | Recommended       | Defaults to `44`; set explicitly if local phone entry should normalize to another country.                                          |
| Supabase functions   | `TWILIO_TEMPLATE_ORDER_READY`        | Required          | Twilio Content Template SID for the ready-for-pickup message. Legacy `TWILIO_TEMPLATE_READY_FOR_COLLECTION` is also accepted.       |
| Supabase functions   | `TWILIO_TEMPLATE_ORDER_PAID`         | Optional          | Needed only if `WHATSAPP_NOTIFICATION_EVENTS` includes `order_paid`. Legacy `TWILIO_TEMPLATE_ORDER_CONFIRMATION` is also accepted.  |
| Supabase functions   | `TWILIO_TEMPLATE_ORDER_PREPARING`    | Optional          | Needed only if `WHATSAPP_NOTIFICATION_EVENTS` includes `order_preparing`.                                                           |
| Supabase functions   | `TWILIO_TEMPLATE_ORDER_CANCELLED`    | Optional          | Needed only if `WHATSAPP_NOTIFICATION_EVENTS` includes `order_cancelled`.                                                           |
| Supabase functions   | `TWILIO_TEMPLATE_ORDER_REFUNDED`     | Optional          | Needed only if `WHATSAPP_NOTIFICATION_EVENTS` includes `order_refunded`.                                                            |
| Supabase functions   | `NOTIFICATION_DISPATCH_SECRET`       | Recommended       | Required if you want to trigger the outbox dispatcher manually or from a scheduled HTTP job.                                        |
| Supabase functions   | `NOTIFICATION_DISPATCH_BATCH_SIZE`   | Optional          | Defaults to `10`; queue sweep batch size for the notification outbox dispatcher.                                                    |
| Supabase functions   | `NOTIFICATION_DISPATCH_MAX_BATCHES_PER_RUN` | Optional    | Defaults to `3`; caps how much backlog one dispatcher invocation drains.                                                            |
| Supabase functions   | `NOTIFICATION_DISPATCH_MAX_ATTEMPTS` | Optional          | Defaults to `3`; max provider-send attempts before a notification stays failed.                                                     |
| Supabase functions   | `NOTIFICATION_PROCESSING_TIMEOUT_SECONDS` | Optional     | Defaults to `300`; stale processing claims older than this are eligible for reclaim.                                                |
| Supabase functions   | `NOTIFICATION_RETRY_BASE_DELAY_SECONDS` | Optional      | Defaults to `60`; exponential retry backoff base for outbox dispatch failures.                                                     |
| Supabase auth config | `auth.email.enable_confirmations`    | Decision required | Intentionally `false` for the closed pilot. See decision below.                                                                     |
| Stripe dashboard     | Webhook endpoint + subscribed events | Yes               | Keep staging and production endpoints separate.                                                                                     |

## Current Pilot Auth Decision

`auth.email.enable_confirmations = false` remains the explicit closed-pilot decision.

This is acceptable only while:

- buyers, sellers, and admins are invited or directly supported
- support staff can resolve account issues manually
- the product is not yet relying on self-serve public signup as a trust boundary

Before any broader launch:

- configure production SMTP
- re-enable email confirmations
- run signup, login, and password-reset smoke checks against the target environment
- update support docs for email delivery failures and account recovery

## Allowed Origins Inventory

`ALLOWED_ORIGINS` should stay explicit and environment-scoped:

- local development: `http://localhost:5173`
- staging: the exact staging app domain only
- production: `https://skiip.co.uk` and `https://www.skiip.co.uk`
- preview: include only if preview deployments are intentionally connected to a backend

Do not use wildcard origins. Do not leave stale preview domains in the list once they stop being active.

## Rotation Checklist

Use this checklist for Supabase, Stripe, email, and WhatsApp provider secrets:

1. Identify the secret, environment, owner, and reason for rotation.
2. Generate the replacement secret in the provider console.
3. Update the relevant environment manager before revoking the old value.
4. Redeploy any functions or frontend surfaces that read the rotated secret.
5. Run smoke verification for the affected flow.
6. Revoke the old secret only after verification passes.
7. Record the rotation date and operator in the release notes or operational log.

Immediate rotation triggers:

- any secret was pasted into a public channel, ticket, or document
- access was shared with someone who no longer needs it
- a laptop or password manager compromise is suspected
- a provider dashboard shows suspicious usage or webhook tampering

## Local Files

- [`app/.env.example`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/.env.example) documents frontend env shape.
- [`supabase/.env.functions.example`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/.env.functions.example) documents the function-secret shape for Twilio WhatsApp delivery, Resend email, and the notification outbox dispatcher.
- `supabase/.env.functions` should remain local and untracked.
