# Docs Audit Report

Audit date: 2026-04-22

Note: this is a historical audit snapshot. Current implementation status should be read from `ARCHITECTURE.md`, `CURRENT_STATE.md`, `OPERATIONS.md`, and the ordered migrations.

## 2026-05-21 Addendum

The docs were rechecked against the search and analytics implementation on `staging` after PR #63 added SEO assets, Vercel Web Analytics, Speed Insights, UTM attribution, and custom buyer-funnel events.

Docs updated in this pass:

- `docs/operations/ANALYTICS.md` added as the source of truth for activation, UTM links, event taxonomy, Search Console checks, client reporting, and data caveats
- `docs/README.md` now links the analytics/search reporting runbook
- `docs/CURRENT_STATE.md` now records the implemented SEO/analytics/search surface and the remaining external provider checks
- `docs/ARCHITECTURE.md` now documents Vercel Analytics, Speed Insights, UTM handling, and the client-side telemetry boundary
- `docs/launch/DEPLOYMENT.md`, `docs/launch/ENVIRONMENT_MATRIX.md`, and `docs/launch/LAUNCH_CHECKLIST.md` now include Vercel Analytics, Speed Insights, Search Console, sitemap, and tagged smoke-link checks
- `docs/operations/OPERATIONS.md` now includes daily analytics/search checks and first-event reporting guidance
- `docs/launch/CLIENT_LAUNCH_INPUTS_REQUIRED_MAY_2026.md` now separates launch-level analytics reporting from future advanced analytics scope
- `docs/ROADMAP.md` now treats advanced reporting and post-event automation as future scope rather than implying no measurement exists
- archived scope reviews and phase reports now distinguish current launch telemetry from future advanced analytics
- `PROGRESS-2.md` now captures the May 21 search/analytics work and remaining external checks

Current sliding or external items after this audit:

- Vercel Web Analytics and Speed Insights still require hosted project enablement/verification outside the repo
- Google Search Console ownership, sitemap submission, URL Inspection, and reporting access are external account tasks
- Speed Insights and Search Console reporting will lag until real traffic and crawl data exist
- notification retry scheduling, explicit hosted `ALLOWED_ORIGINS`, `seed.sql`, full live Stripe rehearsal, production Sentry confirmation, and broader payment-path test coverage remain open from previous audits
- advanced BI, cohort analytics, multi-event reporting, and automated post-event report generation remain future scope

Scope reviewed:

- [ARCHITECTURE.md](../ARCHITECTURE.md)
- [BRANCHING_WORKFLOW.md](BRANCHING_WORKFLOW.md)
- [CURRENT_STATE.md](../CURRENT_STATE.md)
- [DEPLOYMENT.md](../launch/DEPLOYMENT.md)
- [GITHUB_SETUP.md](GITHUB_SETUP.md)
- [LAUNCH_CHECKLIST.md](../launch/LAUNCH_CHECKLIST.md)
- [NOTIFICATIONS.md](../operations/NOTIFICATIONS.md)
- [OPERATIONS.md](../operations/OPERATIONS.md)
- [PR_REVIEW.md](PR_REVIEW.md)
- [README.md](../README.md)
- [ROADMAP.md](../ROADMAP.md)
- [SECRETS.md](../launch/SECRETS.md)
- [TESTING_DATA.md](../operations/TESTING_DATA.md)

## Highest-Risk Mismatches Fixed

- `VITE_VENDOR_INVITE_CODE` is used by the product app but was undocumented.
- `VITE_STRIPE_PUBLIC_KEY` was documented as required even though the current app does not read it.
- `ALLOWED_ORIGINS` fallback behavior in code included an undocumented preview domain when the env var is missing.
- notification retries relied on `notification-dispatch`, but no in-repo scheduler was documented because none exists.
- `supabase/config.toml` references `supabase/seed.sql`, but that file is not committed.
- signup UI implies email verification while repo auth config disables confirmations.
- admin vendor management performs direct browser-side store writes and hard deletes, which had not been called out clearly.
- the separate marketing surface was not backend-integrated and needed to be treated outside the product app's operational flow.

## Per-Document Review

## `docs/ARCHITECTURE.md`

- Status: partially outdated
- Summary of changes: updated runtime architecture to document HashRouter usage, invite-code vendor signup, admin direct store writes, GBP/GB Stripe constraints, notification outbox behavior, the separate marketing surface boundary, legacy schema snapshots, and current legacy compatibility code.
- Key mismatches found: the old version did not clearly separate current production paths from legacy files and placeholders, and it did not document the hardcoded origin fallback or the non-authoritative admin vendor operations.
- High-risk documentation gaps: missing vendor invite-code path, missing note that `whatsapp-notify` is legacy compatibility code, missing note that the marketing surface is not operational backend capture.
- Assumptions: none beyond repository code.

## `docs/delivery/BRANCHING_WORKFLOW.md`

- Status: accurate
- Summary of changes: no substantive content changes were required.
- Key mismatches found: none material. The file already distinguished intended workflow from GitHub enforcement.
- High-risk documentation gaps: none material in branch-role definitions.
- Assumptions: none.

## `docs/CURRENT_STATE.md`

- Status: partially outdated
- Summary of changes: clarified the current working baseline, added the signup confirmation mismatch, documented direct admin vendor writes, documented lack of in-repo notification retry scheduling, called out missing seed/reset support, and separated active statuses from legacy schema remnants.
- Key mismatches found: the old version understated current operational weaknesses around environment drift, test/reset drift, and admin browser-side writes.
- High-risk documentation gaps: missing note that signup UX and auth config disagree; missing note that notification recovery is not scheduled; missing note that the separate marketing surface is not operational.
- Assumptions: treated repo config as the source of truth for auth confirmation behavior because hosted Supabase settings are not directly visible from the repo.

## `docs/launch/DEPLOYMENT.md`

- Status: partially outdated
- Summary of changes: corrected frontend env requirements, added `VITE_VENDOR_INVITE_CODE`, downgraded `VITE_STRIPE_PUBLIC_KEY` from required to unused/legacy, documented explicit origin fallback behavior, added missing seed/reset caveat, clarified current Stripe event handling and GB-only payment assumptions, and documented the lack of an in-repo scheduler for notification retries.
- Key mismatches found: old doc said `VITE_STRIPE_PUBLIC_KEY` was required, did not document the fallback origin list, and implied notification backlog sweeping could be scheduled without noting that no scheduler exists in the repo.
- High-risk documentation gaps: missing `VITE_VENDOR_INVITE_CODE`; missing warning about hardcoded preview-domain fallback; missing warning that `db reset` references a non-committed seed file.
- Assumptions: Vercel project wiring outside the repo was treated as external configuration; only `app/vercel.json` and repository workflows were used as repo-local deployment truth.

## `docs/delivery/GITHUB_SETUP.md`

- Status: partially outdated
- Summary of changes: re-verified workflows, labels, milestones, open issues, project existence, and PR state; updated the PR snapshot so it reflects 2026-04-22 rather than older open/merged assumptions; added a caution that historical PR descriptions are not runtime truth.
- Key mismatches found: PR #21 was no longer open, and historical PR descriptions such as #13 no longer matched the checked-in codebase.
- High-risk documentation gaps: using historical PR bodies as architecture truth would be misleading, especially around notifications.
- Assumptions: project-board field conventions were retained as documented conventions because repo-local tools verified project existence but did not provide the full field schema directly.

## `docs/launch/LAUNCH_CHECKLIST.md`

- Status: partially outdated
- Summary of changes: added explicit gates for `ALLOWED_ORIGINS`, notification retry recovery, signup-policy alignment, vendor onboarding path choice, and marketing-surface non-operational form capture.
- Key mismatches found: the previous checklist did not reflect the current signup-policy mismatch, undocumented origin fallback, or the fact that notification retry sweeping requires an external/manual path.
- High-risk documentation gaps: missing gate for Stripe-onboarded seller rehearsal; missing gate for explicit notification-retry ownership.
- Assumptions: none beyond repository code and current docs.

## `docs/operations/NOTIFICATIONS.md`

- Status: partially outdated
- Summary of changes: documented the current queue/outbox states, clarified that SMS is not a live channel, explicitly called out the missing in-repo scheduler for retry sweeps, and repositioned `whatsapp-notify` as legacy compatibility code rather than the intended main path.
- Key mismatches found: the old doc implied manual retry sweeping existed conceptually but did not make clear that no scheduler is defined in the repo; it also understated the legacy status of `whatsapp-notify`.
- High-risk documentation gaps: missing retry-scheduler ownership; missing note that `sms` exists only as a schema/type placeholder; missing legacy env aliases still accepted by code.
- Assumptions: none beyond repository code.

## `docs/operations/OPERATIONS.md`

- Status: partially outdated
- Summary of changes: added direct admin store-write caveats, clarified legacy order statuses versus active statuses, documented notification-retry operational ownership, and added seeded-seller Stripe-onboarding limitations.
- Key mismatches found: the old doc did not clearly warn operators that admin vendor actions are direct browser-side writes and that notification recovery requires explicit human/system ownership.
- High-risk documentation gaps: missing hard-delete warning for stores; missing note that seeded vendor fixtures are not payment-ready by default.
- Assumptions: none beyond repository code.

## `docs/delivery/PR_REVIEW.md`

- Status: accurate
- Summary of changes: no substantive content changes were required.
- Key mismatches found: none material.
- High-risk documentation gaps: none material for current repository PR review tooling.
- Assumptions: none.

## `docs/README.md`

- Status: partially outdated
- Summary of changes: added the audit report, clarified that the marketing surface is separate from the product app, and reiterated that migrations are the schema source of truth.
- Key mismatches found: the old index did not point readers at the audit report and did not clearly warn about the marketing-surface/backend separation.
- High-risk documentation gaps: missing warning that legacy schema snapshots are not authoritative.
- Assumptions: none.

## `docs/ROADMAP.md`

- Status: heavily outdated
- Summary of changes: removed items that are already implemented or already documented elsewhere, and rewrote the roadmap around real remaining gaps: auth posture, RLS audit, origin/env hygiene, notification retry ownership, payment-path rehearsal, vendor onboarding decisions, and external marketing-repo ownership.
- Key mismatches found: the previous roadmap still listed already-done work such as failed-payment handling, secret inventory work, notification outbox basics, launch checklist creation, and incident/runbook creation.
- High-risk documentation gaps: without rewrite, the roadmap would encourage duplicate work and mask the real unresolved issues.
- Assumptions: roadmap priority ordering is inferred from current repo risk profile and open GitHub launch-readiness issues.

## `docs/launch/SECRETS.md`

- Status: partially outdated
- Summary of changes: added missing env vars and secret caveats, documented that `VITE_STRIPE_PUBLIC_KEY` is currently unused, added local-script-only service-role env usage, documented function-side `SENTRY_DSN`, and called out the `ALLOWED_ORIGINS` fallback behavior and incomplete example files.
- Key mismatches found: the previous inventory missed `VITE_VENDOR_INVITE_CODE`, overstated `VITE_STRIPE_PUBLIC_KEY`, and did not mention that `ALLOWED_ORIGINS` falls back to a hardcoded list in code.
- High-risk documentation gaps: missing vendor invite code; missing explicit note that example files are incomplete; missing note that the seed file referenced by config is absent.
- Assumptions: repo config was treated as the best visible source of truth for auth confirmation settings and function env usage.

## `docs/operations/TESTING_DATA.md`

- Status: partially outdated
- Summary of changes: marked the 2026 accounts as preferred fixtures, added the Stripe-onboarding limitation on seeded sellers, clarified Playwright local behavior, and documented the missing `seed.sql` caveat affecting reset assumptions.
- Key mismatches found: the previous file implied shared seeded sellers were generally ready for operational testing, but the seed script does not provision Stripe onboarding.
- High-risk documentation gaps: missing note that payment-path tests require a Stripe-onboarded seller; missing note that local `db reset` is not guaranteed by the checked-in repo state.
- Assumptions: current preferred shared accounts were taken from the active seeding script in `app/scripts/seed-test-users.js`.

## Remaining Ambiguities

- The repo does not expose Vercel project-level settings beyond `app/vercel.json`, so Vercel dashboard wiring was treated as external operational state.
- GitHub Project field conventions were partially inferred from the existing doc because repo-local verification confirmed project existence, labels, milestones, issues, and PRs, but not the full field schema directly.
- Hosted Supabase project settings were inferred from checked-in config and code where the repo does not expose remote dashboard-only values.

## Overall Result

The docs now match the current checked-in codebase, configuration files, migrations, workflows, and the currently verified GitHub-side setup substantially better than before.

The main remaining risks are product and operational gaps in the codebase itself, not stale statements in the reviewed docs.
