# Pull Request Review Tooling

Read this when you need the pull request review tooling details from [GitHub Setup](../GITHUB_SETUP.md).

SKIIP uses Qodo as the default AI PR reviewer, configured through [`.pr_agent.toml`](../../../.pr_agent.toml).

Current repository behavior:

- run `agentic_describe` and `agentic_review` automatically on PR open / reopen / ready-for-review
- rerun `agentic_review` on new commits pushed to an open PR
- show summary plus inline comments
- restrict inline comments to high-severity findings only
- bias findings toward payments, auth, RLS/data isolation, webhook/idempotency, notifications, environment drift, and migration safety

Important:

- Qodo is advisory only
- merge decisions still depend on human review plus GitHub Actions
