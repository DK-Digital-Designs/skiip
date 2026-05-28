# Refund Handling

Read this when you need the refund handling details from [Operations](../OPERATIONS.md).

Current refund path:

- initiated from Admin Orders or from a linked case in Admin Issues
- sent through `stripe-refund`
- written back to `orders`
- inventory is restocked when appropriate
- tracked in `audit_logs`
- followed by transactional notification queuing
- destination-charge refunds reverse the vendor transfer and refund the Connect application fee allocation

Paid vendor cancellations:

- a vendor cancellation of a paid order creates a high-priority case in Admin Issues
- cancellation restocks inventory where appropriate, but is not a completed refund until an admin refund succeeds
- monitor the Issues queue during the pilot and record the refund decision in internal case notes

For the first event, the buyer service fee and Connect application fee are both GBP 0. Full refunds still reverse the destination-charge transfer path, and Stripe processing-fee handling remains subject to Stripe's actual fee behavior.

Refunds should be treated as financial operations, not simple UI status changes.
