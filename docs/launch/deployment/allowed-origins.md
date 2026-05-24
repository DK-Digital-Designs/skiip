# Allowed Origins

Read this when you need the allowed origins details from [Deployment](../DEPLOYMENT.md).

Protected browser-facing functions reject disallowed origins after preflight.

Important current behavior:

- if `ALLOWED_ORIGINS` is set, it becomes the effective allow-list
- if `ALLOWED_ORIGINS` is missing, [`_shared/http.ts`](../../../supabase/functions/_shared/http.ts) falls back to this hardcoded list:
  - `https://skiip.co.uk`
  - `https://www.skiip.co.uk`
  - `https://skiip-4nzf8krt6-dkdigital.vercel.app`
  - `https://skiip-git-staging-dkdigital.vercel.app`
  - `http://localhost:5173`
  - `http://127.0.0.1:5173`

Hosted environments should not rely on that fallback. Set `ALLOWED_ORIGINS` explicitly.

Because the app uses `HashRouter`, deep links such as `/#/order/track/...` are fine. The allow-list checks only the origin, not the hash path.
