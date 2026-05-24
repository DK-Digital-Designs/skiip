# Launch Gate

Read this when you need the launch gate details from [Supabase Metrics API](../SUPABASE_METRICS_API.md).

Before treating this as live launch monitoring:

1. Dedicated staging and production Secret API keys exist, or the risk of using a broader service-role-equivalent key is explicitly accepted.
2. The collector can scrape each environment once per minute.
3. Staging and production metrics have distinct `env` and `project` labels.
4. Grafana or the chosen tool has at least one dashboard proving fresh data.
5. Alert routes are tested for production.
6. The secret owner, rotation date, and storage location are recorded in the operational handoff.

If this is not configured before launch, SKIIP still has Supabase Studio reports and app-level telemetry, but does not have external database metric retention or proactive database-health alerting.
