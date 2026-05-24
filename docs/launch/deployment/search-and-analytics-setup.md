# Search And Analytics Setup

Read this when you need the search and analytics setup details from [Deployment](../DEPLOYMENT.md).

Product-app search files are deployed from [`app/public`](../../../app/public):

- `robots.txt`
- `sitemap.xml`
- favicon and app icon assets
- social preview image
- app manifest

The root HTML metadata is in [`app/index.html`](../../../app/index.html).

Production activation checks:

1. Confirm the canonical production domain resolves to the Vercel deployment.
2. Confirm `https://www.skiip.co.uk/robots.txt` and `https://www.skiip.co.uk/sitemap.xml` are reachable after deploy.
3. Confirm the favicon and social preview image load from the production domain.
4. Confirm Vercel Web Analytics records a production pageview.
5. Confirm Vercel custom events appear after testing a campaign-tagged buyer flow.
6. Confirm Vercel Speed Insights begins receiving field data after real traffic.
7. Confirm Google Search Console ownership for the production domain.
8. Submit or refresh the sitemap in Search Console.
9. Use Search Console URL Inspection on the root URL after deployment.

Campaign links should keep UTM parameters before the hash route where possible:

```text
https://www.skiip.co.uk/?utm_source=poster&utm_medium=qr&utm_campaign=sawft_launch&utm_content=burger_bliss#/order/vendor/<vendor-id>
```

See [Analytics And Search Reporting](../../operations/ANALYTICS.md) for the event taxonomy and client-reporting workflow.
