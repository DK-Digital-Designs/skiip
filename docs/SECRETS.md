# Secrets and Environment Inventory

This document is the launch-facing inventory for SKIIP secrets, environment variables, and auth-sensitive settings.

Do not commit real secrets. Use [`supabase/.env.functions.example`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/.env.functions.example) as the local template for edge-function secrets.

## Environment Surfaces

| Surface | Setting | Required | Notes |
| :--- | :--- | :--- | :--- |
| Vercel app | `VITE_SUPABASE_URL` | Yes | Must match the same Supabase project as the anon key. |
| Vercel app | `VITE_SUPABASE_ANON_KEY` | Yes | Public key, but still environment-specific. |
| Vercel app | `VITE_STRIPE_PUBLIC_KEY` | Yes | Must match the Stripe environment used by checkout and webhooks. |
| Vercel app | `VITE_SENTRY_DSN` | Recommended | Strongly recommended for staging and production error visibility. |
| Supabase functions | `SUPABASE_SERVICE_ROLE_KEY` | Yes | Required for privileged writes, refunds, webhook processing, and admin flows. |
| Supabase functions | `STRIPE_SECRET_KEY` | Yes | Required anywhere checkout, onboarding, refunds, or webhooks run. |
| Supabase functions | `STRIPE_WEBHOOK_SECRET` | Yes | Must come from the exact hosted Stripe webhook endpoint in use. |
| Supabase functions | `ALLOWED_ORIGINS` | Yes | Must include every intentional frontend origin and nothing broader. |
| Supabase functions | `RESEND_API_KEY` | Optional | Required only if email notifications are launch-critical in that environment. |
| Supabase functions | `NOTIFICATION_FROM_EMAIL` | Optional | Required together with `RESEND_API_KEY`. |
| Supabase functions | `WHATSAPP_ACCESS_TOKEN` | Optional | Required if Meta WhatsApp delivery is enabled in that environment. |
| Supabase functions | `WHATSAPP_PHONE_NUMBER_ID` | Optional | Required with `WHATSAPP_ACCESS_TOKEN` for the sending phone number. |
| Supabase functions | `META_APP_SECRET` | Recommended | Used to verify POST signatures from Meta status webhooks. |
| Supabase functions | `META_WEBHOOK_VERIFY_TOKEN` | Recommended | Used for the initial GET verification handshake from Meta. |
| Supabase functions | `WHATSAPP_DEFAULT_COUNTRY_CODE` | Recommended | Defaults to `44`; set explicitly if local phone entry should normalize to another country. |
| Supabase functions | `META_TEMPLATE_ORDER_PAID` | Optional | Required only if the `order_paid` WhatsApp template should send. |
| Supabase functions | `META_TEMPLATE_ORDER_PREPARING` | Optional | Required only if the `order_preparing` WhatsApp template should send. |
| Supabase functions | `META_TEMPLATE_ORDER_READY` | Optional | Required only if the `order_ready` WhatsApp template should send. |
| Supabase functions | `META_TEMPLATE_ORDER_CANCELLED` | Optional | Required only if the `order_cancelled` WhatsApp template should send. |
| Supabase functions | `META_TEMPLATE_ORDER_REFUNDED` | Optional | Required only if the `order_refunded` WhatsApp template should send. |
| Supabase auth config | `auth.email.enable_confirmations` | Decision required | Intentionally `false` for the closed pilot. See decision below. |
| Stripe dashboard | Webhook endpoint + subscribed events | Yes | Keep staging and production endpoints separate. |

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
- [`supabase/.env.functions.example`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/.env.functions.example) documents function-secret shape, including the Meta WhatsApp variables now used by the notification helper.
- `supabase/.env.functions` should remain local and untracked.
