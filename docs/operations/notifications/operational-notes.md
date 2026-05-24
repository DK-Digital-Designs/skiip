# Operational Notes

Read this when you need the operational notes details from [Notifications](../NOTIFICATIONS.md).

- `notification_logs` is both the delivery log and the durable outbox.
- `notification_webhook_events` is the idempotent webhook receipt log.
- `notification-dispatch` is the only retry/backlog sweep mechanism currently present in the repo.
- no in-repo scheduler calls `notification-dispatch`.
- `notification-dispatch` does not recreate notifications that failed before an outbox row was inserted.
- the intended launch-safe baseline is implemented in code; the remaining work is provider-account setup, secret injection, and live verification.
