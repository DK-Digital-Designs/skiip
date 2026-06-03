# Function Auth Posture

Read this when you need the function auth posture details from [SKIIP Architecture](../ARCHITECTURE.md).

Launch decision for May 2026: protected browser-facing edge functions keep Supabase gateway `verify_jwt = false` and enforce auth manually inside the function with `requireUser()`.

This is intentional for launch because the project also has webhook and secret-protected functions that must remain gateway-unauthenticated. Keeping one explicit in-function pattern avoids mixing gateway JWT behavior with manual bearer validation during the staging test window.

Protected edge functions use this pattern:

- `verify_jwt = false` in [`supabase/config.toml`](../../supabase/config.toml)
- the browser forwards the Supabase access token explicitly
- the function calls `requireUser()` from [`supabase/functions/_shared/auth.ts`](../../supabase/functions/_shared/auth.ts)

Protected functions using this model:

- `order-create`
- `stripe-checkout`
- `order-transition`
- `admin-store`
- `stripe-refund`
- `stripe-onboarding-link`
- `vendor-product-modifiers` (seller/admin only; writes go through the `replace_product_modifiers_v1()` `SECURITY DEFINER` RPC)

Functions that must remain unauthenticated at the gateway:

- `stripe-webhook`
- `resend-email-webhook`
- `whatsapp-status-webhook`
- `notification-dispatch` uses its own bearer secret instead of user auth

Browser-facing functions also gate by allowed `Origin`.

Auth response contract for protected functions:

- missing bearer token: `401`
- invalid or expired bearer token: `401`
- authenticated user without a readable profile: `403`
- authenticated user without the required role or store ownership: `403`

Important current behavior:

- if `ALLOWED_ORIGINS` is not set, [`_shared/http.ts`](../../supabase/functions/_shared/http.ts) falls back to a hardcoded list containing `https://skiip.co.uk`, `https://www.skiip.co.uk`, `https://skiip-4nzf8krt6-dkdigital.vercel.app`, `https://skiip-git-staging-dkdigital.vercel.app`, `http://localhost:5173`, and `http://127.0.0.1:5173`
- hosted environments should set `ALLOWED_ORIGINS` explicitly rather than relying on that fallback
