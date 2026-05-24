# Implementation Phases

Read this when you need the implementation phases details from [Agent Automation Plan](../AGENT_AUTOMATION_PLAN.md).

### Phase 1: Skill Foundation

Create:

- `.agents/skills/skiip-launch-operator/SKILL.md`
- `.agents/skills/skiip-payment-ops/SKILL.md`
- `.agents/skills/skiip-rls-auth-auditor/SKILL.md`

Acceptance criteria:

- Each skill has clear frontmatter triggers.
- Each skill points to the minimum necessary repo references.
- Each skill produces a concise, repeatable output format.
- Skills are validated with the standard skill validation script.

### Phase 2: Deterministic Checks

Create:

- `scripts/check-env-matrix.mjs`
- `scripts/audit-edge-functions.mjs`
- `scripts/find-stale-launch-refs.mjs`

Acceptance criteria:

- Scripts can run locally from the repo root.
- Scripts do not require live production credentials.
- Failures are actionable and not noisy.
- Docs explain when to trust script output versus manual verification.

### Phase 3: Triage And Reporting

Create:

- `.agents/skills/skiip-staging-smoke-triage/SKILL.md`
- `.agents/skills/skiip-doc-truth-maintainer/SKILL.md`
- `scripts/smoke-summary.mjs`
- `scripts/release-readiness.mjs`

Acceptance criteria:

- Smoke triage can inspect GitHub workflow context and local Playwright artifacts.
- Doc truth checks clearly distinguish docs drift from implementation bugs.
- Release-readiness output can be used as a PR or release checklist.

### Phase 4: Recurring Automations

Create read-only Codex automations for:

- Weekday staging health brief
- Monday launch readiness audit
- Friday branch and release hygiene
- Daily blocker digest during launch hardening
- Optional Gmail launch/vendor digest

Acceptance criteria:

- Automations produce concise summaries.
- Automations do not change GitHub, docs, branches, deployments, or provider state.
- Any proposed write action is listed as a recommendation for manual approval.
