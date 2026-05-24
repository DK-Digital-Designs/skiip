# Auth Model

Read this when you need the auth model details from [SKIIP Architecture](../ARCHITECTURE.md).

Auth is handled by Supabase Auth with role data in `public.user_profiles`.

Current roles:

- `buyer`
- `seller`
- `admin`

Current account-entry paths:

- buyer self-signup through `/signup`
- admin-created seller/store setup through the admin vendor management UI
- no public or invite-code vendor self-signup for the May 2026 launch

Current backend profile lifecycle:

- [`handle_new_user()`](../../supabase/migrations/20260415000001_user_profile_reconciliation.sql) creates or reconciles `user_profiles` rows from `auth.users`
- the reconciliation migration also backfills missing historical profiles

Important current mismatch:

- [`supabase/config.toml`](../../supabase/config.toml) keeps `auth.email.enable_confirmations = false`
- buyer signup messaging assumes immediate account availability
- vendor onboarding is admin-created for launch
