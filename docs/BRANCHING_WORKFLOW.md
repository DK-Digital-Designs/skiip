# Branching Workflow

This document is the source of truth for SKIIP's branch roles and promotion flow.

The model is a lightweight Git Flow style workflow with `staging` acting as the integration and pre-production branch.

This is the intended operating model for the repository. It is not the same thing as GitHub enforcement. Branch protection, PR checks, and reviewer rules should support this model, but this document defines the workflow even where GitHub settings do not yet enforce it.

## Branch Roles

| Branch | Role | Rules |
| --- | --- | --- |
| `main` | Production branch | Must stay production-ready. Treat it as the record of what is live or approved for live release. Do not use it for routine feature development. |
| `staging` | Integration and QA branch | Default base branch for product work. Merge completed work here first so features can be tested together before promotion to production. |
| `feature/*` | New feature work | Create from `staging`. Merge back into `staging` through a PR. Delete after merge. |
| `fix/*` | Non-production bug fixes | Create from `staging`. Merge back into `staging` through a PR. Delete after merge. |
| `chore/*` | Maintenance, tooling, refactors, cleanup | Usually create from `staging`. Merge back into `staging` unless the change is explicitly repository-admin-only. |
| `hotfix/*` | Urgent production fixes | Create from `main`. Merge into `main` first, then bring the same fix back into `staging` so the branches do not drift. |
| `release/*` | Optional release hardening branch | Create from `staging` when a release needs a freeze or coordinated hardening. Merge into `main` once approved, then sync any release-only fixes back into `staging`. |
| `gh-pages` | Deployment artifact branch for the static site | Not a feature-development branch. Treat it as a publishing branch managed by the site deployment flow. |

## Workflow Classification

The closest industry-standard description is:

> A lightweight Git Flow-style branching model with `staging` acting as the integration and pre-production branch.

It is close to Git Flow in spirit because changes are integrated into a longer-lived non-production branch before production. It is also environment-based because `staging` maps to a real testing environment.

## Default Development Flow

For normal application, Supabase, and operational changes:

1. Start from the latest `staging`.
2. Create a short-lived branch such as `feature/...`, `fix/...`, or `chore/...`.
3. Implement the work and open a PR into `staging`.
4. Run review, CI, and staging verification.
5. Merge the branch into `staging`.
6. Test the integrated result in staging.
7. Promote `staging` into `main` when the staged set is release-ready.

This flow keeps `main` clean while allowing multiple short-lived changes to be validated together before production.

## Hotfix Flow

For an urgent production issue:

1. Branch from `main` using `hotfix/...`.
2. Implement the fix and open a PR into `main`.
3. Merge into `main` once production review is complete.
4. Tag the production release on `main`.
5. Merge or cherry-pick the same fix back into `staging` immediately.

The important rule is that `main` and `staging` must not stay split after a hotfix.

## Optional Release Branch Flow

Use a `release/...` branch when a release needs a hardening window, coordinated QA, or final polish.

Typical flow:

1. Branch `release/...` from `staging`.
2. Freeze scope for that release candidate.
3. Do final QA, smoke checks, release-only fixes, and version updates there.
4. Merge `release/...` into `main`.
5. Tag the production release on `main`.
6. Merge any release-only fixes back into `staging`.

Use this when the release needs more control than a direct `staging` to `main` promotion.

## Tags

Tag every production deployment on `main`, whether or not a `release/...` branch was used.

Examples:

- `v1.4.0`
- `v1.4.1`
- `2026-04-pilot`

Tags give a stable production history and a clean rollback/reference point.

## Naming Guidance

Preferred branch prefixes:

- `feature/...` for product work
- `fix/...` for non-production bug fixes
- `hotfix/...` for urgent production fixes
- `chore/...` for maintenance or tooling
- `release/...` for formal release preparation

Historical `topic/...` branches exist in this repository and are not invalid, but prefer the more specific prefixes above for new work.

If a tool or automation creates a branch with a custom prefix such as `codex/...`, the same lifecycle rules still apply: keep it short-lived, choose the correct target branch, and delete it after merge.

## Practical Rules

- Keep feature branches short-lived.
- Only merge review-ready work into `staging`.
- Do not let `staging` become a dumping ground for half-finished work.
- Release from `staging` to `main` regularly so the branches do not drift too far apart.
- Do not force-push shared integration branches unless there is an explicitly approved recovery reason.
- Prefer PRs over direct commits to `staging` or `main`.
- Use the commit format defined in [Commit Conventions](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/COMMIT_CONVENTIONS.md) for all human-authored commits.
- Delete local and remote short-lived branches after merge.
- Run `git fetch --prune` regularly.
- Use `git branch -vv` to spot local branches whose upstream is marked as gone.

## Direct-to-Main Exceptions

The default rule is that short-lived work branches target `staging`.

The main exception is repository-admin-only or documentation-only work that does not change deployable application behavior, schema behavior, secrets, or release mechanics. Those changes can target `main` directly when that is the cleaner path.

If there is any doubt, target `staging`.

## Risks This Model Helps Prevent

- unfinished work reaching production
- production instability from direct feature merges
- unclear release state
- branch drift caused by forgotten hotfix back-merges
- stale local branches hiding gone upstreams or abandoned work

## Related Documents

- [GitHub Setup](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/GITHUB_SETUP.md)
- [Launch Checklist](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/LAUNCH_CHECKLIST.md)
- [Testing Data](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/TESTING_DATA.md)
