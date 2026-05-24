# Playwright Smoke Inputs

Read this when you need the playwright smoke inputs details from [Testing Data](../TESTING_DATA.md).

The smoke suite in [`app/tests/e2e/smoke.spec.js`](../../../app/tests/e2e/smoke.spec.js) supports two layers:

- public smoke checks that always run
- authenticated smoke checks that activate only when role credentials are present

Environment variables used by the suite:

- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_BUYER_EMAIL`
- `PLAYWRIGHT_BUYER_PASSWORD`
- `PLAYWRIGHT_SELLER_EMAIL`
- `PLAYWRIGHT_SELLER_PASSWORD`
- `PLAYWRIGHT_ADMIN_EMAIL`
- `PLAYWRIGHT_ADMIN_PASSWORD`

Current local behavior from [`app/playwright.config.js`](../../../app/playwright.config.js):

- if `PLAYWRIGHT_BASE_URL` is unset, Playwright starts `npm run preview -- --host 127.0.0.1 --port 4173`
- local smoke then runs against `http://127.0.0.1:4173`

If the credential pairs are not set, the authenticated tests are skipped automatically unless `PLAYWRIGHT_REQUIRE_AUTH_CREDENTIALS=true`.
