# Launch Rehearsal

Read this when you need the launch rehearsal details from [Operations](../OPERATIONS.md).

Before a real launch or high-confidence release:

1. create or confirm one buyer, one seller, and one admin account
2. verify the seller has completed Stripe onboarding
3. place a Stripe test-mode order
4. verify the webhook changes the order to `paid`
5. verify the new order has a GBP 0 service fee and GBP 0 Connect application fee, while Admin Orders still shows the Stripe payment intent, charge, actual Stripe fee, and vendor net
6. verify the vendor can move to `preparing`, `ready`, and `collected`
7. cancel one already-paid order as the vendor and verify a high-priority Admin Issues refund-review case is created without automatically marking the order refunded
8. verify admin can refund a paid order from Admin Orders or its linked case and the destination-charge fee/transfer allocation is reversed
9. submit a buyer issue and a vendor issue, then verify Admin Issues triage status, priority, notes, and audit logging
10. verify audit and notification records are written
11. confirm connected-account payout schedule, pending requirements, and available manual/Instant Payout options in Stripe before stating settlement timing
12. if notification retry recovery matters, verify who or what will invoke `notification-dispatch`
