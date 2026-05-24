# Fixture Strategy

Read this when you need the fixture strategy details from [Testing Data](../TESTING_DATA.md).

- Keep one stable buyer, one seller, and one admin account per shared environment.
- Keep the seller account attached to a known store that is safe to use for smoke checks.
- Use a separately verified Stripe-onboarded seller if payment-path rehearsal is required.
- Treat smoke accounts as operational fixtures, not ad hoc developer accounts.
- Use dedicated CI-only staging buyer, seller, and admin accounts for the staging smoke workflow.
- Do not reuse those dedicated CI accounts for ad hoc manual testing.
