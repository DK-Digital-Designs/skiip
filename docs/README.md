# Documentation Index

This directory is the source of truth for SKIIP project documentation.

If a statement in an old note, branch description, PR body, or legacy setup file conflicts with these documents, trust the active documents in this folder first. Historical notes live in [archive](archive/).

## Start Here

- [Architecture](ARCHITECTURE.md)
  Explains the repo structure, runtime architecture, active data flow, auth model, and current legacy boundaries.
- [Current State](CURRENT_STATE.md)
  Describes what is implemented now, what is actually working, and what is still operationally risky.
- [Roadmap](ROADMAP.md)
  Lists the next engineering priorities that are not already implemented.

## Launch And Environment

- [Deployment](launch/DEPLOYMENT.md)
  Covers environments, secrets, migrations, function deployment, webhooks, and deployment-specific caveats.
- [Environment Matrix](launch/ENVIRONMENT_MATRIX.md)
  Tracks staging/production parity across frontend vars, Supabase secrets, Stripe, and notification providers.
- [Launch Baseline May 2026](launch/LAUNCH_BASELINE_MAY_2026.md)
  Captures the current launch baseline posture.
- [Launch Checklist](launch/LAUNCH_CHECKLIST.md)
  Defines launch gates, release order, rollback rules, incident response, and vendor onboarding checks.
- [Client Launch Inputs Required May 2026](launch/CLIENT_LAUNCH_INPUTS_REQUIRED_MAY_2026.md)
  Lists the missing client-owned launch inputs, provider setup, vendor details, and verification gates for the revised first-event deadline.
- [Releases](launch/RELEASES.md)
  Defines pre-launch versioning, sync rules, and GitHub tag timing.
- [Secrets and Environments](launch/SECRETS.md)
  Tracks required environment variables, pilot auth decisions, current allow-list behavior, and secret rotation discipline.

## Operations

- [Analytics And Search Reporting](operations/ANALYTICS.md)
  Covers Vercel Analytics, Speed Insights, campaign UTMs, custom buyer-funnel events, Search Console checks, and client-facing reporting.
- [Operations](operations/OPERATIONS.md)
  Covers day-to-day order operations, troubleshooting, refund handling, and operational caveats.
- [Notifications](operations/NOTIFICATIONS.md)
  Covers the current Resend + Twilio setup, outbox behavior, remaining provider-account tasks, and retry limitations.
- [Testing Data](operations/TESTING_DATA.md)
  Lists the shared test accounts and the current smoke-test fixture model.

## Delivery

- Progress logs live in [`PROGRESS.md`](../PROGRESS.md) and [`PROGRESS-2.md`](../PROGRESS-2.md). For active Phase 5+ closeout work, update `PROGRESS-2.md` and the relevant GitHub issues as part of the normal handoff.
- [Agent Automation Plan](delivery/AGENT_AUTOMATION_PLAN.md)
  Defines proposed SKIIP-specific agent skills, deterministic scripts, and read-only recurring automations for launch and operations workflows.
- [Branching Workflow](delivery/BRANCHING_WORKFLOW.md)
  Defines the intended branch roles, PR targets, release promotion flow, hotfix handling, branch hygiene rules, and standing progress/issue update practice.
- [Commit Conventions](delivery/COMMIT_CONVENTIONS.md)
  Defines the required Conventional Commit format and allowed commit types for SKIIP.
- [Docs Audit Report](delivery/DOCS_AUDIT_REPORT.md)
  Records the status of each reviewed doc, what changed, the key mismatches found, and any remaining ambiguities.
- [GitHub Setup](delivery/GITHUB_SETUP.md)
  Covers GitHub Actions, the delivery board, labels, milestones, and the currently verified GitHub-side setup.
- [Pull Request Review](delivery/PR_REVIEW.md)
  Covers the Qodo GitHub app setup and repository-level AI review defaults.

## Reference

- [Backend Boundary Audit](reference/BACKEND_BOUNDARY_AUDIT.md)
  Inventories browser-initiated write paths and classifies the current server-authoritative, RLS-protected, and roadmap-hardening boundaries.
- [RLS Access Matrix](reference/RLS_ACCESS_MATRIX.md)
  Captures the launch access boundary for buyer, seller, admin, and service-role paths.

## Phase 5+

- [Client Recap](phase-5/PHASE_5_CLIENT_RECAP.md)
  Summarizes recent progress in a polished client-facing format with lightweight charts.
- [Internal Delivery Report](phase-5/PHASE_5_INTERNAL_DELIVERY_REPORT.md)
  Captures commits, issue state, verification results, and launch blockers for internal delivery tracking.
- [Momentum Update](phase-5/PHASE_5_MOMENTUM_UPDATE.md)
  Presents the recent delivery story as a high-level momentum and risk-reduction update.

## Current Project Shape

SKIIP currently consists of:

- a React 19 + Vite product app in [`app`](../app)
- a Supabase backend in [`supabase`](../supabase)
- a separate marketing site maintained in [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing)

Important current reality:

- the product app is the operational source of truth for ordering
- the marketing site is separate from this repo and should not be treated as backend-integrated lead capture unless that external repo is updated to support it
- `supabase/migrations/` is the authoritative schema source; older schema snapshot files are not
