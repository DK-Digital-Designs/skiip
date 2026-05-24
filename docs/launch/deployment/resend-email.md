# Resend Email

Read this when you need the resend email details from [Deployment](../DEPLOYMENT.md).

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
