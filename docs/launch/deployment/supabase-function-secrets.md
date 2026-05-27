# Supabase Function Secrets

Read this when you need the supabase function secrets details from [Deployment](../DEPLOYMENT.md).

Current backend expects these secrets as needed.

Core:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MODE`
- `PAYMENTS_ENABLED`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ALLOWED_ORIGINS`

Recommended for function error visibility:

- `SENTRY_DSN`

Email:

- `EMAIL_PROVIDER`
- `EMAIL_NOTIFICATION_EVENTS`
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`
- `SUPPORT_ALERT_EMAIL` defaults to `info@skiip.co.uk` if unset
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

Use [`supabase/.env.functions.example`](../../../supabase/.env.functions.example) as the template.

Keep `supabase/.env.functions` local and untracked.

Stripe live-cutover notes:

- set `STRIPE_MODE=test` in staging and `STRIPE_MODE=live` in production
- set `PAYMENTS_ENABLED=false` before production live-key cutover, then flip to `true` only when the controlled live payment window starts
- after `PAYMENTS_ENABLED=true`, admins can pause/resume new checkout from Admin Settings `Checkout availability`; this updates `app_settings.payment_controls` and does not change Stripe secrets
- never disable live reconciliation/refund/webhook functions by swapping back to test Stripe keys after live orders exist

Notes:

- Supabase edge functions also read `SUPABASE_URL` and `SUPABASE_ANON_KEY`, which are typically injected by the Supabase runtime rather than managed as custom secrets
- local Node scripts under [`app/scripts`](../../../app/scripts) may additionally use `SUPABASE_SERVICE_ROLE_KEY` or legacy `VITE_SUPABASE_SERVICE_ROLE_KEY`
