## Model / Reasoning Effort Guidance

Codex cannot change its own model or reasoning effort automatically. Before starting work, classify the task:

- Low risk: docs, copy, simple UI tweaks, small one-file fixes.
  Recommended effort: low or medium.

- Normal implementation: scoped frontend/backend changes, tests, ordinary bug fixes.
  Recommended effort: medium.

- High-risk implementation: auth, payments, Stripe, Supabase RLS, database migrations, production config, webhooks, security-sensitive logic.
  Recommended workflow: plan first on high or xhigh, implement on medium, review on high or xhigh.

- Deep review / architecture / production incident work:
  Recommended effort: xhigh.

If the current session appears to be using too low an effort for the task, stop before editing and tell the user which profile or effort level should be used.
