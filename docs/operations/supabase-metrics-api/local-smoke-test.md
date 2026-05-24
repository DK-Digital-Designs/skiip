# Local Smoke Test

Read this when you need the local smoke test details from [Supabase Metrics API](../SUPABASE_METRICS_API.md).

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
