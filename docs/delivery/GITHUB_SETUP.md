# GitHub Setup

This document is the source of truth for SKIIP's GitHub-side setup as verified on 2026-04-22.

It covers:

- repository-level GitHub Actions automation
- project board and issue-management setup
- label and milestone taxonomy
- current PR review tooling
- the currently verified issue and PR snapshot

## Repository

- Repository: [DK-Digital-Designs/skiip](https://github.com/DK-Digital-Designs/skiip)
- Default branch: `main`
- Long-lived branches currently present in GitHub: `main`, `staging`, `gh-pages`
- The intended branching model lives in [Branching Workflow](BRANCHING_WORKFLOW.md)
- No issue templates, pull request templates, or `CODEOWNERS` file are currently present in the repository

## GitHub Actions

Current workflows in [`.github/workflows`](../../.github/workflows):

### 1. App Quality Checks

File: [app-quality.yml](../../.github/workflows/app-quality.yml)

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

File: [deploy-site.yml](../../.github/workflows/deploy-site.yml)

Purpose:

- publish the static `site/` directory to GitHub Pages

Trigger:

- `push` to `main` when `site/**` or the workflow file changes
- manual `workflow_dispatch`

Notes:

- uses the `github-pages` environment
- grants `pages: write` and `id-token: write`

### 3. Staging Smoke Checks

File: [staging-smoke.yml](../../.github/workflows/staging-smoke.yml)

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

SKIIP uses Qodo as the default AI PR reviewer, configured through [`.pr_agent.toml`](../../.pr_agent.toml).

Current repository behavior:

- run `agentic_describe` and `agentic_review` automatically on PR open / reopen / ready-for-review
- rerun `agentic_review` on new commits pushed to an open PR
- show summary plus inline comments
- restrict inline comments to high-severity findings only
- bias findings toward payments, auth, RLS/data isolation, webhook/idempotency, notifications, environment drift, and migration safety

Important:

- Qodo is advisory only
- merge decisions still depend on human review plus GitHub Actions

## Project Board

Project verified in GitHub:

- [SKIIP Delivery](https://github.com/orgs/DK-Digital-Designs/projects/6)

Owner:

- `DK-Digital-Designs`

Purpose:

- software delivery board for closed-pilot hardening and launch-readiness work

Current board item count from the linked repo milestone/issue set:

- 7 open tracked issues

Project field conventions are managed in the GitHub Project UI. The documented field model below is the current manual convention, but GitHub Project configuration should be rechecked in the UI before automating against it.

Documented field model:

- `Workflow`: `Backlog`, `Todo`, `In Progress`, `Blocked`, `In Review`, `Done`
- `Priority`: `P0`, `P1`, `P2`, `P3`
- `Area`: `Frontend`, `Backend`, `Database`, `Auth`, `Payments`, `Notifications`, `Infra`, `DevOps`, `Security`, `UX`, `Testing`, `Docs`
- `Effort`: `S`, `M`, `L`, `XL`
- `Phase`: `Closed Pilot Stabilization`, `Launch Readiness`, `Post-Launch Hardening`

## Labels

Verified repository label taxonomy:

Type labels:

- `type:feature`
- `type:refactor`
- `type:research`
- `type:chore`

Priority labels:

- `priority:p0`
- `priority:p1`
- `priority:p2`
- `priority:p3`

Area labels:

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

Support labels:

- `blocked`
- `needs clarification`
- `technical debt`

Additional repo label present:

- `codex`

Retained default GitHub labels:

- `bug`
- `enhancement`
- `documentation`
- `good first issue`
- `duplicate`
- `help wanted`
- `invalid`
- `question`
- `wontfix`

## Milestones

Verified milestones:

### 1. Closed Pilot Stabilization

Purpose:

- hardening the current closed-pilot baseline across auth, access control, testing, and release discipline

Current issue count:

- 4 open issues

### 2. Launch Readiness

Purpose:

- final go-live gating for payments, environment parity, notification verification, and operational safety

Current issue count:

- 3 open issues

## Verified Open Issues

### Closed Pilot Stabilization

- [#14 Finalize edge-function auth posture and align `verify_jwt` across protected functions](https://github.com/DK-Digital-Designs/skiip/issues/14)
  Priority: `P0`
  Areas: `area:backend`, `area:auth`, `area:security`

- [#15 Audit and fix RLS and role boundaries for buyer, seller, admin, and service-role paths](https://github.com/DK-Digital-Designs/skiip/issues/15)
  Priority: `P0`
  Areas: `area:database`, `area:auth`, `area:security`

- [#19 Expand staging smoke coverage and seed discipline for buyer, seller, and admin flows](https://github.com/DK-Digital-Designs/skiip/issues/19)
  Priority: `P1`
  Areas: `area:auth`, `area:devops`, `area:testing`

- [#20 Add schema drift verification to the release process and capture live-only fixes as migrations](https://github.com/DK-Digital-Designs/skiip/issues/20)
  Priority: `P1`
  Areas: `area:database`, `area:devops`, `area:docs`

### Launch Readiness

- [#16 Add end-to-end Stripe payout, refund, and reconciliation checks for launch readiness](https://github.com/DK-Digital-Designs/skiip/issues/16)
  Priority: `P0`
  Areas: `area:backend`, `area:payments`, `area:docs`

- [#17 Audit and lock environment and secret parity across Vercel, Supabase, Stripe, and notifications](https://github.com/DK-Digital-Designs/skiip/issues/17)
  Priority: `P0`
  Areas: `area:infra`, `area:devops`, `area:security`, `area:docs`

- [#18 Complete notification provider verification and outbox recovery operations](https://github.com/DK-Digital-Designs/skiip/issues/18)
  Priority: `P1`
  Areas: `area:backend`, `area:notifications`, `area:testing`
  Current label state includes `blocked`

Notes:

- all seven tracked issues are currently open
- no assignees are currently set

## Verified Pull Request Snapshot

Current open PRs:

- [#8 Add production financial audit docs: architecture analysis, risk report, and go-live checklist](https://github.com/DK-Digital-Designs/skiip/pull/8) into `main`
- [#9 docs: add financial production audit, risk report, and launch checklist](https://github.com/DK-Digital-Designs/skiip/pull/9) into `main`

Recently merged PRs relevant to current repo history:

- [#21 Topic/twilio resend notifications](https://github.com/DK-Digital-Designs/skiip/pull/21) merged into `staging` on 2026-04-22
- [#12 Launch hardening p1 ops secrets smoke](https://github.com/DK-Digital-Designs/skiip/pull/12) merged into `staging`
- [#11 Staging](https://github.com/DK-Digital-Designs/skiip/pull/11) merged `staging` into `main`
- [#10 Fix/checkout](https://github.com/DK-Digital-Designs/skiip/pull/10) merged into `staging`

Important caution:

- historical PR titles and bodies are not a reliable runtime source of truth
- for example, merged PR [#13](https://github.com/DK-Digital-Designs/skiip/pull/13) describes a Meta WhatsApp migration that does not match the current checked-in Twilio-based notification implementation
- use repository code and the docs in `docs/` as the source of truth, not historical PR descriptions

Observed PR flow from current history:

- short-lived branches commonly target `staging`
- `staging` is then promoted into `main`

## Operational Notes

- The current board is intentionally focused on pilot stabilization and launch-readiness work, not broad long-term product expansion.
- Qodo is the only repository-level AI PR reviewer currently configured.
- No repository-side `reviewdog`, `CODEOWNERS`, issue-template, or PR-template setup exists today.

## Maintenance Rule

If GitHub-side setup changes in the future, update this document in the same change window.

This includes:

- new workflows
- project-board convention changes
- label taxonomy changes
- milestone changes
- PR review tooling changes
- issue-management conventions