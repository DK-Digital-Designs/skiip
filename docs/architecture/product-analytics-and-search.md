# Product Analytics And Search

Read this when you need the product analytics and search details from [SKIIP Architecture](../ARCHITECTURE.md).

The product app has launch-level SEO and analytics instrumentation.

Search-facing assets:

- root metadata, canonical URL, social sharing metadata, JSON-LD, favicon/app icons, and manifest live in [`app/index.html`](../../app/index.html)
- crawl and sitemap files live in [`app/public/robots.txt`](../../app/public/robots.txt) and [`app/public/sitemap.xml`](../../app/public/sitemap.xml)

Analytics runtime:

- [`App.jsx`](../../app/src/App.jsx) mounts Vercel Web Analytics and Speed Insights
- [`analytics.js`](../../app/src/lib/analytics.js) captures UTM attribution from page or hash-route query params into session storage
- custom events are limited to small, non-PII properties and a campaign label
- one-shot checkout return events are deduplicated per browser session

Current event coverage includes landing-page intent, vendor selection/filtering, menu item adds, checkout start, payment start, checkout/order failures, order creation, Stripe redirect, Stripe success/cancel returns, payment retry intent, buyer cancellation intent, and buyer signup start/success/failure.

Operational caveat:

- Vercel analytics is directional client-side telemetry only
- Supabase and Stripe remain the sources of truth for order, payment, refund, and revenue reporting
- Google Search Console verification and sitemap submission are external account tasks, not repo state
