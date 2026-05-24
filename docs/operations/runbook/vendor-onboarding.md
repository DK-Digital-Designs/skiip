# Vendor Onboarding

Read this when you need the vendor onboarding details from [Operations](../OPERATIONS.md).

Before a vendor can accept orders:

1. create or confirm the vendor through admin tooling
2. confirm the vendor account exists
3. confirm the vendor has a `stores` row
4. confirm Stripe onboarding is completed
5. confirm `stripe_onboarding_complete` is true

Important test-fixture note:

- the repo seeding scripts create seller accounts and stores
- they do not complete Stripe onboarding
