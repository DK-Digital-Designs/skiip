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

- `0.26.0` is the current staging baseline after retiring the in-repo marketing surface and confirming the staging continuation-payment flow still works on the deployed environment on 2026-05-08.
- `0.25.0` is the current production/main baseline after the May 6-7 vendor operations, auth, checkout, notification, dependency remediation, scope, and Phase 5 closeout work.
- `v0.22.0` was the previous production/main baseline tag for the May 2026 launch-hardening work.
- `0.23.0` was the staging baseline after the vendor kanban order queue feature.
- `0.20.0` was the first tracked May 2026 pre-launch staging baseline.
