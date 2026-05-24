# Acceptance Criteria

Read this when you need the acceptance criteria details from [Agent Automation Plan](../AGENT_AUTOMATION_PLAN.md).

- Skills live under `.agents/skills/` and validate successfully.
- Scripts run from the repo root and do not require production credentials.
- Automations are read-only and summarize recommended actions instead of mutating repo or provider state.
- Output formats are concise enough to use during launch hardening.
- Documentation index links to the plan and remains the source of truth.
```
