# Twilio WhatsApp Status Webhook

Read this when you need the twilio whatsapp status webhook details from [Deployment](../DEPLOYMENT.md).

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
