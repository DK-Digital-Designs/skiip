# Post-Deploy Verification

Read this when you need the post-deploy verification details from [Deployment](../DEPLOYMENT.md).

After any meaningful backend or frontend deploy:

1. confirm the frontend is pointed at the intended Supabase project
2. confirm `ALLOWED_ORIGINS` is set explicitly for that environment
3. confirm Web Analytics and Speed Insights are enabled on the matching Vercel project
4. sign in as a buyer
5. open a tagged URL such as `/?utm_source=smoke&utm_medium=manual&utm_campaign=deploy_check#/order`
6. create a test order and confirm its service fee is GBP 1.50
7. complete Stripe Checkout in test mode
8. confirm the order flips to `paid`
9. confirm vendor can move the order through statuses
10. confirm admin dashboard loads metrics
11. confirm Admin Orders loads payment detail showing the unchanged application-fee calculation and the refund/reconciliation controls operate correctly on eligible test orders
12. confirm Admin Settings can pause and resume checkout in the safe test path and records the reason
13. confirm Admin Event Setup saves approved test copy and returns it to the intended live wording after verification
14. confirm the buyer can complete checkout without opting into WhatsApp
15. submit a buyer and vendor Report an issue case, confirm Admin Issues can triage them, and confirm a paid vendor cancellation creates a high-priority review case
16. confirm a full linked-order refund reverses the Connect transfer/application fee allocation and does not depend on case submission alone
17. confirm Resend emails and, when enabled and opted in, Twilio WhatsApp updates
18. confirm `notification_logs` records queued, sent, delivered, and failed states with timestamps
19. confirm a WhatsApp test is not treated as passed until a Twilio SID and stored delivery callback exist
20. confirm Vercel Analytics shows the pageview and expected funnel events for the smoke path
21. confirm Search Console sitemap/indexing checks after production deploys that affect search metadata
22. if external database-health monitoring is configured, confirm the Supabase Metrics API scrape target is healthy
23. if self-serve signup is in scope for the environment, verify actual signup behavior matches the chosen confirmation policy
24. request and redeem a password recovery email using a test account, then sign in with the new password
