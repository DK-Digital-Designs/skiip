# Releases

SKIIP uses SemVer for pre-launch and launch tracking.

## Version Rules

- Pre-launch versions use `0.minor.patch`.
- Keep major version `0` until public launch.
- Bump the minor version for staging baselines and meaningful feature sets.
- Bump the patch version for bug fixes against the current staging baseline.
- Reserve `1.0.0` for the first public launch-ready release.

## Source Of Truth

- [`VERSION`](../../VERSION) is the canonical version file.
- Run `node scripts/sync-version.mjs` after changing `VERSION`.
- The sync script updates the app package metadata and app version export.

## Tagging

- Use GitHub tags in the form `v0.20.0`.
- Create annotated release tags only after:
  - pending Supabase migrations are applied to the target environment
  - staging smoke checks pass
  - the release operator confirms the database and app are aligned
- Do not tag a version while migrations are still pending.

## Current Baselines

- `1.12.5` is the 2026-06-06 event version: cancelled-order refund instructions now point customers to the return form in SKIIP, and checkout phone normalization accepts event-day support number formatting.
- `1.12.2` is the current post-launch UI patch baseline: vendor product categories now include `Snacks`, with focused regression coverage.
- `1.12.1` was the previous post-launch UI/documentation patch baseline: buyer checkout no longer exposes scheduled-order controls, configurable menu item CTAs read `Build my plate`, and active docs reflect the current checkout posture.
- `1.12.0` was the product-modifier hardening baseline after issue #87: server-authoritative modifier validation/re-pricing, modifier-selection snapshots, vendor modifier editing, and dark-launch feature-flag controls.
- `1.6.0` was the post-launch feature baseline for the 2026-06-02 event-readiness work: restored service fee handling, tighter cancellation enforcement, vendor queue wording/ordering updates, persistent new-order banner behavior, buyer confirmation notice updates, and the historical-order banner-count fix.
- `1.0.0` is the first public launch-ready release baseline after final launch checkout and fee-display polish on 2026-05-28.
- `0.29.5` was the previous hotfix testing candidate for canonical-domain password-recovery redirects after repeated live PKCE cross-origin failure.
- `0.29.4` was the previous hotfix testing candidate for the May 26 valid password-recovery PKCE callback routing fix.
- `0.29.3` was the previous hotfix testing candidate for the password-recovery delivery follow-up and buyer menu/cart bug fixes.
- `0.28.0` is the staging and main baseline containing observation feedback fixes, launch checklists, and decision notes on 2026-05-20.
- `0.27.0` was the previous staging baseline for the Issue 41 site-wide UI/UX overhaul on 2026-05-13.
- `0.26.0` was the previous staging baseline after retiring the in-repo marketing surface and confirming the staging continuation-payment flow still worked on the deployed environment on 2026-05-08.
- `0.25.0` is the current production/main baseline after the May 6-7 vendor operations, auth, checkout, notification, dependency remediation, scope, and Phase 5 closeout work.
- `v0.22.0` was the previous production/main baseline tag for the May 2026 launch-hardening work.
- `0.23.0` was the staging baseline after the vendor kanban order queue feature.
- `0.20.0` was the first tracked May 2026 pre-launch staging baseline.
