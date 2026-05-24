# Post-Deploy Verification

Read this when you need the post-deploy verification details from [Deployment](../DEPLOYMENT.md).

After any meaningful backend or frontend deploy:

1. confirm the frontend is pointed at the intended Supabase project
2. confirm `ALLOWED_ORIGINS` is set explicitly for that environment
3. confirm Web Analytics and Speed Insights are enabled on the matching Vercel project
4. sign in as a buyer
5. open a tagged URL such as `/?utm_source=smoke&utm_medium=manual&utm_campaign=deploy_check#/order`
6. create a test order
7. complete Stripe Checkout in test mode
8. confirm the order flips to `paid`
9. confirm vendor can move the order through statuses
10. confirm admin dashboard loads metrics
11. confirm admin refund flow still works
12. confirm the buyer can complete checkout without opting into WhatsApp
13. confirm Resend emails and, when enabled and opted in, Twilio WhatsApp updates
14. confirm `notification_logs` records queued, sent, delivered, and failed states with timestamps
15. confirm Vercel Analytics shows the pageview and expected funnel events for the smoke path
16. confirm Search Console sitemap/indexing checks after production deploys that affect search metadata
17. if external database-health monitoring is configured, confirm the Supabase Metrics API scrape target is healthy
18. if self-serve signup is in scope for the environment, verify actual signup behavior matches the chosen confirmation policy
