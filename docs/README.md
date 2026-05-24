# Documentation Index

This directory is the source of truth for SKIIP project documentation.

If a statement in an old note, branch description, PR body, or legacy setup file conflicts with these documents, trust the active documents in this folder first. Historical notes live in [archive](archive/).

## Start Here

- [Architecture](ARCHITECTURE.md)
  Stable index for repo structure, runtime architecture, frontend, auth, payments, notifications, data model, and legacy boundaries.
- [Current State](CURRENT_STATE.md)
  Stable index for what is implemented now, runtime truth, known risks, recent changes, and the May 2026 assessment.
- [Roadmap](ROADMAP.md)
  Stable index for current gaps, next priorities, later work, and ongoing principles.

The broad entrypoint files above are intentionally short. Follow their topic links when you need detailed implementation, launch, or operations context.

## Launch And Environment

- [Deployment](launch/DEPLOYMENT.md)
  Stable index for environment model, frontend vars, migrations, function deployment, provider configuration, verification, and release discipline.
- [Environment Matrix](launch/ENVIRONMENT_MATRIX.md)
  Tracks staging/production parity across frontend vars, Supabase secrets, Stripe, and notification providers.
- [Launch Baseline May 2026](launch/LAUNCH_BASELINE_MAY_2026.md)
  Captures the current launch baseline posture.
- [Launch Checklist](launch/LAUNCH_CHECKLIST.md)
  Stable index for launch gates, release order, rollback, incident response, vendor onboarding, and schema verification.
- [Client Launch Inputs Required May 2026](launch/CLIENT_LAUNCH_INPUTS_REQUIRED_MAY_2026.md)
  Lists the missing client-owned launch inputs, provider setup, vendor details, and verification gates for the revised first-event deadline.
- [Releases](launch/RELEASES.md)
  Defines pre-launch versioning, sync rules, and GitHub tag timing.
- [Secrets and Environments](launch/SECRETS.md)
  Stable index for environment surfaces, pilot auth, allowed origins, rotation, and local drift.

## Operations

- [Analytics And Search Reporting](operations/ANALYTICS.md)
  Covers Vercel Analytics, Speed Insights, campaign UTMs, custom buyer-funnel events, Search Console checks, and client-facing reporting.
- [Operations](operations/OPERATIONS.md)
  Stable index for day-to-day order operations, troubleshooting, refund handling, vendor onboarding, and operational caveats.
- [Supabase Metrics API](operations/SUPABASE_METRICS_API.md)
  Stable index for optional Prometheus-compatible database metrics export, dashboard bootstrap, alerting, and secret handling.
- [Notifications](operations/NOTIFICATIONS.md)
  Stable index for Resend, Twilio WhatsApp, outbox behavior, provider setup, smoke checks, and retry limitations.
- [Testing Data](operations/TESTING_DATA.md)
  Stable index for shared test accounts, smoke inputs, staging automation, fixture strategy, and seed/reset caveats.

## Delivery

- Progress logs live in [`PROGRESS.md`](../PROGRESS.md) and [`PROGRESS-2.md`](../PROGRESS-2.md). For active Phase 5+ closeout work, update `PROGRESS-2.md` and the relevant GitHub issues as part of the normal handoff.
- [Agent Automation Plan](delivery/AGENT_AUTOMATION_PLAN.md)
  Stable index for proposed SKIIP-specific agent skills, deterministic scripts, recurring automations, and implementation phases.
- [Branching Workflow](delivery/BRANCHING_WORKFLOW.md)
  Defines the intended branch roles, PR targets, release promotion flow, hotfix handling, branch hygiene rules, and standing progress/issue update practice.
- [Commit Conventions](delivery/COMMIT_CONVENTIONS.md)
  Defines the required Conventional Commit format and allowed commit types for SKIIP.
- [Docs Audit Report](delivery/DOCS_AUDIT_REPORT.md)
  Records the status of each reviewed doc, what changed, the key mismatches found, and any remaining ambiguities.
- [GitHub Setup](delivery/GITHUB_SETUP.md)
  Stable index for GitHub Actions, PR review tooling, the delivery board, labels, milestones, issues, and PR snapshots.
- [Pull Request Review](delivery/PR_REVIEW.md)
  Covers the Qodo GitHub app setup and repository-level AI review defaults.

## Reference

- [Backend Boundary Audit](reference/BACKEND_BOUNDARY_AUDIT.md)
  Inventories browser-initiated write paths and classifies the current server-authoritative, RLS-protected, and roadmap-hardening boundaries.
- [RLS Access Matrix](reference/RLS_ACCESS_MATRIX.md)
  Captures the launch access boundary for buyer, seller, admin, and service-role paths.

## Archive And Generated Material

- [Archive](archive/README.md)
  Historical notes, generated outputs, client deliverables, phase reports, and scope reviews. These are context, not active truth.
- [Output Archive Waypoint](output/README.md)
  Points old generated-output browsing paths to the cold archive.
- [Phase Reports Archive Waypoint](phase-5/README.md)
  Points old Phase 5 report paths to the cold archive.
- [Scope Reviews Archive Waypoint](scope/README.md)
  Points old scope-review paths to the cold archive.

## Current Project Shape

SKIIP currently consists of:

- a React 19 + Vite product app in [`app`](../app)
- a Supabase backend in [`supabase`](../supabase)
- a separate marketing site maintained in [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing)

Important current reality:

- the product app is the operational source of truth for ordering
- the marketing site is separate from this repo and should not be treated as backend-integrated lead capture unless that external repo is updated to support it
- `supabase/migrations/` is the authoritative schema source; older schema snapshot files are not
