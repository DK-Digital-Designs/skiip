# Current Pilot Auth Decision

Read this when you need the current pilot auth decision details from [Secrets and Environment Inventory](../SECRETS.md).

`auth.email.enable_confirmations = false` remains the explicit repo-level pilot decision.

This is acceptable only while:

- buyers, sellers, and admins are invited or directly supported
- support staff can resolve account issues manually
- the product is not yet relying on self-serve public signup as a trust boundary

Important launch behavior:

- buyer signup assumes immediate account availability because confirmations are disabled in repo config
- vendor onboarding is admin-created; vendor self-signup is not exposed

Before any broader launch:

- decide whether confirmations stay off or are re-enabled
- align the frontend copy and flow to that decision
- run signup, login, and password-reset smoke checks against the target environment
