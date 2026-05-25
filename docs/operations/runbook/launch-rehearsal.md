# Launch Rehearsal

Read this when you need the launch rehearsal details from [Operations](../OPERATIONS.md).

Before a real launch or high-confidence release:

1. create or confirm one buyer, one seller, and one admin account
2. verify the seller has completed Stripe onboarding
3. place a Stripe test-mode order
4. verify the webhook changes the order to `paid`
5. verify Admin Orders shows the Stripe payment intent, charge, platform fee, Stripe fee, and vendor net
6. verify the vendor can move to `preparing`, `ready`, and `collected`
7. verify admin can refund a paid order from Admin Orders
8. verify audit and notification records are written
9. if notification retry recovery matters, verify who or what will invoke `notification-dispatch`
