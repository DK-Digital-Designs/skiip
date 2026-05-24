# Supabase Metrics API

This runbook covers exporting hosted Supabase database metrics into a Prometheus-compatible monitoring stack. It is for external observability collectors only; it does not change the SKIIP app, Supabase Edge Functions, or database schema.

Last verified against Supabase telemetry docs on 2026-05-23.

## Current Posture

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

## Endpoint

Every hosted Supabase project exposes metrics at:

```text
https://<project-ref>.supabase.co/customer/v1/privileged/metrics
```

Derive `<project-ref>` from the target environment's `VITE_SUPABASE_URL` / `SUPABASE_URL`. Keep staging and production as separate scrape jobs with explicit `env` labels.

Supabase currently documents the Metrics API as beta. Metric names and labels may change, and the feature is not available for self-hosted Supabase.

## Credentials

The endpoint uses HTTP Basic Auth.

| Field | Value |
| --- | --- |
| Username | `service_role` |
| Password | Supabase Secret API key, preferably a dedicated `sb_secret_...` key for observability |

Do not use the browser anon key. Do not put the secret in `app/.env.example`, Vercel frontend variables, public docs, GitHub Actions logs, or committed Prometheus config.

Store the key in the collector's secret manager, such as Grafana Cloud secrets, Kubernetes Secret, AWS Secrets Manager, GCP Secret Manager, Vault, or a local root-only file.

## Local Smoke Test

Run this only from a trusted operator machine and do not paste the key into shared terminals or logs:

```bash
curl "https://<project-ref>.supabase.co/customer/v1/privileged/metrics" \
  --user "service_role:sb_secret_..."
```

Pass criteria:

- HTTP 200 response
- response body is Prometheus exposition text
- output includes multiple Supabase/Postgres metric series

Failure triage:

- `401` or `403`: check the username, key type, and whether the Secret API key belongs to the same project
- DNS or connection failure: check project ref, outbound HTTPS access, proxy/firewall rules, and Supabase status
- sparse or missing data: re-check the endpoint after one minute and compare with Supabase Studio database reports

## Prometheus Scrape Job

Use a one-minute scrape interval. The Metrics API emits the full current metric set on each request, and Supabase's own guidance matches a 60-second cadence.

```yaml
scrape_configs:
  - job_name: "supabase-staging"
    scrape_interval: 60s
    metrics_path: /customer/v1/privileged/metrics
    scheme: https
    basic_auth:
      username: service_role
      password_file: /run/secrets/supabase_staging_metrics_secret_api_key
    static_configs:
      - targets:
          - "<staging-project-ref>.supabase.co:443"
        labels:
          project: "<staging-project-ref>"
          env: "staging"
          service: "skiip"

  - job_name: "supabase-production"
    scrape_interval: 60s
    metrics_path: /customer/v1/privileged/metrics
    scheme: https
    basic_auth:
      username: service_role
      password_file: /run/secrets/supabase_production_metrics_secret_api_key
    static_configs:
      - targets:
          - "<production-project-ref>.supabase.co:443"
        labels:
          project: "<production-project-ref>"
          env: "production"
          service: "skiip"
```

If the collector does not support `password_file`, use its managed-secret field rather than committing `password:`.

## Dashboard Bootstrap

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

## Launch Gate

Before treating this as live launch monitoring:

1. Dedicated staging and production Secret API keys exist, or the risk of using a broader service-role-equivalent key is explicitly accepted.
2. The collector can scrape each environment once per minute.
3. Staging and production metrics have distinct `env` and `project` labels.
4. Grafana or the chosen tool has at least one dashboard proving fresh data.
5. Alert routes are tested for production.
6. The secret owner, rotation date, and storage location are recorded in the operational handoff.

If this is not configured before launch, SKIIP still has Supabase Studio reports and app-level telemetry, but does not have external database metric retention or proactive database-health alerting.

## Rotation

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
