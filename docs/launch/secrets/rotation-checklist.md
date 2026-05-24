# Rotation Checklist

Read this when you need the rotation checklist details from [Secrets and Environment Inventory](../SECRETS.md).

Use this checklist for Supabase, Stripe, Resend, Twilio, and any related environment secrets:

1. Identify the secret, environment, owner, and reason for rotation.
2. Generate the replacement secret in the provider console.
3. Update the relevant environment manager before revoking the old value.
4. Redeploy any functions or frontend surfaces that read the rotated secret.
5. Run smoke verification for the affected flow.
6. Revoke the old secret only after verification passes.
7. Record the rotation date and operator in the release notes or operational log.

Metrics API note:

- the external monitoring collector may hold a Supabase Secret API key for Basic Auth
- keep that key out of Vercel app variables, frontend examples, GitHub Actions logs, and committed Prometheus config
- rotate it through the same process as other launch-sensitive secrets

Immediate rotation triggers:

- any secret was pasted into a public channel, ticket, or document
- access was shared with someone who no longer needs it
- a laptop or password-manager compromise is suspected
- a provider dashboard shows suspicious usage or webhook tampering
