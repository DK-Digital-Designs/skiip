# GitHub Actions

Read this when you need the github actions details from [GitHub Setup](../GITHUB_SETUP.md).

Current workflows in [`.github/workflows`](../../../.github/workflows):

### 1. App Quality Checks

File: [app-quality.yml](../../../.github/workflows/app-quality.yml)

Purpose:

- run deterministic checks for app and Supabase changes

Trigger:

- `push` when `app/**`, `supabase/**`, or the workflow file changes
- `pull_request` when `app/**` or `supabase/**` changes

Checks:

- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`

### 2. Staging Smoke Checks

File: [staging-smoke.yml](../../../.github/workflows/staging-smoke.yml)

Purpose:

- run scheduled and on-demand Playwright smoke checks against staging

Trigger:

- manual `workflow_dispatch`
- scheduled weekdays at `06:00 UTC`

Behavior:

- uses the `staging` environment
- runs Playwright against `PLAYWRIGHT_BASE_URL`
- uploads HTML report and test artifacts on failure
