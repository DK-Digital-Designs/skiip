# Prometheus Scrape Job

Read this when you need the prometheus scrape job details from [Supabase Metrics API](../SUPABASE_METRICS_API.md).

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
