# Proposed Automations

Read this when you need the proposed automations details from [Agent Automation Plan](../AGENT_AUTOMATION_PLAN.md).

Start with read-only reporting automations. Add write actions only after the summaries are consistently useful.

### Weekday Staging Health Brief

Schedule:

- Weekdays after the existing staging smoke workflow has had time to finish.

Task:

- Inspect the latest staging smoke run.
- Summarize failures, artifacts, and likely causes.
- Cross-reference open launch and smoke-related GitHub issues.

Output:

- short status: green, warning, or failed
- failure classification
- recommended next action

### Monday Launch Readiness Audit

Schedule:

- Weekly on Monday morning.

Task:

- Review open P0/P1 GitHub issues.
- Compare `docs/ROADMAP.md`, `docs/launch/LAUNCH_CHECKLIST.md`, and `docs/CURRENT_STATE.md`.
- Highlight launch blockers, stale docs, and unresolved external dependencies.

Output:

- launch blockers
- risks to watch
- docs or issue updates needed

### Friday Branch And Release Hygiene

Schedule:

- Weekly on Friday afternoon.

Task:

- Check branch state, failed checks, stale short-lived branches, and version/doc drift.
- Compare staging and main release posture.

Output:

- branch hygiene summary
- release-readiness warnings
- suggested cleanup actions

### Daily Blocker Digest

Schedule:

- Daily during launch hardening.

Task:

- Summarize open P0/P1 issues and newly opened bugs.
- Group by auth/RLS, payments, notifications, environment, smoke testing, and frontend operations.

Output:

- top blockers
- changed since previous digest
- suggested next work item

### Gmail Launch And Vendor Digest

Schedule:

- Optional daily or twice weekly.

Task:

- Search Gmail for SKIIP, Stripe, Supabase, Vercel, Resend, Twilio, vendor, and client terms.
- Summarize only actionable project messages.

Output:

- urgent messages
- vendor/client follow-ups
- external account or provider tasks
