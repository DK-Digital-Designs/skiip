# Current Seed and Reset Baseline

Read this when you need the current seed and reset baseline details from [Testing Data](../TESTING_DATA.md).

Current shared-account seeding path:

- run `npm run seed:test-users` from [`app`](../../../app)

Current environment expectations for the seeding script:

- `SUPABASE_SERVICE_ROLE_KEY` is preferred
- `SUPABASE_URL` is optional but recommended
- legacy `VITE_SUPABASE_SERVICE_ROLE_KEY` and `VITE_SUPABASE_URL` are still accepted by some local scripts

Idempotency behavior:

- existing auth users are updated with the maintained password and role metadata
- `user_profiles` rows are upserted by user ID
- the `skiip-test-kitchen` store is upserted by slug and reattached to the maintained seller
- the `smoke-test-burger` product is updated if it already exists for the store, otherwise it is created

Important current caveats:

- shared-environment seeding is additive for unrelated users, stores, products, orders, and operational data
- it does not wipe orders or live operational data
- local `supabase db reset` should not be treated as repo-guaranteed working today because `supabase/config.toml` references `supabase/seed.sql`, and that file is not committed
