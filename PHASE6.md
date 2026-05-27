# Phase 6 Progress (May 24th - Present)

This is the active progress tracker for new SKIIP work after the Phase 5 closeout.

Historical progress logs:

- [Phase 1-4 progress](docs/PROGRESS.md)
- [Phase 5 progress](docs/PROGRESS-2.md)

| Actor | Time | Date | Description |
| :--- | :--- | :--- | :--- |
| Dean Gibson | ~0.5 hours | 2026/05/24 | Phase 6 tracking rollover. Capped the Phase 5 progress log, moved Phase 1-5 progress history into `docs/`, and created `PHASE6.md` as the active root tracker for new work. |
| Dean Gibson | ~2.5 hours | 2026/05/25 | Admin portal operational restructure hotfix. Split admin overview, orders, vendor performance, event setup, and checkout settings into focused routed surfaces; added action-path test coverage and updated active operations/launch documentation. Added local lint, Vitest, build, route-protection smoke, and visual-layout evidence; authenticated operational action verification remains a draft-PR merge gate. |
| Dean Gibson | ~0.75 hours | 2026/05/25 | Added Supabase PKCE password recovery for existing accounts: reset-request and password-update screens, recovery-event guard, unified login link, hash-routed callback support, focused tests, and deployment/verification documentation. Verified lint, Vitest (`83` tests), production build, and public Playwright smoke; hosted Supabase callback/SMTP validation remains tracked in issue #17. |
| Dean Gibson | ~0.5 hours | 2026/05/26 | Follow-up password recovery callback hotfix after live validation exposed an `otp_expired` callback being interpreted as a hash-router 404. Added callback error normalization and recovery-event routing, corrected the production callback origin/documented Supabase email-template requirement, and verified lint, Vitest (`86` tests), production build, and public Playwright smoke including the failed-link regression. |
| Dean Gibson | ~1.0 hours | 2026/05/26 | Addressed launch-readiness buyer bugs #80 and #81: added keyboard-operable menu item details with focus restoration, enabled decrement-to-empty plus explicit checkout line removal, and added regression coverage. Investigated #79 against the implemented Supabase reset flow and current SMTP guidance; custom production SMTP plus received-email/link-redemption evidence remains a live launch gate. Verified lint, Vitest (`90` tests), production build, public Playwright smoke, and rendered buyer interaction checks. |
| Dean Gibson | ~0.25 hours | 2026/05/26 | Bumped the hotfix testing candidate version to `0.29.3` for the password-recovery and buyer menu/cart bug-fix validation pass; no production release or tag implied. |
| Dean Gibson | ~0.75 hours | 2026/05/26 | Follow-up valid-link password-recovery hotfix after a delivered PKCE email returned `?code=...#/login` without opening reset. Added explicit PKCE callback exchange and recovery-intent handling, bumped the testing candidate to `0.29.4`, and corrected recovery operations guidance. Verified lint, Vitest (`94` tests), production build, public Playwright smoke (`7` passed, `3` credential-gated skipped), and the rendered reset-link failure state; live successful link redemption remains a deployment gate. |
| Dean Gibson | ~0.75 hours | 2026/05/26 | Reopened #79 after first-click recovery failure reproduced on deployed `0.29.4`: a Vercel callback origin cannot redeem a PKCE verifier initiated on the canonical custom domain. Added canonical `www.skiip.co.uk` origin routing and reset-link configuration, bumped the testing candidate to `0.29.5`, and documented the required hosted Supabase Site URL/template/redirect correction. Verified lint, Vitest (`97` tests), production build, public Playwright smoke (`7` passed, `3` credential-gated skipped), and synthetic legacy-host callback redirect preservation on the rendered build. |
| Dean Gibson | ~0.5 hours | 2026/05/26 | Added a branded SKIIP Supabase recovery-email template with canonical logo/domain, CTA, and security copy; configured it for local Auth previews and corrected hosted-template guidance to use Supabase's verified `ConfirmationURL` flow. Hosted dashboard template publication remains required before branded production-email verification. |
| Dean Gibson | ~4.5 hours | 2026/05/27 | Implemented the 30 May pilot feedback scope: changed the fixed buyer service fee to GBP 1.50 while retaining the 10% Connect application fee, added transfer/application-fee reversal for full destination-charge refunds, added paid vendor-cancellation refund-review support cases, added protected buyer/vendor issue reporting plus admin triage, replaced account-menu `Settings soon` with `Report an issue`, added checkout country-code phone normalization, and added per-role frontend inactivity logout defaulted off. Verified app lint, Vitest (`106` tests), production build, Deno edge-function checks, focused Deno edge tests (`42` tests), and rendered unauthenticated support-link/session-expiry checks. |
| Dean Gibson | ~0.75 hours | 2026/05/27 | Final pilot feedback hotfix: renamed the Burgers category/tag label to Mains across buyer/vendor displays and seed/reset data, added a production data migration for existing product categories/store tags, and added best-effort internal support-request email alerts to `info@skiip.co.uk`/`SUPPORT_ALERT_EMAIL`. Automated verification tests intentionally skipped for client manual verification. |
| **TOTAL** | **~12.75 hours** | | |

## Tracking Rules

- Add meaningful new implementation, launch, verification, delivery, and documentation work here.
- Keep completed historical phase records in `docs/`.
- Update the relevant GitHub issue when work changes launch posture, implementation state, or ownership.
- Record verification commands or external checks in the relevant work entry when useful.
