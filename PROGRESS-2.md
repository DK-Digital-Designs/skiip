# Progress Documentation Phase 5+ (April 14th - Present)

| Actor | Time | Date | Description |
| :--- | :--- | :--- | :--- |
| Dean Gibson | ~1.5 hours | 2026/04/14 | Documentation restructuring and initial migration work. Captured initial project progress and updated environment tracking rules. |
| Dean Gibson | ~2.0 hours | 2026/04/15 | Backend security hardening for Edge Functions. Enabled auth header passing and adjusted gateway JWT checks for protected functions. |
| Dean Gibson | ~5.0 hours | 2026/04/16 | Comprehensive documentation overhaul and launch hardening. Finalized Phase 1-4 progress logs, expanded roadmap, established staging smoke test workflows, and hardened payment checkout tracking. |
| Dean Gibson | ~3.0 hours | 2026/04/17 | Notification system enhancement. Restored Twilio WhatsApp capabilities, expanded Resend email coverage, and aligned phone handling with Meta Cloud API standards. |
| Dean Gibson | ~1.0 hour | 2026/04/20 | Communication and administrative maintenance. Monitored email and WhatsApp delivery logs and confirmed notification delivery state. |
| Dean Gibson | ~2.5 hours | 2026/04/22 | Workflow and delivery optimization. Captured GitHub PR review setup, drafted branching guides, and hardened the notification logging RPC. |
| Dean Gibson | ~0.5 hours | 2026/04/24 | Documentation maintenance. Minor updates to project records and implementation details. |
| Dean Gibson | ~2.0 hours | 2026/04/28 | Planning and order creation hardening. Drafted upcoming feature plans and implemented atomic safety checks for order creation flows. |
| Dean Gibson | ~4.0 hours | 2026/04/30 | Pre-launch operations and vendor features. Established version tracking, implemented scheduled collection flows, and hardened vendor-side launch access controls. |
| Dean Gibson | ~3.5 hours | 2026/05/02 | Payment recovery, delivery triage, and documentation cleanup. Implemented Stripe payment state recovery, added multi-secret webhook support, verified the app locally, closed the resolved payment-pending issue, cleaned up the GitHub delivery board, and moved archive notes into `docs/archive`. |
| Dean Gibson | ~4.0 hours | 2026/05/04 | Documentation system strategy and planning. Evaluated the personal Wiki MkDocs/Obsidian model for SKIIP, refined the internal searchable docs approach, created GitHub issue `#36`, and added the follow-up operating-model comment covering Obsidian, repo docs, GitHub Issues, information boundaries, and private/local notes. |
| Dean Gibson | ~4.5 hours | 2026/05/05 | Staging launch-readiness verification and checkout hardening. Returned structured checkout inventory errors, added the staging app origin to the Edge Function allow-list, captured the May 2026 project assessment, and recorded manual staging evidence for normal orders, scheduled orders, Stripe payment return, vendor lifecycle transitions, buyer tracking, admin visibility, vendor onboarding readiness, and multi-vendor routing. |
| Dean Gibson | ~5.0 hours | 2026/05/06 | Release, vendor operations, and closeout audit work. Promoted the `v0.22.0` baseline, added the vendor kanban order queue, advanced the staging baseline to `0.23.0`, re-ran local lint/unit/build/e2e verification, audited remaining closeout risks, and updated GitHub issue notes so launch blockers and follow-ups stay visible. |
| Dean Gibson | ~3.0 hours | 2026/05/07 | Phase 5 closeout refinements, release promotion, and client framing. Hardened notification queueing side effects, blocked admins from seller routes, improved checkout Edge Function error display, polished vendor order cards, added the project evolution client review, refreshed the Phase 5 client/internal/momentum docs to match the current `v0.24.0` staging baseline, closed the dependency/security cleanup issue, and promoted the synced `0.25.0` baseline toward `main`. |
| Dean Gibson | ~1.5 hours | 2026/05/08 | Repository cleanup and release preparation for retired marketing-site ownership. Removed the in-repo GitHub Pages workflow and local `site/` surface, repointed repo docs to the external `skiip-marketing` repository, verified remote branch state so delivery docs distinguish the retired workflow from the still-present legacy `gh-pages` branch, removed stale site-version sync behavior, and prepared the `0.26.0` staging release/tag baseline after confirming the deployed staging continuation-payment flow works. |
| Dean Gibson | ~2.5 hours | 2026/05/08 | Payment recovery closeout, issue hygiene, and notification-provider handover tracking. Merged the pending-payment recovery and idempotent unpaid-cancellation fixes into `staging`, opened the `v0.26.0` release PR to `main` for review, closed the resolved payment-recovery issue, opened follow-up issues for provider-account handover and production data cleanup, and captured external hosted-provider progress for Resend secret rotation and webhook setup while documenting the remaining Twilio/WhatsApp account migration work. |
| Dean Gibson | ~3.5 hours | 2026/05/11 | WhatsApp spend-control hardening. Added a configurable WhatsApp delivery guard, provider cost-gate behavior, richer notification configuration, WhatsApp status webhook handling, Deno coverage for the guard, and updated notification/launch docs for the new provider safety controls. |
| Dean Gibson | ~6.5 hours | 2026/05/12 | Launch UI overhaul, staging smoke fixture hardening, and contract capture. Improved role-specific smoke-test user seeding, expanded e2e fixture behavior, added the web development agreement contract record, and delivered the app-wide buyer/vendor/admin UI refresh across headers, navigation, checkout, menus, order tracking, admin, vendor, and shared UI controls. |
| Dean Gibson | ~4.0 hours | 2026/05/13 | Release integration and launch customization. Merged the WhatsApp cost gate and UI/UX overhaul work, bumped the pre-launch baseline to `0.27.0`, resolved staging integration conflicts, and added launch-event/vendor customization controls including buyer account navigation, launch settings, vendor tags, vendor profile configuration, and the supporting migration/Edge Function updates. |
| Dean Gibson | ~0.5 hours | 2026/05/14 | Main/staging alignment. Merged PR `#53` so `origin/main` and `origin/staging` both point at `66880b9`, carrying the current staging work into the main baseline. |
| Dean Gibson | ~1.0 hour | 2026/05/19 | First-event and ticketing readiness planning. Refreshed the repository/GitHub baseline, confirmed no commits after `66880b9`, confirmed issue counts remain 37 total / 23 closed / 14 open, and captured the local first-event ticketing decision note as untracked planning material requiring a follow-up docs decision. |
| Dean Gibson | ~1.0 hour | 2026/05/19 | Client-facing launch dependency documentation. Cross-checked launch docs, notification docs, open GitHub launch issues, the first-event planning note, and contract responsibilities, then added a client-facing missing-inputs document for the revised first-event deadline. |
| Dean Gibson | ~0.5 hours | 2026/05/19 | Client launch dependency refinement. Updated the client-facing launch inputs document with the confirmed 30 May 2026 event date, clarified DK-owned Stripe/live environment responsibilities, kept unresolved client decisions visible, added WhatsApp compliance urgency, and added Stripe Connect verification/payout timing guidance. |
| Dean Gibson | ~0.5 hours | 2026/05/20 | Version bump and release promotion. Bumped staging version to 0.28.0, synchronized version references, and opened a PR from staging to main. |
| **TOTAL** | **~63.0 hours** | | |

## May 19 First Event And Ticketing Status Refresh

May 19 did not add new committed implementation work, but it did add live-event planning context that changes the near-term operating posture.

Verified current baseline:

- remote refs were refreshed with `git fetch --prune`
- current branch remains `staging`
- current HEAD remains `66880b9 Merge pull request #53 from DK-Digital-Designs/staging`
- `origin/main`, `origin/staging`, and `origin/HEAD` still point at `66880b9`
- no newer commits are present after the May 14 main/staging alignment
- current repo/app version remains `0.27.0`
- latest local tag remains `v0.26.0`; no `v0.27.0` tag is present locally
- GitHub issues checked on 2026-05-19: 37 total, 23 closed, 14 open
- open P0 launch gates remain `#16` Stripe payment/payout/refund/reconciliation readiness and `#17` environment/secret parity

New planning context:

- local untracked file `skiip_first_event_ticketing_decision_note.md` captures the first-event and ticketing decision discussion
- the note frames the possible first live event as a controlled live pilot rather than normal MVP continuation work
- ticket sales are treated as new scope, with the safest first-event path remaining food/vendor ordering only
- a limited door-ticket sales workflow may be viable only if separately scoped, separately paid, operationally simple, and tested heavily before the event
- proper ticketing with QR/check-in remains future product scope unless a separate constrained MVP is explicitly agreed

Current follow-up:

- decide whether `skiip_first_event_ticketing_decision_note.md` should be moved into `docs/`, kept as a local private note, or converted into a client/internal planning document
- do not treat the ticketing note as committed product scope until commercial terms, event date, support expectations, and go/no-go criteria are agreed
- the live provider/account checks for Stripe, Supabase, Vercel, Resend, and Twilio/WhatsApp remain external

## May 19 Client-Facing Launch Inputs Document

Created [`docs/launch/CLIENT_LAUNCH_INPUTS_REQUIRED_MAY_2026.md`](docs/launch/CLIENT_LAUNCH_INPUTS_REQUIRED_MAY_2026.md) as the client-facing missing-inputs list for the revised first-event deadline.

The document confirms that the core app flow exists, but launch readiness still depends on client-owned and external items:

- final event date, scope, go/no-go deadline, and ticketing decision
- Stripe live-mode setup, live webhook readiness, real low-value test approval, and platform-fee sign-off
- real vendor list, menus, prices, inventory, devices, staff, and Stripe Connect onboarding
- Twilio WhatsApp compliance profile, sender, templates, guard settings, and smoke-test numbers
- Resend/email sender and customer copy approval
- production environment ownership, dashboard access, legal/customer policy text, support ownership, and production data cleanup approval

The docs index now links this document from the Launch and Environment section.

Follow-up refinement added the same day:

- confirmed the first event date as Saturday, 30 May 2026
- kept launch scope open pending SKIIP's decision
- moved live Stripe mode switching and production environment configuration to DK Digital/operator-owned work
- kept real vendor information and legal/policy text as SKIIP-owned inputs
- clarified that WhatsApp compliance must happen before number/sender purchase, SID/auth/API key setup, templates, and smoke verification can be treated as launch-ready
- moved email formatting to DK Digital, while keeping legal/support wording as a SKIIP input
- added Stripe Connect verification and first-payout timing notes so vendor onboarding is treated as urgent rather than a same-day assumption

## May 11-14 Launch UI, WhatsApp Cost Gate, And Release Alignment

May 11-14 moved the repository from the May 8 `0.26.0` staging baseline to the current `0.27.0` pre-launch baseline and synchronized `main` with `staging`.

Completed or verified:

- added WhatsApp delivery spend gating through `whatsapp-guard`, notification config changes, provider integration updates, status webhook hardening, and Deno guard tests
- hardened staging smoke fixtures so buyer, seller, and admin role users can be seeded and exercised more reliably
- added `Contract.txt` as the project web development agreement record
- delivered the site-wide UI/UX overhaul across shared navigation, bottom nav, dialogs, hold-to-confirm behavior, quantity controls, status timelines, buyer checkout/menu/tracking/profile, admin dashboards/vendors, and vendor dashboard/products/profile surfaces
- bumped `VERSION`, `app/package.json`, `app/package-lock.json`, `app/src/lib/version.js`, and release docs to `0.27.0`
- added launch-event and vendor customization controls, including vendor tags, vendor profile settings, buyer account menu behavior, admin launch settings, `vendor-store-profile`, and migration/schema snapshot updates
- merged PR `#57` for WhatsApp spend gating, PR `#61` for the UI/UX overhaul, and PR `#53` from `staging` into `main`

Current baseline after this pass:

- current branch: `staging`
- current HEAD: `66880b9 Merge pull request #53 from DK-Digital-Designs/staging`
- `origin/main`, `origin/staging`, and `origin/HEAD` all point at `66880b9`
- current repo/app version: `0.27.0`
- latest tag remains `v0.26.0`; no `v0.27.0` tag is present locally
- GitHub issues checked again on 2026-05-19: 37 total, 23 closed, 14 open
- open P0 launch gates remain `#16` Stripe payment/payout/refund/reconciliation readiness and `#17` environment/secret parity

Still external / not complete:

- `#18` notification provider verification and outbox recovery remains open despite the new WhatsApp spend guard
- `#19` staging smoke coverage and seed discipline remains open, with fixtures improved but broader authenticated smoke coverage still tracked
- `#39`, `#46`, `#47`, `#54`, and `#55` remain launch-readiness follow-ups around refunds, beta-to-production hardening, Supabase security lints, provider ownership handover, and production cutover cleanup
- live provider/account state still requires external verification in Supabase, Twilio/WhatsApp, Stripe, Vercel, and Resend

## May 8 Marketing Repo Retirement Recap

May 8 focused on removing the retired GitHub Pages marketing surface from this repository and aligning the documentation with the new ownership model.

Completed or verified:

- removed the in-repo GitHub Pages workflow
- removed the legacy `site/` directory from the worktree
- updated source-of-truth docs to point marketing ownership at `DK-Digital-Designs/skiip-marketing`
- verified with `git fetch --prune` and `git branch -r` that `origin/gh-pages` still exists remotely, so delivery docs now treat it as a legacy branch rather than pretending it is gone
- confirmed the deployed staging continuation-payment flow works before preparing the `0.26.0` release/tag baseline
- removed stale version-sync logic that still expected the deleted `site/` tree

Remaining external cleanup:

- if `gh-pages` should disappear completely, delete the remote branch and unpublish or retarget any GitHub Pages settings in GitHub itself

## May 8 Payment Recovery And Provider Ops Follow-Up

May 8 also covered the release and operational follow-up around the stabilized staging checkout path.

Completed or captured:

- merged PR `#51` so `staging` now includes pending-payment recovery controls from `cfbe894`
- merged PR `#52` so unpaid cancellation retries are idempotent through `40d0139`
- opened PR `#53` from `staging` to `main` for the retired marketing-site cleanup plus the `0.26.0` release baseline; this PR was later updated by subsequent staging work and merged on 2026-05-14
- closed resolved GitHub issue `#49` for pending-payment recovery and cancellation controls
- confirmed the issue board then showed 23 closed issues and 10 open issues; the current May 19 check shows 23 closed issues and 14 open issues
- opened issue `#54` to track provider-account ownership handover for Resend email and Twilio WhatsApp
- opened issue `#55` to track production cutover data cleanup and fresh-branch preparation after final testing
- captured external hosted-provider progress: the Resend API key and webhook secret were rotated in the hosted Supabase project `jmqjuvfjthwbsbelgccs`, and the Resend webhook target remains `https://jmqjuvfjthwbsbelgccs.supabase.co/functions/v1/resend-email-webhook` with the documented delivery, failure, bounce, complaint, suppression, and delay events

Still external / not complete:

- the current email template/sender presentation still needs polish
- Twilio/WhatsApp still needs a SKIIP-owned account, billing handover, fresh secrets, and the final approved templates

## May 7 Phase 5 Client And Closeout Refresh

May 7 focused on closing the gap between the May 2 Phase 5 reports and the work completed afterward.

Completed or captured:

- made post-mutation notification queueing best-effort so successful transitions, refunds, webhook completion, and admin reconciliation are not reported as failed solely because optional notification queueing failed
- prevented admin accounts from entering seller routes
- improved checkout display for structured Edge Function validation errors
- polished vendor order queue cards
- updated vulnerable dev tooling and closed issue `#48` for dependency/security cleanup
- promoted the synced `0.25.0` baseline toward `main` through PR `#50`
- added the client-facing project evolution review explaining the difference between delivered Phase 5 hardening, Phase 6 launch readiness, and Phase 7+ future scope
- updated all `docs/phase-5/` reports through May 7 with current version, issue counts, recent commits, verification baseline, and launch-readiness gates

Current `staging` baseline after this pass:

- version: `0.24.0`
- head before this docs refresh: `be5ae14 docs: add project evolution review document detailing platform growth and phase history`
- GitHub issues checked: 30 total, 17 closed, 13 open
- open P0 launch gates: `#16` Stripe payment/payout/refund/reconciliation readiness and `#17` environment/secret parity

## May 6 Closeout Audit And Issue Hygiene Recap

May 6 focused on turning recent implementation work into a clearer launch-closeout view.

Completed or confirmed:

- promoted the `v0.22.0` baseline toward production through PR `#40`
- merged the vendor kanban order queue through PR `#44`
- synchronized the staging baseline to `0.23.0`
- confirmed local verification still passes:
  - `npm run lint`
  - `npm run test`: 35 tests passed
  - `npm run build`
  - `npm run test:e2e`: 3 public smoke tests passed, 3 authenticated smoke tests skipped without credentials
  - `npm audit --audit-level=moderate`: 0 vulnerabilities

Key closeout risks recorded for follow-up:

- Stripe refund, payout, and reconciliation sign-off remains open through `#16` and `#39`
- live environment and secret parity remains open through `#17`
- notification provider verification and outbox recovery remains open through `#18`
- staging smoke and seed discipline remains open through `#19`
- backend boundary audit remains open through `#28`
- a newly identified notification-side-effect issue should be tracked separately: post-mutation notification failures can make successful order transitions or refunds look failed to the UI

Standing practice added: meaningful work sessions should now update this progress file and the relevant GitHub issues before final handoff, without waiting for a separate prompt.

## May 5 Staging Readiness Recap

May 5 focused on hardening the staging baseline after manual launch-path verification.

The checkout path was improved so inventory and Edge Function failures return structured, buyer-friendly errors rather than generic failure states. The Edge Function allow-list was updated for the staging origin, and the May 2026 project assessment was added to the docs so the remaining launch risks are explicit.

Manual staging evidence showed that the core buyer -> payment -> vendor -> admin loop is broadly workable, including normal orders, scheduled orders, Stripe payment return, vendor lifecycle transitions, buyer live tracking, admin dashboard visibility, vendor onboarding readiness, and multi-vendor routing.

Remaining from that pass:

- refund verification was split into focused issue `#39`
- broader Stripe launch readiness remains tracked in `#16`
- environment parity remains tracked in `#17`
- notification provider setup/retry verification remains tracked in `#18`

## May 2 End-of-Day Recap

May 2 focused on turning the staging payment-pending investigation into a safer launch baseline. The key payment fix added retry-aware Stripe webhook processing, an admin reconciliation path for paid orders that did not finalize cleanly, shared order/payment status labels, and webhook support for multiple Stripe webhook secrets in staging.

The resolved vendor-dashboard payment bug was closed as GitHub issue `#32` after local verification. The delivery board was also cleaned up so `#32` is done, scheduled orders `#29` is back in progress, and environment parity `#17` is visibly in progress.

Local verification completed successfully:

- `npm run test`: 22 tests passed
- `npm run build`: passed
- `npm run lint`: passed
- `npm run test:e2e`: 3 public smoke tests passed, 3 authenticated smoke tests remained credential-gated/skipped

Remaining launch blockers are environment and secret parity, end-to-end Stripe payout/refund/reconciliation rehearsal, the final scheduled-order paid lifecycle pass, RLS/auth boundary sign-off, and the legacy admin-store archive failure.

## May 4 Documentation System Planning Recap

May 4 focused on documentation strategy rather than committed code. The main output was a refined internal documentation operating model for SKIIP:

- keep `docs/` as the canonical repo-tracked project source of truth
- use MkDocs Material as a searchable rendered layer over the existing Markdown docs
- keep the existing GitHub Pages marketing-site deployment unchanged
- treat Obsidian as a pre-doc rough-notes space, not a competing source of truth
- separate shared internal documentation from ignored local/private notes and actual secret storage

GitHub issue `#36` now tracks the implementation plan for the internal searchable docs system, with a follow-up comment capturing the refined Obsidian -> `docs/` -> GitHub Issues operating model.

## May 6 Notification Queueing Hardening

May 6 issue `#45` hardened post-mutation notification queueing so successful order transitions, admin refunds, Stripe webhook payment completion, and admin payment reconciliation are not reported as failed solely because optional notification queueing failed afterward.

Implementation notes:

- added a shared best-effort transactional notification helper with explicit success/failure return values and normalized error logging
- updated the affected Edge Functions to log function, operation, order, event, correlation/source event, and operation metadata when queueing fails
- added Deno unit coverage for helper success, thrown `Error`, non-`Error` thrown values, and simulated successful mutation responses under forced queue failure
- added Deno Edge Function tests to the app-quality CI workflow
- updated notification and operations docs to distinguish committed business state, outbox rows, and queue insertion failures before an outbox row exists

Local verification:

- `npm run lint`: passed
- `npm run test`: 35 tests passed
- `npm run build`: passed
- `deno check supabase/functions/tests/notifications-best-effort-test.ts`: passed
- `deno test --no-run --allow-env --allow-read=supabase/functions supabase/functions/tests/notifications-best-effort-test.ts`: passed
- direct Deno forced-failure eval confirmed `{ queued: false }` return and operator-useful log context

Known local verification caveat:

- `deno test` itself panicked on Windows Deno 2.7.14 after type-checking; CI on Ubuntu is the required authoritative runner before closing `#45`.

## Full Commit Log (Phase 5+)

```text
9df9afa - 2026-05-20 : chore(release): bump staging baseline to 0.28.0
d4da18e - 2026-05-20 : fix(site): address SKIIP observation feedback
a99472c - 2026-05-19 : feat(docs): add first event and ticketing decision note
0d9f906 - 2026-05-19 : docs(launch): add client launch input checklist
66880b9 - 2026-05-14 : Merge pull request #53 from DK-Digital-Designs/staging
f456a2c - 2026-05-13 : feat(site): add launch and vendor customization controls
a2d83f5 - 2026-05-13 : Merge pull request #61 from DK-Digital-Designs/ui-ux-overhaul
59dc168 - 2026-05-13 : chore(staging): resolve UI overhaul merge conflict
f4abb17 - 2026-05-13 : chore(release): bump pre-launch version to 0.27.0
7f5b8aa - 2026-05-13 : Merge pull request #57 from DK-Digital-Designs/whatsapp-cost-gate
0279f10 - 2026-05-12 : feat(site): deliver launch UI overhaul
cd48992 - 2026-05-12 : add: project web development agreement contract document
4ba0996 - 2026-05-12 : test(smoke): harden staging role fixtures
490819c - 2026-05-11 : feat(notifications): gate WhatsApp delivery spend
42782d7 - 2026-05-08 : docs(progress): capture May 7-8 delivery follow-up
10442d9 - 2026-05-08 : chore(release): bump staging baseline to 0.26.0
ffa8977 - 2026-05-08 : chore(site): retire in-repo marketing surface
40d0139 - 2026-05-08 : fix(orders): make unpaid cancellation idempotent
cfbe894 - 2026-05-08 : fix(payments)!: add pending payment recovery controls
a22da44 - 2026-05-07 : chore(release): sync 0.25.0 baseline
fc90f1f - 2026-05-07 : chore(release): promote staging to main
3ae428f - 2026-05-07 : chore: ignore aider temporary files in .gitignore
2d42571 - 2026-05-07 : build(deps): update vulnerable dev tooling
a2e7b44 - 2026-05-07 : docs: add backend boundary audit
be5ae14 - 2026-05-07 : docs: add project evolution review document detailing platform growth and phase history
8794d0d - 2026-05-07 : feat(vendor): polish order queue cards
c161fa0 - 2026-05-07 : fix(checkout): surface Edge Function validation errors
6104e86 - 2026-05-07 : fix(auth): prevent admins entering seller routes
d61ed12 - 2026-05-07 : fix(notifications): make post-mutation queueing best-effort
bf48d07 - 2026-05-06 : docs(scope): add project evolution and scope reviews
da612d7 - 2026-05-06 : docs(delivery): record closeout progress and issue hygiene
63bb3af - 2026-05-06 : chore(release): sync staging baseline to 0.23.0
71d3bb0 - 2026-05-06 : feat(vendor): add kanban order queue
1e96f97 - 2026-05-06 : feat(vendor): add kanban order queue
7786b05 - 2026-05-06 : chore(release): bump version to 0.22.0
214e835 - 2026-05-05 : docs: capture May 2026 project assessment
8cb0117 - 2026-05-05 : fix(supabase): include staging origin in function allow-list
ac2a7c7 - 2026-05-05 : fix(orders): return structured checkout inventory errors
cee462f - 2026-05-02 : chore: move archive docs to docs/archive and clean up root
db5ca74 - 2026-05-02 : fix(payments): support multiple Stripe webhook secrets
431152b - 2026-05-02 : docs: add agent automation and commit standards
2ae1919 - 2026-05-02 : Fix Stripe payment state recovery
6610051 - 2026-04-30 : chore: establish pre-launch version tracking
3bfa5e9 - 2026-04-30 : Merge pull request #31 from DK-Digital-Designs/launch/may-2026-scope
6448f71 - 2026-04-30 : Merge pull request #30 from DK-Digital-Designs/fix/issue-24-atomic-order-create
a5ad823 - 2026-04-30 : docs: capture May launch readiness posture
760e5a2 - 2026-04-30 : feat: harden launch access and vendor operations
58e68a2 - 2026-04-30 : feat: add scheduled collection launch flow
d34c7cf - 2026-04-28 : docs: plan
18dbd0c - 2026-04-28 : docs: added meeting doc as WIP
a25ef5a - 2026-04-28 : feat(harden order create)
1e2795d - 2026-04-24 : docs: updated docs
1828509 - 2026-04-22 : docs: add branching workflow guide
8c72db5 - 2026-04-22 : Merge pull request #21 from DK-Digital-Designs/topic/twilio-resend-notifications
63e1316 - 2026-04-22 : fix: Harden claim_notification_logs RPC and include customer_email in admin orders
acac0e8 - 2026-04-22 : docs: capture GitHub delivery and PR review setup
af9ec3d - 2026-04-17 : feat(notifications): harden twilio and resend delivery
de7262e - 2026-04-17 : feat(notifications): restore twilio whatsapp and expand resend coverage
69c659c - 2026-04-17 : chore(notifications): align Meta docs and phone handling
378d1b5 - 2026-04-17 : Merge pull request #12 from DK-Digital-Designs/launch-hardening-p1-ops-secrets-smoke
d59ce9b - 2026-04-17 : Merge pull request #13 from DK-Digital-Designs/topic/notifications
8695234 - 2026-04-16 : feat(notifications): migrate WhatsApp to Meta Cloud API and refine email scoping
82266d1 - 2026-04-16 : chore: update gitignore
1049493 - 2026-04-16 : Add staging smoke workflow and setup docs
55dca2f - 2026-04-16 : Harden payment flows and track failed checkout attempts
5f2c6c4 - 2026-04-16 : Add launch hardening docs and smoke test scaffolding
b30d0db - 2026-04-16 : docs: expand roadmap and capture latest project progress
bb117b8 - 2026-04-16 : docs: finalise progress.md phase 1-4.
0e13360 - 2026-04-16 : docs: consolidate project documentation and capture schema reconciliation
4940e2b - 2026-04-15 : Merge pull request #10 from DK-Digital-Designs/fix/checkout
bff5c00 - 2026-04-15 : Disable gateway JWT checks for protected edge functions
96d7e3e - 2026-04-15 : Send auth headers with protected edge function requests
44588c9 - 2026-04-14 : docs: restructure project documentation and update progress logs
9841390 - 2026-04-14 : chore(migration)
937e459 - 2026-04-14 : chore: ignore .env.functions in git tracking
```
