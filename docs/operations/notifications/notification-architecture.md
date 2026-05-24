# Notification Architecture

Read this when you need the notification architecture details from [Notifications](../NOTIFICATIONS.md).

Current runtime flow:

1. Business state changes first.
2. The backend queues rows into `notification_logs`.
3. Background dispatch resolves the correct provider adapter per channel.
4. Provider APIs send the message.
5. Provider webhooks update delivery state back onto `notification_logs`.
6. `notification_webhook_events` stores webhook deliveries for idempotency and audit traceability.

Current `notification_logs` states:

- `queued`
- `processing`
- `sent`
- `delivered`
- `read`
- `failed`

Important rules:

- notification delivery is not the source of truth for order state
- a failed notification must not block the order/payment mutation that created it
- post-mutation notification queueing is best-effort for order transitions, refunds, webhook payment completion, and admin reconciliation
- if queueing fails before a `notification_logs` row exists, operators must investigate function logs; `notification-dispatch` can only retry rows that were successfully written
