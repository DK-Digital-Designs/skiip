# Overview

Read this when you need the overview details from [SKIIP Architecture](../ARCHITECTURE.md).

SKIIP is a monorepo with two active surfaces:

- [`app`](../../app): the product application for buyers, sellers, and admins
- [`supabase`](../../supabase): Postgres schema and migrations, RLS, auth integration, and edge functions

Current deployment split:

- the product app is built from `app/`
- the marketing site is maintained outside this repository in [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing)
- Supabase is the system of record for auth, data, realtime, and server-side business logic
