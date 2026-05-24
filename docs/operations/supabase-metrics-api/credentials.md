# Credentials

Read this when you need the credentials details from [Supabase Metrics API](../SUPABASE_METRICS_API.md).

The endpoint uses HTTP Basic Auth.

| Field | Value |
| --- | --- |
| Username | `service_role` |
| Password | Supabase Secret API key, preferably a dedicated `sb_secret_...` key for observability |

Do not use the browser anon key. Do not put the secret in `app/.env.example`, Vercel frontend variables, public docs, GitHub Actions logs, or committed Prometheus config.

Store the key in the collector's secret manager, such as Grafana Cloud secrets, Kubernetes Secret, AWS Secrets Manager, GCP Secret Manager, Vault, or a local root-only file.
