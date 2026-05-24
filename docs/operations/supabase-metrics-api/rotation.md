# Rotation

Read this when you need the rotation details from [Supabase Metrics API](../SUPABASE_METRICS_API.md).

Rotate the Metrics API Secret API key when:

- an operator leaves or no longer needs observability access
- a key is pasted into a public channel or shared ticket
- the collector, dashboard vendor, or secret manager access changes
- Supabase flags or auto-revokes a leaked secret
- the normal launch secret-rotation cadence is due

Rotation process:

1. Create a replacement Supabase Secret API key for the same project.
2. Update the collector secret before deleting the old key.
3. Reload or restart the collector if required.
4. Confirm the scrape target remains healthy.
5. Revoke the old key.
6. Record the rotation in the release notes or operational log.
