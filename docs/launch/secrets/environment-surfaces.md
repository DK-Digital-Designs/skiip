# Environment Surfaces

Read this when you need the environment surfaces details from [Secrets and Environment Inventory](../SECRETS.md).

| Surface | Setting | Required | Notes |
| :--- | :--- | :--- | :--- |
| Vercel app | `VITE_SUPABASE_URL` | Yes | Must match the same Supabase project as the anon key. |
| Vercel app | `VITE_SUPABASE_ANON_KEY` | Yes | Public key, but still environment-specific. |
| Vercel app | `VITE_VENDOR_INVITE_CODE` | No for launch | Legacy invite-code vendor signup is not exposed in the May 2026 launch app. |
| Vercel app | `VITE_SENTRY_DSN` | Recommended | Used by the browser app for Sentry error/reporting setup when present. |
| Vercel app | `VITE_STRIPE_PUBLIC_KEY` | No | Present in `app/.env.example`, but the current app does not read it. Checkout is redirect-based through edge functions. |
| Local operator scripts | `SUPABASE_SERVICE_ROLE_KEY` | Conditional | Used by `app/scripts/*.js` for seeding/admin scripting. Never expose this in browser runtime config. |
| Local operator scripts | `VITE_SUPABASE_SERVICE_ROLE_KEY` | Legacy compatibility only | Some local scripts still accept this older name. Prefer `SUPABASE_SERVICE_ROLE_KEY`. |
| Local operator scripts | `SUPABASE_URL` | Optional | Used by local scripts; set explicitly to avoid pointing at the wrong project. |
| Local operator scripts | `VITE_SUPABASE_URL` | Legacy compatibility only | Some local scripts still accept this older name. |
| External monitoring collector | `SUPABASE_METRICS_PROJECT_REF` | Conditional | Convenience value for Prometheus-compatible collectors. Derive from the target Supabase URL; not used by the app. |
| External monitoring collector | `SUPABASE_METRICS_USERNAME` | Conditional | Use `service_role` for the Metrics API Basic Auth username. |
| External monitoring collector | `SUPABASE_METRICS_SECRET_API_KEY` | Conditional | Secret API key for the Metrics API Basic Auth password. Prefer a dedicated `sb_secret_...` key and store it only in the collector secret manager. |
| Supabase functions | `SUPABASE_SERVICE_ROLE_KEY` | Yes | Required for privileged writes, refunds, webhook processing, and admin flows. |
| Supabase functions | `SKIIP_ENVIRONMENT` | Recommended | Set to `staging`, `production`, or the active environment name. WhatsApp live mode is treated as non-production unless this resolves to `production` or `prod`. |
| Supabase functions | `STRIPE_SECRET_KEY` | Yes | Required anywhere checkout, onboarding, refunds, or webhooks run. |
| Supabase functions | `STRIPE_WEBHOOK_SECRET` | Yes | Must come from the exact hosted Stripe webhook endpoint in use. |
| Supabase functions | `ALLOWED_ORIGINS` | Yes in hosted envs | Should always be set explicitly in staging and production. |
| Supabase functions | `SENTRY_DSN` | Recommended | Read by the shared logger for edge-function error reporting if configured. |
| Supabase functions | `RESEND_API_KEY` | Required for email | Required for customer email notifications in any environment that should send them. |
| Supabase functions | `NOTIFICATION_FROM_EMAIL` | Required for email | Must be a Resend-verified sender. |
| Supabase functions | `RESEND_WEBHOOK_SECRET` | Required for email webhooks | Required for verifying incoming Resend delivery-status webhooks. |
| Supabase functions | `EMAIL_PROVIDER` | Optional | Defaults to `resend`. |
| Supabase functions | `EMAIL_NOTIFICATION_EVENTS` | Optional | Defaults to all transactional events. |
| Supabase functions | `TWILIO_ACCOUNT_SID` | Required for WhatsApp | Required for WhatsApp delivery via Twilio. |
| Supabase functions | `TWILIO_AUTH_TOKEN` | Required unless API key auth is used | Twilio account auth token. Prefer API key auth for hosted environments when available. |
| Supabase functions | `TWILIO_API_KEY_SID` | Optional | Twilio API Key SID beginning with `SK`. Used as the Basic Auth username when paired with `TWILIO_API_KEY_SECRET`. |
| Supabase functions | `TWILIO_API_KEY_SECRET` | Optional | Twilio API Key secret. Used instead of `TWILIO_AUTH_TOKEN` when `TWILIO_API_KEY_SID` is set. |
| Supabase functions | `TWILIO_WHATSAPP_FROM` | Required for WhatsApp | Twilio sender address for outbound WhatsApp, for example `whatsapp:+14155238886`. |
| Supabase functions | `TWILIO_WHATSAPP_NUMBER` | Legacy compatibility only | Older alias accepted by code. Prefer `TWILIO_WHATSAPP_FROM`. |
| Supabase functions | `TWILIO_WEBHOOK_TOKEN` | Recommended | Added to the status callback URL and checked by `whatsapp-status-webhook`. |
| Supabase functions | `WHATSAPP_PROVIDER` | Optional | Defaults to `twilio`. |
| Supabase functions | `WHATSAPP_NOTIFICATION_EVENTS` | Optional | Defaults to `order_ready`. |
| Supabase functions | `WHATSAPP_SEND_MODE` | Yes for WhatsApp | Defaults to `disabled`. Use `allowlist` for staging smoke tests and `live` only after production sign-off. |
| Supabase functions | `WHATSAPP_ALLOWED_RECIPIENTS` | Required for `allowlist` | Comma-separated E.164 numbers allowed to receive WhatsApp in `allowlist` mode. |
| Supabase functions | `WHATSAPP_DAILY_SEND_LIMIT` | Recommended | Local safety cap for WhatsApp provider attempts per UTC day. Defaults to `10`. |
| Supabase functions | `WHATSAPP_PER_DISPATCH_LIMIT` | Recommended | Local safety cap for WhatsApp provider attempts in one dispatch sweep. Defaults to `2`. |
| Supabase functions | `WHATSAPP_ALLOW_LIVE_NON_PROD` | Optional | Defaults to `false`. Keep false unless intentionally testing unrestricted WhatsApp in a non-production environment. |
| Supabase functions | `WHATSAPP_DEFAULT_COUNTRY_CODE` | Recommended | Defaults to `44`. |
| Supabase functions | `TWILIO_TEMPLATE_ORDER_READY` | Required when WhatsApp is enabled | Template SID for the ready-for-pickup message. |
| Supabase functions | `TWILIO_TEMPLATE_READY_FOR_COLLECTION` | Legacy compatibility only | Older alias accepted for `order_ready`. |
| Supabase functions | `TWILIO_TEMPLATE_ORDER_PAID` | Optional | Needed only if `order_paid` is enabled for WhatsApp. |
| Supabase functions | `TWILIO_TEMPLATE_ORDER_CONFIRMATION` | Legacy compatibility only | Older alias accepted for `order_paid`. |
| Supabase functions | `TWILIO_TEMPLATE_ORDER_PREPARING` | Optional | Needed only if `order_preparing` is enabled. |
| Supabase functions | `TWILIO_TEMPLATE_ORDER_CANCELLED` | Optional | Needed only if `order_cancelled` is enabled. |
| Supabase functions | `TWILIO_TEMPLATE_ORDER_REFUNDED` | Optional | Needed only if `order_refunded` is enabled. |
| Supabase functions | `NOTIFICATION_DISPATCH_SECRET` | Conditional | Required if you will trigger notification retry/backlog sweeps manually or from an external scheduler. |
| Supabase functions | `NOTIFICATION_DISPATCH_BATCH_SIZE` | Optional | Defaults to `10`. |
| Supabase functions | `NOTIFICATION_DISPATCH_MAX_BATCHES_PER_RUN` | Optional | Defaults to `3`. |
| Supabase functions | `NOTIFICATION_DISPATCH_MAX_ATTEMPTS` | Optional | Defaults to `3`. |
| Supabase functions | `NOTIFICATION_PROCESSING_TIMEOUT_SECONDS` | Optional | Defaults to `300`. |
| Supabase functions | `NOTIFICATION_RETRY_BASE_DELAY_SECONDS` | Optional | Defaults to `60`. |
| Supabase auth config | `auth.email.enable_confirmations` | Decision required | Repo config currently keeps it `false`, but signup UI copy still implies inbox verification. |
| Stripe dashboard | Webhook endpoint + subscribed events | Yes | Keep staging and production endpoints separate. |
