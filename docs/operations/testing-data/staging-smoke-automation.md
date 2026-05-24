# Staging Smoke Automation

Read this when you need the staging smoke automation details from [Testing Data](../TESTING_DATA.md).

The deployed staging smoke workflow lives in [staging-smoke.yml](../../../.github/workflows/staging-smoke.yml).

Trigger modes:

- manual via GitHub Actions `workflow_dispatch`
- weekday daily at `06:00 UTC`

Manual dispatch behavior:

- `base_url` is optional
- if omitted, the workflow uses the `PLAYWRIGHT_BASE_URL` secret from the GitHub `staging` environment

Required GitHub `staging` environment secrets:

- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_BUYER_EMAIL`
- `PLAYWRIGHT_BUYER_PASSWORD`
- `PLAYWRIGHT_SELLER_EMAIL`
- `PLAYWRIGHT_SELLER_PASSWORD`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`
