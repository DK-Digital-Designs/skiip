# Local Files and Current Drift

Read this when you need the local files and current drift details from [Secrets and Environment Inventory](../SECRETS.md).

- [`app/.env.example`](../../../app/.env.example) documents only part of the current frontend env shape and does not include `VITE_VENDOR_INVITE_CODE`.
- [`supabase/.env.functions.example`](../../../supabase/.env.functions.example) is the best repo-local template for function secrets.
- `supabase/.env.functions` should remain local and untracked.
- [`supabase/config.toml`](../../../supabase/config.toml) references `supabase/seed.sql` for `db reset`, but that file is not committed.

Treat this document, not the example files alone, as the complete current inventory.
