# Release Discipline

Read this when you need the release discipline details from [Deployment](../DEPLOYMENT.md).

Before any staging or production release:

1. confirm all live schema changes exist in [`supabase/migrations`](../../../supabase/migrations)
2. confirm no deployable behavior still depends on legacy schema snapshot files
3. confirm no production-only manual SQL is being relied on
4. sync frontend env vars and Supabase secrets for the same environment pair
5. set `ALLOWED_ORIGINS` explicitly for the target environment
6. confirm Vercel Analytics and Speed Insights are enabled for the target deployment
7. confirm Supabase Metrics API scraping and alert routing if external database-health monitoring is expected
8. deploy migrations before or alongside dependent function changes
9. run the Playwright smoke suite locally or against the deployed target
10. run one manual payment-path rehearsal when payments, auth, onboarding, or notifications changed
11. if notification retry recovery matters in that environment, confirm who or what will call `notification-dispatch`
12. capture any emergency manual fix as a committed migration immediately afterward
