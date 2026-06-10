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
- `VITE_BUYER_SESSION_TIMEOUT_HOURS=0.1666667`
- `VITE_VENDOR_SESSION_TIMEOUT_HOURS=0.5`
- `VITE_ADMIN_SESSION_TIMEOUT_HOURS=0.5`

Product modifiers (combo-able products), default `false`:

- `VITE_PRODUCT_MODIFIERS_UI_ENABLED` — master gate for any modifier UI
- `VITE_PRODUCT_MODIFIER_EDITOR_UI_ENABLED` — vendor modifier editor on the product form
- `VITE_PRODUCT_MODIFIER_BACKEND_ENABLED` — real reads/writes and configured checkout; must be enabled together with the backend `PRODUCT_MODIFIER_BACKEND_ENABLED` function secret
- `VITE_PRODUCT_MODIFIER_MOCK_DATA_ENABLED` — preview fixtures only; keep `false` in hosted environments

Modifier flag notes:

- these are build-time (`import.meta.env`); changing them requires a redeploy/rebuild, not just a dashboard edit
- if `VITE_PRODUCT_MODIFIER_BACKEND_ENABLED` is on while the backend secret is off, configured checkouts are rejected by `order-create`
- the test suite pins these off in [`app/vitest.config.js`](../../../app/vitest.config.js), so local `.env` flag values do not affect test results
- see [Order and Payment Flow](../../architecture/order-and-payment-flow.md#feature-flags)

Session timeout behavior:

- each value is a number of inactive hours for that signed-in role; seller accounts use the vendor value
- the approved pilot values are approximately 10 minutes for buyers and 30 minutes for sellers/admins
- `0`, unset, or invalid values disable SKIIP-enforced idle sign-out
- this is application-level unattended-browser control and does not replace Supabase project-wide Auth session settings
- Event-day override, 2026-06-06: production `VITE_VENDOR_SESSION_TIMEOUT_HOURS` was changed to `0` so live vendors are not signed out during service. Treat this as temporary event operations debt and revisit a proper vendor idle-session policy after the event.

No Vite environment variable is required for the current Vercel Web Analytics or Speed Insights integration. The repo-side requirement is that `@vercel/analytics`, `@vercel/speed-insights`, `<Analytics />`, and `<SpeedInsights />` are present in the product app. The hosted Vercel project still needs the corresponding dashboard features enabled.

Important current clarification:

- use [Environment Matrix](../ENVIRONMENT_MATRIX.md) as the parity checklist before staging and production deploys

- `VITE_STRIPE_PUBLIC_KEY` has been removed from [`app/.env.example`](../../../app/.env.example)
- the current app does not load Stripe.js or read a frontend Stripe public key
- checkout is redirect-based through the `stripe-checkout` edge function, so this variable is not currently required for runtime

For the full inventory and rotation discipline, see [Secrets and Environment Inventory](../SECRETS.md).
