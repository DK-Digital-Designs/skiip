# Migrations and Schema Truth

Read this when you need the migrations and schema truth details from [Deployment](../DEPLOYMENT.md).

Authoritative schema source:

- [`supabase/migrations`](../../../supabase/migrations)
- Supabase no longer automatically exposes newly created tables to the Data API in newer projects. Test-event hotfixes should prefer columns/functions on existing exposed tables unless a new table is deliberately needed and its API/RLS exposure is reviewed.

Do not treat these files as the current live-working schema source of truth:

- [`supabase/schema.sql`](../../../supabase/schema.sql)
- [`supabase/skiip-schema.sql`](../../../supabase/skiip-schema.sql)
- [`supabase/skiip-schema-full-reset.sql`](../../../supabase/skiip-schema-full-reset.sql)

Important current caveat:

- [`supabase/config.toml`](../../../supabase/config.toml) enables `db reset` seeding from `./seed.sql`
- `supabase/seed.sql` is not committed in this repo

That means:

- `supabase db push` is the reliable repo-supported database sync path
- `supabase db reset` should not be treated as guaranteed working without local seed overrides or a restored seed file

Recommended CLI flow:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```
