# Current Posture

Read this when you need the current posture details from [Supabase Metrics API](../SUPABASE_METRICS_API.md).

The Metrics API is an optional launch-hardening integration for database health and performance visibility.

Use it when SKIIP needs:

- database CPU, IO, WAL, connection, replication, and query-health trends outside Supabase Studio
- custom Grafana dashboards or alerting rules
- longer metric retention than the hosted Supabase dashboard provides
- database metrics beside Vercel, Stripe, Sentry, and notification-provider signals

Current repo posture:

- no Prometheus, Grafana, Datadog, or hosted collector config is committed
- no app runtime environment variable is required
- no Supabase migration or Edge Function deployment is required
- setup is external provider work and should be tracked as an operations task
