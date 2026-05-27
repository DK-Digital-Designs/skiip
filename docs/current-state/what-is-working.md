# What Is Working

Read this when you need the what is working details from [Current State](../CURRENT_STATE.md).

### Buyer

- shared email/password login
- buyer signup route
- authenticated checkout only
- cart to order creation
- Stripe Checkout redirect
- country-code based notification phone capture during checkout
- order tracker with live updates
- buyer order history view
- authenticated issue reporting from account, order history, tracking, and footer entry points

### Vendor

- seller login
- admin-created vendor onboarding for launch
- store lookup from authenticated seller
- product management
- kanban-style order queue with active, scheduled, and all-order filtering
- `paid -> preparing -> ready -> collected`
- cancellation path
- Stripe onboarding link generation
- authenticated issue reporting from the seller account menu

### Admin

- admin operations navigation across dashboard, orders, vendors, event setup, and settings
- read-only dashboard metrics and operational health overview
- issue queue counts and triage controls for buyer/vendor support requests
- recent order listing with refund and payment reconciliation actions in Admin Orders
- vendor performance summary alongside vendor management
- notification health summary
- launch-event public copy editing in Admin Event Setup
- checkout pause/resume control in Admin Settings
- edge-function mediated vendor store management

### Backend

- server-authoritative order creation
- Stripe webhook idempotency tracking
- inventory finalization on successful payment
- automatic refund on paid-order inventory failure
- payment failure recording
- payment reconciliation fields exposed in Admin Orders
- refund recording
- private support-request storage with admin-only read access and edge-function mediated submission/triage
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
