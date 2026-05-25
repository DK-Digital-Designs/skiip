# Analytics And Client Reporting

Read this when you need the analytics and client reporting details from [Operations](../OPERATIONS.md).

Use [Analytics And Search Reporting](../ANALYTICS.md) as the source of truth for event names, UTM format, Search Console checks, Vercel Analytics, Speed Insights, and client-facing reporting.

Operational reporting split:

- Vercel Analytics is useful for directional traffic, campaign, and funnel reporting.
- Vercel Speed Insights is useful for frontend performance and Core Web Vitals after real traffic.
- Google Search Console is useful for indexing, impressions, clicks, CTR, and average position.
- Supabase Metrics API is useful for external database CPU, IO, WAL, connection, and query-health alerting when a Prometheus-compatible collector is configured.
- Supabase, Stripe, and the admin operations portal remain authoritative for orders, payments, refunds, vendor totals, and reconciliation.

For a first-event report, capture:

- total visitors/pageviews and top referrers from Vercel Analytics
- campaign performance from custom events grouped by `campaign`
- funnel counts from `start_ordering_clicked`, `vendor_card_clicked`, `menu_item_added`, `checkout_started`, `payment_redirected`, and `checkout_completed`
- real paid-order counts, refunds, and payment totals from Supabase/admin/Stripe
- Speed Insights data only once enough production traffic has been collected
- Search Console screenshots only after Google has had time to crawl and report data
