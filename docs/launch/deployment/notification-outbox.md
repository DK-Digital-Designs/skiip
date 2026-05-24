# Notification Outbox

Read this when you need the notification outbox details from [Deployment](../DEPLOYMENT.md).

Manual or externally scheduled dispatcher endpoint:

```text
https://<project-ref>.supabase.co/functions/v1/notification-dispatch
```

Important:

- the endpoint requires `Authorization: Bearer <NOTIFICATION_DISPATCH_SECRET>`
- `notification_logs` is both the delivery log and the durable outbox
- there is no repo-defined scheduler that calls this endpoint for you
