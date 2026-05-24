# Environment Model

Read this when you need the environment model details from [Deployment](../DEPLOYMENT.md).

SKIIP uses multiple deployment surfaces:

- Vercel for the React product app in `app/`
- Supabase for database, auth, realtime, storage, and edge functions
- Stripe for checkout, Connect onboarding, refunds, and webhooks
- an external marketing repo: [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing)
- optional notification providers: Resend for email and Twilio for WhatsApp

Current deployment split in the repo:

- the product app is the only deployable surface in this repository
- the marketing site is maintained outside this repository
- the product app's Vercel deployment is configured outside the repo, with repo-side behavior defined mainly by [`app/vercel.json`](../../../app/vercel.json)

Current recommendation:

- keep separate Supabase and Stripe environments for staging and production
- keep Vercel env vars aligned to the matching Supabase project
- enable and verify Vercel Web Analytics and Speed Insights on the hosted Vercel project
- configure Supabase Metrics API scraping only in an external collector if database-health monitoring is expected
- keep `ALLOWED_ORIGINS` explicit per environment
- treat `ALLOWED_ORIGINS` as both the CORS allow-list and the allow-list for checkout/onboarding redirect origins
