# Frontend Environment Variables

Read this when you need the frontend environment variables details from [Deployment](../DEPLOYMENT.md).

Current product-app runtime variables:

Required:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PUBLIC_APP_ORIGIN`
  - Production: `https://www.skiip.co.uk`
  - Staging/previews: set the exact approved app origin used for Supabase Auth callbacks.

Launch note:

- `VITE_VENDOR_INVITE_CODE` is not required for the May 2026 launch app because vendor onboarding is admin-created and `/vendor/signup` is not exposed.
- Do not set production `VITE_PUBLIC_APP_ORIGIN` to `https://skiip.vercel.app`; password recovery PKCE callbacks must stay on the canonical custom-domain origin.

Recommended:

- `VITE_SENTRY_DSN`
- `VITE_BUYER_SESSION_TIMEOUT_HOURS=0`
- `VITE_VENDOR_SESSION_TIMEOUT_HOURS=0`
- `VITE_ADMIN_SESSION_TIMEOUT_HOURS=0`

Session timeout behavior:

- each value is a number of inactive hours for that signed-in role; seller accounts use the vendor value
- `0`, unset, or invalid values disable SKIIP-enforced idle sign-out
- this is application-level unattended-browser control and does not replace Supabase project-wide Auth session settings

No Vite environment variable is required for the current Vercel Web Analytics or Speed Insights integration. The repo-side requirement is that `@vercel/analytics`, `@vercel/speed-insights`, `<Analytics />`, and `<SpeedInsights />` are present in the product app. The hosted Vercel project still needs the corresponding dashboard features enabled.

Important current clarification:

- use [Environment Matrix](../ENVIRONMENT_MATRIX.md) as the parity checklist before staging and production deploys

- `VITE_STRIPE_PUBLIC_KEY` has been removed from [`app/.env.example`](../../../app/.env.example)
- the current app does not load Stripe.js or read a frontend Stripe public key
- checkout is redirect-based through the `stripe-checkout` edge function, so this variable is not currently required for runtime

For the full inventory and rotation discipline, see [Secrets and Environment Inventory](../SECRETS.md).
