# Current Baseline

Read this when you need the current baseline details from [Agent Automation Plan](../AGENT_AUTOMATION_PLAN.md).

Available capabilities:

- GitHub connector and authenticated `gh` CLI access for issues, projects, pull requests, workflow runs, and CI triage.
- Gmail connector for email search and launch/vendor/client communication triage.
- Browser Use, Build Web Apps, GitHub, Gmail, Vercel, Documents, Spreadsheets, and Presentations plugins.
- Project-local Supabase/Postgres best-practices skill in `.agents/skills/supabase-postgres-best-practices`.
- GitHub Actions for app quality checks, static site deployment, and weekday staging smoke checks.

Current gaps:

- No SKIIP-specific agent skills for launch operations, payment operations, auth/RLS auditing, smoke triage, or documentation drift.
- No Codex automations currently configured for recurring launch or operational checks.
- Some recurring work depends on manual context gathering from docs, GitHub issues, CI, Supabase functions, Stripe behavior, and environment notes.
