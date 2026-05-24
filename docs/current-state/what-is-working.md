# What Is Working

Read this when you need the what is working details from [Current State](../CURRENT_STATE.md).

### Buyer

- shared email/password login
- buyer signup route
- authenticated checkout only
- cart to order creation
- Stripe Checkout redirect
- order tracker with live updates
- buyer order history view

### Vendor

- seller login
- admin-created vendor onboarding for launch
- store lookup from authenticated seller
- product management
- kanban-style order queue with active, scheduled, and all-order filtering
- `paid -> preparing -> ready -> collected`
- cancellation path
- Stripe onboarding link generation

### Admin

- admin dashboard metrics RPC
- recent order listing
- vendor performance summary
- notification health summary
- refund actions
- edge-function mediated vendor store management

### Backend

- server-authoritative order creation
- Stripe webhook idempotency tracking
- inventory finalization on successful payment
- automatic refund on paid-order inventory failure
- payment failure recording
- payment reconciliation fields exposed in the admin recent-orders view
- refund recording
- audit logging for key order and payment events
- user profile reconciliation trigger/backfill support
- queue-backed notification dispatch with delivery webhooks
- launch RLS access matrix in [RLS Access Matrix](../reference/RLS_ACCESS_MATRIX.md)

### Analytics and search

- production SEO metadata, favicon/app icons, Open Graph/Twitter tags, canonical URL, app manifest, JSON-LD, robots file, and sitemap in the product app
- Vercel Web Analytics and Speed Insights mounted in the React app
- UTM campaign attribution stored in browser session storage for the current visit
- custom buyer-funnel events for landing intent, vendor selection, menu engagement, checkout, Stripe return, cancellation, retry, and buyer signup
- analytics event helpers covered by Vitest
- operations guidance in [Analytics And Search Reporting](../operations/ANALYTICS.md)
