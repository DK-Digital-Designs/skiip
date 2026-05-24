# Dashboard Bootstrap

Read this when you need the dashboard bootstrap details from [Supabase Metrics API](../SUPABASE_METRICS_API.md).

Preferred bootstrap path:

1. Configure the scrape job in the chosen collector.
2. Confirm Prometheus can query the `job="supabase-production"` and `job="supabase-staging"` targets.
3. Import the Supabase Grafana dashboard JSON from `https://github.com/supabase/supabase-grafana`.
4. Select the Prometheus-compatible datasource.
5. Add alert routes for the production dashboard before relying on it during an event.

For non-Grafana stacks, recreate the most useful panels around:

- connection saturation
- CPU and memory pressure
- disk usage and IO pressure
- WAL growth and replication lag
- slow query and query-throughput patterns
- index and table-health regressions

Because the Metrics API is beta, alert rules should be reviewed after Supabase platform updates and after any dashboard JSON refresh.
