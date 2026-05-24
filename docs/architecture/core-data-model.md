# Core Data Model

Read this when you need the core data model details from [SKIIP Architecture](../ARCHITECTURE.md).

Important tables:

- `user_profiles`
- `stores`
- `products`
- `orders`
- `order_items`
- `notification_logs`
- `notification_webhook_events`
- `audit_logs`
- `stripe_processed_events`

Important SQL functions:

- `handle_new_user()`
- `is_admin()`
- `finalize_paid_order_inventory()`
- `restock_order_inventory()`
- `decrement_inventory()`
- `create_order_with_items_v1()`
- `claim_notification_logs()`
- `get_admin_dashboard_metrics_v1()`

Authoritative schema source:

- [`supabase/migrations`](../../supabase/migrations)

Non-authoritative legacy schema files still present in the repo:

- [`supabase/schema.sql`](../../supabase/schema.sql)
- [`supabase/skiip-schema.sql`](../../supabase/skiip-schema.sql)
- [`supabase/skiip-schema-full-reset.sql`](../../supabase/skiip-schema-full-reset.sql)

Do not use those files as the live-working schema source of truth.
