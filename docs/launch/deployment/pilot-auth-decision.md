# Pilot Auth Decision

Read this when you need the pilot auth decision details from [Deployment](../DEPLOYMENT.md).

The repo configuration currently keeps `auth.email.enable_confirmations = false`.

That is the configuration source of truth for the pilot.

Important caveat:

- buyer signup assumes immediate account availability because email confirmations are disabled in repo auth config
- vendor self-signup is not exposed for launch

Before any broader launch:

- decide whether confirmations stay off or are re-enabled
- align the frontend copy with that decision
- run end-to-end signup, login, and recovery verification in the target environment
