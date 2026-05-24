# Current Operational Limitation

Read this when you need the current operational limitation details from [Notifications](../NOTIFICATIONS.md).

Delayed retries are not automatically scheduled in this repository.

Current behavior:

- immediate sends are attempted in edge-runtime background work
- stale or failed rows can be reclaimed and retried through `claim_notification_logs()`
- [`notification-dispatch`](../../../supabase/functions/notification-dispatch/index.ts) exists to drain backlog
- queue insertion failures are logged with function, operation, order, event, correlation/source event, and supplied operation metadata

Important:

- no GitHub Action, Supabase scheduled function, or other in-repo scheduler currently calls `notification-dispatch`
- if retry sweeps matter in staging or production, you must provide a manual or external scheduled trigger
