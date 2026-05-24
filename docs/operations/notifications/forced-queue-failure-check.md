# Forced Queue Failure Check

Read this when you need the forced queue failure check details from [Notifications](../NOTIFICATIONS.md).

Use this only in a local or staging-safe environment.

1. Force `sendTransactionalNotifications()` to fail after a successful authoritative mutation, for example by temporarily making the `notification_logs` insert path return an error.
2. Run an order transition or admin refund against a safe test order.
3. Confirm the mutation response still succeeds and the order/refund state is committed.
4. Confirm function logs include the function name, operation, order id, event type, normalized error, and operation metadata.
5. Restore the forced failure immediately and confirm normal notification queueing resumes.
