# Documentation Index

This directory is the source of truth for SKIIP project documentation.

If a statement in an old note, branch description, PR body, or legacy setup file conflicts with these documents, trust the documents in this folder.

## Start Here

- [Architecture](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/ARCHITECTURE.md)
  Explains the repo structure, runtime architecture, active data flow, auth model, and current legacy boundaries.
- [Current State](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/CURRENT_STATE.md)
  Describes what is implemented now, what is actually working, and what is still operationally risky.
- [Deployment](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/DEPLOYMENT.md)
  Covers environments, secrets, migrations, function deployment, webhooks, and deployment-specific caveats.
- [Notifications](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/NOTIFICATIONS.md)
  Covers the current Resend + Twilio setup, outbox behavior, remaining provider-account tasks, and retry limitations.
- [Secrets and Environments](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/SECRETS.md)
  Tracks required environment variables, pilot auth decisions, current allow-list behavior, and secret rotation discipline.
- [Launch Checklist](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/LAUNCH_CHECKLIST.md)
  Defines launch gates, release order, rollback rules, incident response, and vendor onboarding checks.
- [Operations](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/OPERATIONS.md)
  Covers day-to-day order operations, troubleshooting, refund handling, and operational caveats.
- [Branching Workflow](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/BRANCHING_WORKFLOW.md)
  Defines the intended branch roles, PR targets, release promotion flow, hotfix handling, and branch hygiene rules.
- [GitHub Setup](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/GITHUB_SETUP.md)
  Covers GitHub Actions, the delivery board, labels, milestones, and the currently verified GitHub-side setup.
- [Pull Request Review](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/PR_REVIEW.md)
  Covers the Qodo GitHub app setup and repository-level AI review defaults.
- [Testing Data](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/TESTING_DATA.md)
  Lists the shared test accounts and the current smoke-test fixture model.
- [Roadmap](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/ROADMAP.md)
  Lists the next engineering priorities that are not already implemented.
- [Docs Audit Report](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/DOCS_AUDIT_REPORT.md)
  Records the status of each reviewed doc, what changed, the key mismatches found, and any remaining ambiguities.

## Current Project Shape

SKIIP currently consists of:

- a React 19 + Vite product app in [`app`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app)
- a Supabase backend in [`supabase`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase)
- a separate static marketing site in [`site`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/site)

Important current reality:

- the product app is the operational source of truth for ordering
- the marketing site is separate and still contains demo-style localStorage form capture
- `supabase/migrations/` is the authoritative schema source; older schema snapshot files are not
