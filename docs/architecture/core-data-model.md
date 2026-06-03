# Core Data Model

Read this when you need the core data model details from [SKIIP Architecture](../ARCHITECTURE.md).

Important tables:

- `user_profiles`
- `stores`
- `products`
- `orders`
- `order_items`
- `product_modifier_groups`
- `product_modifier_options`
- `order_item_modifier_selections`
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
- `replace_product_modifiers_v1()`
- `claim_notification_logs()`
- `get_admin_dashboard_metrics_v1()`

## Product Modifiers

Added in [`20260603000000_product_modifiers_v1.sql`](../../supabase/migrations/20260603000000_product_modifiers_v1.sql). Lets vendors attach configurable choices (for example "Choose a drink", "Sides") to a product so buyers can build combos.

- `product_modifier_groups` — per-product groups with `required`, `min_select`, `max_select`, `sort_order`, soft-delete (`deleted_at`), and `status`. RLS lets the owning seller and admins manage them; active groups on active products/stores are publicly readable.
- `product_modifier_options` — options inside a group with a non-negative `price_delta`. Same RLS shape as groups.
- `order_item_modifier_selections` — immutable snapshot of the options chosen on an `order_items` line (`group_name`, `option_name`, `price_delta` are denormalized so historical orders survive later modifier edits). `order_items` also gained a `line_note` column.

Two RPCs carry the server-authoritative writes:

- `replace_product_modifiers_v1(p_actor_user_id, p_product_id, p_groups)` — `SECURITY DEFINER`, service-role only. Atomically replaces a product's groups/options after re-checking that the actor is the owning seller or an admin. Called by the `vendor-product-modifiers` edge function.
- `create_order_with_items_v1()` — extended to persist per-line modifier selections and `line_note` alongside each order item.

Authoritative schema source:

- [`supabase/migrations`](../../supabase/migrations)

Non-authoritative legacy schema files still present in the repo:

- [`supabase/schema.sql`](../../supabase/schema.sql)
- [`supabase/skiip-schema.sql`](../../supabase/skiip-schema.sql)
- [`supabase/skiip-schema-full-reset.sql`](../../supabase/skiip-schema-full-reset.sql)

Do not use those files as the live-working schema source of truth.
