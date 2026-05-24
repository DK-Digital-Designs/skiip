# Endpoint

Read this when you need the endpoint details from [Supabase Metrics API](../SUPABASE_METRICS_API.md).

Every hosted Supabase project exposes metrics at:

```text
https://<project-ref>.supabase.co/customer/v1/privileged/metrics
```

Derive `<project-ref>` from the target environment's `VITE_SUPABASE_URL` / `SUPABASE_URL`. Keep staging and production as separate scrape jobs with explicit `env` labels.

Supabase currently documents the Metrics API as beta. Metric names and labels may change, and the feature is not available for self-hosted Supabase.
