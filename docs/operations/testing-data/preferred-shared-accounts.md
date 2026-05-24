# Preferred Shared Accounts

Read this when you need the preferred shared accounts details from [Testing Data](../TESTING_DATA.md).

These are the current preferred repo-supported shared accounts because they match the active seeding script in [`app/scripts/seed-test-users.js`](../../../app/scripts/seed-test-users.js).

| Role | Email | Password | Setup Status |
| :--- | :--- | :--- | :--- |
| Super Admin | `admin2026@example.com` | `password2026` | Confirmed |
| Vendor (Skiip Test Kitchen) | `vendor2026@example.com` | `password2026` | Confirmed, store created |
| Standard Buyer | `buyer2026@example.com` | `password2026` | Confirmed |

Important current limitation:

- the seed script creates the vendor user and store
- the seed script creates one active product for the vendor inventory smoke path
- it does not create a Stripe Connect account or mark `stripe_onboarding_complete = true`
- it does not and cannot complete Stripe Connect onboarding, because that requires the vendor/client to finish the hosted Stripe account flow

Do not assume the seeded seller can complete payment-path tests until onboarding is completed in the target environment.
The authenticated seller smoke check is intentionally limited to sign-in, dashboard reachability, and inventory access; it is not proof that the vendor can accept payments.
