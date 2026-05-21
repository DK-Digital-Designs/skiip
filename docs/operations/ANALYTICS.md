# Analytics And Search Reporting

This document covers the product app analytics/search surface in this repository. Marketing-site analytics remain owned by the external `DK-Digital-Designs/skiip-marketing` repository.

## Current Implementation

The product app now has launch-level measurement for search, campaign traffic, buyer funnel behavior, and frontend performance:

- Vercel Web Analytics is mounted in [`App.jsx`](../../app/src/App.jsx).
- Vercel Speed Insights is mounted in [`App.jsx`](../../app/src/App.jsx).
- SKIIP campaign attribution and custom funnel events are handled in [`analytics.js`](../../app/src/lib/analytics.js).
- The root HTML includes production SEO metadata, Open Graph/Twitter metadata, canonical URL, favicon links, app manifest, and JSON-LD organization/site data.
- Static search files live in [`app/public/robots.txt`](../../app/public/robots.txt) and [`app/public/sitemap.xml`](../../app/public/sitemap.xml).

The implementation is intentionally lightweight. It is enough for launch reporting and campaign attribution, but it is not a full BI, cohort analysis, or multi-event analytics system.

## Activation Checklist

Before treating analytics data as launch-ready:

1. Confirm the production Vercel project has Web Analytics enabled.
2. Confirm the production Vercel project has Speed Insights enabled.
3. Deploy the product app from `app/` after the analytics package changes are included.
4. Visit the production app once and confirm a pageview appears in Vercel Web Analytics.
5. Use a tagged campaign URL and confirm the expected custom events appear with a `campaign` property.
6. Confirm Speed Insights starts receiving field data after real traffic. It may not be useful immediately on a cold or low-traffic deployment.
7. Verify the Google Search Console property for `https://www.skiip.co.uk/`.
8. Submit or refresh `https://www.skiip.co.uk/sitemap.xml` in Search Console.
9. Use URL Inspection on `https://www.skiip.co.uk/` after production deployment to confirm Google can crawl the current page.

## Campaign Links

Use UTM parameters for QR codes, posters, social posts, email links, and vendor-specific launch links.

Preferred format for hash-routed buyer links:

```text
https://www.skiip.co.uk/?utm_source=poster&utm_medium=qr&utm_campaign=sawft_launch&utm_content=burger_bliss#/order/vendor/<vendor-id>
```

Rules:

- put the query string before the `#` route when possible
- keep names lowercase and underscore-separated
- use `utm_source` for channel or placement owner, such as `poster`, `instagram`, `vendor`, or `email`
- use `utm_medium` for the delivery method, such as `qr`, `social`, `story`, or `link`
- use `utm_campaign` for the event or promotion, such as `sawft_launch`
- use `utm_content` for vendor, poster position, creative, or audience variant

The app also accepts UTM parameters inside the hash route, but links are easier to share and debug when the UTM query appears before `#`.

## Custom Events

The custom events are intentionally small and avoid personal data.

| Event | Trigger | Reporting Use |
| --- | --- | --- |
| `start_ordering_clicked` | Buyer clicks the landing-page start-ordering CTA. | Landing page intent. |
| `vendor_card_clicked` | Buyer selects a vendor card. | Vendor interest by campaign. |
| `vendor_filter_used` | Buyer filters or sorts vendor listings. | Discovery behavior. |
| `menu_item_added` | Buyer adds an item to the cart. | Menu engagement. |
| `checkout_started` | Buyer enters checkout from the menu. | Cart-to-checkout conversion. |
| `payment_started` | Buyer starts the checkout/payment submission. | Checkout intent. |
| `checkout_failed` | Checkout or payment setup fails before redirect. | Friction and failure triage. |
| `order_created` | Server order creation succeeds. | Order creation conversion. |
| `payment_redirected` | Buyer is sent to Stripe Checkout. | Stripe handoff count. |
| `checkout_completed` | Buyer returns from Stripe success to the tracker. | Directional successful checkout count. |
| `checkout_canceled` | Buyer returns from Stripe cancel to the tracker. | Payment abandonment. |
| `continue_payment_clicked` | Buyer retries or continues payment from tracking. | Recovery intent. |
| `order_cancel_clicked` | Buyer cancels from tracking where allowed. | Cancellation intent. |
| `signup_started` | Buyer submits signup details. | Signup funnel start. |
| `signup_completed` | Buyer signup succeeds. | Signup conversion. |
| `signup_failed` | Buyer signup fails. | Signup friction. |

Privacy rule:

- do not add customer names, emails, phone numbers, notes, order IDs, payment IDs, or full product/vendor records to analytics events
- order and payment truth remains in Supabase, Stripe, and the admin dashboard, not Vercel custom events
- `checkout_completed` is a client-side return signal, not final proof that the webhook finalized the order

## Client Reporting

For client-facing post-launch or post-event reporting, combine these sources:

| Client Question | Source |
| --- | --- |
| How many people reached the app? | Vercel Web Analytics visitors and pageviews. |
| Which QR codes or campaigns worked? | Vercel custom events grouped by `campaign`; campaign URL inventory. |
| Did users move through the ordering funnel? | Custom events from `start_ordering_clicked` through `payment_redirected` and `checkout_completed`. |
| Did the site feel fast on real devices? | Vercel Speed Insights and Core Web Vitals. |
| Did Google discover the site? | Google Search Console indexing, impressions, clicks, CTR, and average position. |
| How many real paid orders happened? | Supabase orders/admin dashboard plus Stripe, not Vercel analytics. |
| How much money moved and what was refunded? | Stripe dashboard plus SKIIP reconciliation/admin views. |

Recommended client dashboard screenshots:

- Vercel Web Analytics overview for visitors, pageviews, top paths, and referrers
- Vercel custom event breakdown for key funnel events
- Vercel Speed Insights overview after meaningful traffic
- Search Console Performance report for clicks, impressions, CTR, and average position
- Search Console Indexing/Sitemaps confirmation
- Admin dashboard order/payment summary for the authoritative operational result

## Data Caveats

- Browser analytics can undercount because of ad blockers, browser privacy controls, or failed client-side script loading.
- Search Console data usually lags and should not be judged immediately after a new deployment or first event.
- Speed Insights needs real field traffic before it becomes representative.
- Vercel analytics is directional product telemetry; do not use it for payout, refund, tax, or final revenue reporting.
- Marketing-site SEO and lead-capture data are separate unless the external marketing repository is connected to the same measurement plan.
