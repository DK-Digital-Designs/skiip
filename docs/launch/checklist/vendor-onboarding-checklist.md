# Vendor Onboarding Checklist

Read this when you need the vendor onboarding checklist details from [Launch Checklist](../LAUNCH_CHECKLIST.md).

Before a real vendor can accept orders:

1. Decide which onboarding path is being used:
   admin-created seller/store for the May 2026 launch.
2. Confirm the vendor has a valid `user_profiles` row with role `seller`.
3. Confirm the vendor has a valid `stores` row.
4. Confirm Stripe onboarding is complete and payout details are submitted.
5. Confirm `stripe_onboarding_complete = true` for the store.
6. Confirm menu items, pricing, and inventory are visible in the buyer flow.
7. Place one test order and verify it reaches the vendor dashboard.
8. Verify the vendor can move the order through `paid -> preparing -> ready -> collected`.
9. Verify admin refund access for that order path.
10. Verify vendor create/status/archive actions are routed through `admin-store` and visible in `audit_logs`.
11. Share the operator support contact and escalation path with the vendor.
