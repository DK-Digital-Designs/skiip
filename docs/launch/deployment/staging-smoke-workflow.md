# Staging Smoke Workflow

Read this when you need the staging smoke workflow details from [Deployment](../DEPLOYMENT.md).

The deployed auth smoke lane lives in [staging-smoke.yml](../../../.github/workflows/staging-smoke.yml).

Current purpose:

- validate that the deployed staging frontend is reachable
- validate public routing
- validate buyer, seller, and admin sign-in surfaces

Current limit:

- it is not the full payment-path rehearsal
- it does not create orders, open Stripe Checkout, verify webhook transitions, or execute refunds

Use it as an early warning for deployment drift and auth/config regressions, not as proof that the full launch-critical payment loop is healthy.
