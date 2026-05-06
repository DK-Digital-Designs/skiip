# Pull Request Review

SKIIP uses Qodo as the default AI pull request reviewer for GitHub PRs.

This is advisory review only. Merge decisions still depend on human review plus the existing GitHub Actions checks in `.github/workflows/app-quality.yml` and `.github/workflows/staging-smoke.yml`.

## One-Time GitHub App Install

Qodo is configured in this repository, but GitHub App installation is still a manual org/repo action.

1. Sign in to the Qodo portal.
2. Open the Qodo GitHub Marketplace page: [Qodo on GitHub Marketplace](https://github.com/marketplace/qodo-merge-pro)
3. Click `Add`.
4. Install Qodo on `DK-Digital-Designs`.
5. Grant access to `skiip` only, unless you intentionally want broader org coverage.

Qodo's GitHub installation flow is documented here:
- [Install Qodo on GitHub](https://docs.qodo.ai/code-review/get-started/install/github)

Note:
- Qodo only applies the repository-level settings in `.pr_agent.toml` after that file is merged to the default branch.
- If the app is installed before this change is merged, Qodo will use its default or portal-level behavior until the repository config is present on `main`.

## Repository Defaults

The repository-level configuration lives in [`.pr_agent.toml`](../../.pr_agent.toml).

Current behavior:
- On PR open / reopen / ready-for-review: run `agentic_describe` and `agentic_review`
- On new commits pushed to an open PR: rerun `agentic_review`
- Show a summary plus inline comments
- Restrict inline comments to high-severity findings only
- Bias findings toward payments, auth, RLS/data isolation, webhook/idempotency, notifications, environment drift, and migration safety
- De-emphasize style-only comments already covered by existing CI

## Evaluation Window

After installation, validate Qodo against 3-5 real PRs:
- small frontend change
- backend / edge-function change
- docs or config-only change
- one intentionally flawed PR
- one larger mixed PR

Success criteria:
- Qodo comments appear automatically on PR open and on new pushes
- the feedback is useful on at least 2-3 of the trial PRs
- the comment volume stays low enough that reviewers do not ignore it
- the repo stays within the free-tier usage budget

If the signal is poor or the repo outgrows the free tier, re-evaluate whether to keep Qodo or move to a self-managed alternative such as PR-Agent.
