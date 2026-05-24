# Smoke Test Checklist

Read this when you need the smoke test checklist details from [Notifications](../NOTIFICATIONS.md).

Run this after the real provider setup is complete:

1. Set staging to `WHATSAPP_SEND_MODE=allowlist`.
2. Set `WHATSAPP_ALLOWED_RECIPIENTS` to the operator test numbers in E.164 format.
3. Set `WHATSAPP_DAILY_SEND_LIMIT=3` and `WHATSAPP_PER_DISPATCH_LIMIT=1`.
4. Place a test order without WhatsApp opt-in.
5. Confirm checkout succeeds and the order still progresses normally.
6. Confirm email notifications are queued and delivered for the applicable event.
7. Place a second test order with WhatsApp opt-in and an allow-listed number.
8. Move that order to `ready`.
9. Confirm Twilio sends one WhatsApp message and the row records `whatsapp_provider_attempted_at`.
10. Confirm Twilio delivery callbacks update `notification_logs`.
11. Confirm Twilio and Resend webhook events are persisted in `notification_webhook_events`.
12. Place a third test order with WhatsApp opt-in and a non-allow-listed number.
13. Confirm no Twilio message SID is recorded and metadata contains `guard_not_allowlisted`.
14. Lower `WHATSAPP_DAILY_SEND_LIMIT=1`, run a second eligible same-day send, and confirm metadata contains `guard_daily_cap_reached`.
15. If retry sweeps are part of the environment, trigger `notification-dispatch` and confirm backlog rows are reclaimed correctly without exceeding the configured WhatsApp caps.
