# Daily Operational Checks

Read this when you need the daily operational checks details from [Operations](../OPERATIONS.md).

Review:

- recent orders
- failed payments
- failed notifications
- campaign traffic and buyer-funnel custom events in Vercel Analytics
- frontend performance trends in Vercel Speed Insights after real traffic
- Search Console clicks, impressions, CTR, average position, indexing, and sitemap status after public launches
- Supabase database health through the external Metrics API collector if configured
- webhook processing errors
- unexpected inventory changes
- refund activity
- Stripe reconciliation fields on paid/refunded orders
- whether any notification backlog is accumulating without a retry sweep

Useful tables:

- `orders`
- `order_items`
- `notification_logs`
- `notification_webhook_events`
- `audit_logs`
- `stripe_processed_events`

Weekday staging smoke:

- review the latest staging smoke run for public-route and sign-in regressions
- if it fails, treat it as a deployment/auth/config warning first, not as proof of a payment-path incident
