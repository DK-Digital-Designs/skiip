# Refund Handling

Read this when you need the refund handling details from [Operations](../OPERATIONS.md).

Current refund path:

- initiated by admin UI
- sent through `stripe-refund`
- written back to `orders`
- inventory is restocked when appropriate
- tracked in `audit_logs`
- followed by transactional notification queuing

For the test event, full refunds include item total, tips, and the GBP 2.00 service fee. A future partial-refund policy can decide whether service fees should ever be retained on refunds.

Refunds should be treated as financial operations, not simple UI status changes.
