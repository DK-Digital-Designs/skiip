# Releases

SKIIP uses SemVer for pre-launch and launch tracking.

## Version Rules

- Pre-launch versions use `0.minor.patch`.
- Keep major version `0` until public launch.
- Bump the minor version for staging baselines and meaningful feature sets.
- Bump the patch version for bug fixes against the current staging baseline.
- Reserve `1.0.0` for the first public launch-ready release.

## Source Of Truth

- [`VERSION`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/VERSION) is the canonical version file.
- Run `node scripts/sync-version.mjs` after changing `VERSION`.
- The sync script updates the app package metadata, app version export, and static site version script.

## Tagging

- Use GitHub tags in the form `v0.20.0`.
- Create annotated release tags only after:
  - pending Supabase migrations are applied to the target environment
  - staging smoke checks pass
  - the release operator confirms the database and app are aligned
- Do not tag a version while migrations are still pending.

## Current Baseline

`0.20.0` is the first tracked May 2026 pre-launch staging baseline.
