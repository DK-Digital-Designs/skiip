# Allowed Origins Inventory

Read this when you need the allowed origins inventory details from [Secrets and Environment Inventory](../SECRETS.md).

`ALLOWED_ORIGINS` should stay explicit and environment-scoped.

Recommended environment shape:

- local development: `http://localhost:5173,http://127.0.0.1:5173`
- staging: the exact staging app domain only
- production: `https://skiip.co.uk,https://www.skiip.co.uk`
- preview: include only if preview deployments are intentionally connected to a backend

Important current fallback:

- if `ALLOWED_ORIGINS` is missing, code falls back to a hardcoded list that currently includes Vercel preview/staging domains: `https://skiip-4nzf8krt6-dkdigital.vercel.app` and `https://skiip-git-staging-dkdigital.vercel.app`

Do not rely on that fallback in hosted environments.

Do not use wildcard origins. Do not leave stale preview domains in the list once they stop being active.
