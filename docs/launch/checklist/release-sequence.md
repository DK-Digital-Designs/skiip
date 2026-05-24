# Release Sequence

Read this when you need the release sequence details from [Launch Checklist](../LAUNCH_CHECKLIST.md).

1. Freeze unrelated changes and identify the exact commit being deployed.
2. Confirm the target environment's frontend vars, Supabase secrets, Stripe account, and webhook config.
3. Confirm the notification provider setup in [Notifications](../../operations/NOTIFICATIONS.md) is complete for the target environment.
4. Confirm `ALLOWED_ORIGINS` is set explicitly for the target environment.
5. Confirm migrations are complete and no manual production-only SQL is pending.
6. Deploy database migrations.
7. Deploy Supabase edge functions.
8. Deploy the frontend.
9. Run `npm run test:e2e` against the target with `PLAYWRIGHT_BASE_URL` set.
10. Run one campaign-tagged buyer smoke link and confirm Vercel Analytics receives the pageview and expected custom events.
11. Confirm Search Console sitemap/URL checks after production deploys that affect search metadata.
12. Confirm the Supabase Metrics API collector is scraping the target environment if external database-health monitoring is part of the launch posture.
13. Run one manual operator rehearsal for the highest-risk flow if payments, auth, onboarding, or notifications changed. Payment rehearsals must use Stripe test mode before the May 2026 launch gate.
14. Only then open traffic or announce the release.
