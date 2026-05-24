# Current Smoke Coverage

Read this when you need the current smoke coverage details from [Testing Data](../TESTING_DATA.md).

Current staging smoke scope:

- landing page CTA
- buyer entry/vendor chooser
- protected-route redirect to login
- buyer sign-in and buyer profile/order-history shell
- seller sign-in, vendor dashboard, and inventory shell
- admin sign-in, admin dashboard, and vendor-management shell
- failure output annotated as `auth`, `routing`, or `business-surface` in Playwright steps and expectation messages

Current non-scope:

- order creation
- Stripe checkout
- webhook-paid transition
- vendor status progression
- admin refund

Treat the current Playwright lane as auth and reachability smoke, not payment-path proof.
