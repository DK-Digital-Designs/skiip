# Secrets To Provide Back

Read this when you need the secrets to provide back details from [Notifications](../NOTIFICATIONS.md).

Once the provider accounts are created, send these values back so the environment can be completed.

Core notification settings:

- `EMAIL_PROVIDER=resend`
- `WHATSAPP_PROVIDER=twilio`
- `EMAIL_NOTIFICATION_EVENTS`
- `WHATSAPP_NOTIFICATION_EVENTS`

Resend:

- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`
- `RESEND_WEBHOOK_SECRET`

Twilio:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WEBHOOK_TOKEN`
- `WHATSAPP_DEFAULT_COUNTRY_CODE`
- `WHATSAPP_SEND_MODE`
- `WHATSAPP_ALLOWED_RECIPIENTS`
- `WHATSAPP_DAILY_SEND_LIMIT`
- `WHATSAPP_PER_DISPATCH_LIMIT`
- `WHATSAPP_ALLOW_LIVE_NON_PROD`
- relevant `TWILIO_TEMPLATE_*` values

Outbox / dispatch:

- `NOTIFICATION_DISPATCH_SECRET` if you want manual or external retry sweeps
