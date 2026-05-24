# Legacy Compatibility Code

Read this when you need the legacy compatibility code details from [Notifications](../NOTIFICATIONS.md).

[`whatsapp-notify`](../../../supabase/functions/whatsapp-notify/index.ts) still exists in the repo and is still deployable.

Current intended reality:

- the ordered migration chain removes the database trigger that used to call it
- the primary current flow is queue-backed dispatch through shared notification helpers

Treat `whatsapp-notify` as compatibility code for older environments, not as the intended primary production path.
