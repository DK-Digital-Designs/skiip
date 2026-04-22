# GitHub Setup

This document is the source of truth for SKIIP's GitHub-side setup as of 2026-04-22.

It covers:
- repository-level GitHub Actions automation
- project board and issue-management setup
- label and milestone taxonomy
- current PR review tooling
- the current PR and issue snapshot created during this setup pass

## Repository

- Repository: [DK-Digital-Designs/skiip](https://github.com/DK-Digital-Designs/skiip)
- Default branch: `main`
- The current workflow history shows `staging` being used as an integration branch before merging to `main`
- The intended branching model now lives in [Branching Workflow](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/BRANCHING_WORKFLOW.md)
- No issue templates, pull request templates, or `CODEOWNERS` file are currently present in the repository

## GitHub Actions

Current workflows in [`.github/workflows`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/.github/workflows):

### 1. App Quality Checks

File: [app-quality.yml](C:/Users/deang/OneDrive/Documents/GitHub/skiip/.github/workflows/app-quality.yml)

Purpose:
- run deterministic checks for app and Supabase changes

Trigger:
- `push` when `app/**`, `supabase/**`, or the workflow file changes
- `pull_request` when `app/**` or `supabase/**` changes

Checks:
- `npm ci`
- `npm run lint`
- `npm run test`
- `npm run build`

### 2. Deploy Marketing Site to GitHub Pages

File: [deploy-site.yml](C:/Users/deang/OneDrive/Documents/GitHub/skiip/.github/workflows/deploy-site.yml)

Purpose:
- publish the static `site/` directory to GitHub Pages

Trigger:
- `push` to `main` when `site/**` or the workflow file changes
- manual `workflow_dispatch`

Notes:
- uses the `github-pages` environment
- grants `pages: write` and `id-token: write`

### 3. Staging Smoke Checks

File: [staging-smoke.yml](C:/Users/deang/OneDrive/Documents/GitHub/skiip/.github/workflows/staging-smoke.yml)

Purpose:
- run scheduled and on-demand Playwright smoke checks against staging

Trigger:
- manual `workflow_dispatch`
- scheduled weekdays at `06:00 UTC`

Behavior:
- uses the `staging` environment
- runs Playwright against `PLAYWRIGHT_BASE_URL`
- uploads HTML report and test artifacts on failure

## Pull Request Review Tooling

SKIIP uses Qodo as the default AI PR reviewer.

Repository configuration:
- [`.pr_agent.toml`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/.pr_agent.toml)
- [PR_REVIEW.md](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/PR_REVIEW.md)

Configured behavior:
- run `agentic_describe` and `agentic_review` automatically on PR open / reopen / ready-for-review
- rerun `agentic_review` on new commits pushed to an open PR
- show summary plus inline comments
- restrict inline comments to high-severity findings only
- bias findings toward payments, auth, RLS/data isolation, webhook/idempotency, notifications, environment drift, and migration safety

Important:
- Qodo is advisory only
- merge decisions still depend on human review plus GitHub Actions
- GitHub App installation remains a manual step if it has not already been completed

## Project Board

Project:
- [SKIIP Delivery](https://github.com/orgs/DK-Digital-Designs/projects/6)

Owner:
- `DK-Digital-Designs`

Purpose:
- software delivery board for closed-pilot hardening and launch-readiness work

Project description:
- `Software delivery board for SKIIP closed-pilot hardening and launch-readiness work.`

Board conventions currently stored in the project readme:
- `Workflow` is the primary kanban state
- built-in `Status` remains the automation-friendly mirror
- `Priority`, `Area`, `Effort`, and `Phase` are the main planning fields
- milestones and `Phase` are intended to stay aligned

### Project Fields

Built-in fields:
- `Title`
- `Assignees`
- `Status`
- `Labels`
- `Linked pull requests`
- `Milestone`
- `Repository`
- `Reviewers`
- `Parent issue`
- `Sub-issues progress`

Custom fields:
- `Workflow`: `Backlog`, `Todo`, `In Progress`, `Blocked`, `In Review`, `Done`
- `Priority`: `P0`, `P1`, `P2`, `P3`
- `Area`: `Frontend`, `Backend`, `Database`, `Auth`, `Payments`, `Notifications`, `Infra`, `DevOps`, `Security`, `UX`, `Testing`, `Docs`
- `Effort`: `S`, `M`, `L`, `XL`
- `Phase`: `Closed Pilot Stabilization`, `Launch Readiness`, `Post-Launch Hardening`

Current item count:
- 7 issues on the board

## Labels

Existing default GitHub labels were kept, and a repo-specific delivery taxonomy was added.

### Type labels

- `type:feature`
- `type:refactor`
- `type:research`
- `type:chore`

### Priority labels

- `priority:p0`
- `priority:p1`
- `priority:p2`
- `priority:p3`

### Area labels

- `area:frontend`
- `area:backend`
- `area:database`
- `area:auth`
- `area:payments`
- `area:notifications`
- `area:infra`
- `area:devops`
- `area:security`
- `area:ux`
- `area:testing`
- `area:docs`

### Support labels

- `blocked`
- `needs clarification`
- `technical debt`

### Retained default labels

- `bug`
- `enhancement`
- `documentation`
- `good first issue`
- plus the standard GitHub defaults such as `duplicate`, `help wanted`, `invalid`, `question`, and `wontfix`

## Milestones

Current milestones:

### 1. Closed Pilot Stabilization

Purpose:
- hardening the current pilot baseline across auth, access control, testing, and release discipline

Current issue count:
- 4 open issues

### 2. Launch Readiness

Purpose:
- final go-live gating for payments, environment parity, notification verification, and operational safety

Current issue count:
- 3 open issues

## Issues and Board Placement

The following issues were created and added to the board:

### Closed Pilot Stabilization

- [#14 Finalize edge-function auth posture and align `verify_jwt` across protected functions](https://github.com/DK-Digital-Designs/skiip/issues/14)
  Workflow: `Todo`
  Priority: `P0`
  Area: `Auth`
  Effort: `M`

- [#15 Audit and fix RLS and role boundaries for buyer, seller, admin, and service-role paths](https://github.com/DK-Digital-Designs/skiip/issues/15)
  Workflow: `Todo`
  Priority: `P0`
  Area: `Database`
  Effort: `L`

- [#19 Expand staging smoke coverage and seed discipline for buyer, seller, and admin flows](https://github.com/DK-Digital-Designs/skiip/issues/19)
  Workflow: `Todo`
  Priority: `P1`
  Area: `Testing`
  Effort: `M`

- [#20 Add schema drift verification to the release process and capture live-only fixes as migrations](https://github.com/DK-Digital-Designs/skiip/issues/20)
  Workflow: `Backlog`
  Priority: `P1`
  Area: `Database`
  Effort: `M`

### Launch Readiness

- [#16 Add end-to-end Stripe payout, refund, and reconciliation checks for launch readiness](https://github.com/DK-Digital-Designs/skiip/issues/16)
  Workflow: `Todo`
  Priority: `P0`
  Area: `Payments`
  Effort: `L`

- [#17 Audit and lock environment and secret parity across Vercel, Supabase, Stripe, and notifications](https://github.com/DK-Digital-Designs/skiip/issues/17)
  Workflow: `Todo`
  Priority: `P0`
  Area: `Infra`
  Effort: `M`

- [#18 Complete notification provider verification and outbox recovery operations](https://github.com/DK-Digital-Designs/skiip/issues/18)
  Workflow: `Blocked`
  Priority: `P1`
  Area: `Notifications`
  Effort: `M`

Notes:
- all seven issues are currently open
- no assignees are currently set

## Pull Request Snapshot

Recent PR state at the time of writing:

Open PRs:
- [#21 Topic/twilio resend notifications](https://github.com/DK-Digital-Designs/skiip/pull/21) from `topic/twilio-resend-notifications` into `staging`
- [#9 docs: add financial production audit, risk report, and launch checklist](https://github.com/DK-Digital-Designs/skiip/pull/9) from `codex/conduct-financial-integrity-audit-1pm4em` into `main`
- [#8 Add production financial audit docs: architecture analysis, risk report, and go-live checklist](https://github.com/DK-Digital-Designs/skiip/pull/8) from `codex/conduct-financial-integrity-audit` into `main`

Recent merged PRs:
- [#13 feat(notifications): migrate WhatsApp to Meta Cloud API and refine email scoping](https://github.com/DK-Digital-Designs/skiip/pull/13)
- [#12 Launch hardening p1 ops secrets smoke](https://github.com/DK-Digital-Designs/skiip/pull/12)
- [#11 Staging](https://github.com/DK-Digital-Designs/skiip/pull/11)
- [#10 Fix/checkout](https://github.com/DK-Digital-Designs/skiip/pull/10)

Observed PR flow:
- feature/topic branches commonly target `staging`
- `staging` is then merged into `main`

This is the observed practice from current PR history. The intended operating model is documented in [Branching Workflow](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/BRANCHING_WORKFLOW.md), but it is not yet fully enforced by repository settings.

## Operational Notes

- The GitHub project and issue taxonomy were created to keep the backlog small and implementation-ready
- The current board is intentionally focused on pilot stabilization and launch-readiness work, not broad long-term product expansion
- Qodo is the only AI PR reviewer configured at repository level right now
- No repository-side `reviewdog`, branch-protection, or issue-template setup was added in this pass

## Maintenance Rule

If GitHub-side setup changes in the future, update this document in the same change window.

This includes:
- new workflows
- project field or workflow changes
- label taxonomy changes
- milestone changes
- PR review tooling changes
- issue-management conventions
