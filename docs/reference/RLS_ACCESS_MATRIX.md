# Launch RLS Access Matrix

This matrix captures the May 2026 launch boundary after `20260428000001_launch_rls_boundaries.sql`.

## Critical Tables

| Table | Buyer | Seller | Admin | Service role |
| --- | --- | --- | --- | --- |
| `user_profiles` | Read own profile only. New auth signups are created as `buyer` by trigger. | Read own profile only. No self-promotion. | Read profiles. Vendor owner promotion goes through `admin-store`. | Bypasses RLS for auth triggers and edge/server operations. |
| `stores` | Read active, non-deleted stores. | Read active stores and own non-archived store. No direct insert/update for launch. | Read stores. Create/status/archive mutations go through `admin-store`. | Bypasses RLS for edge/server operations. |
| `products` | Read active, non-deleted products. | Read, create, update, and soft-delete products for owned stores. | Read and manage all products. | Bypasses RLS for edge/server operations. |
| `orders` | Read own orders. No direct browser insert for launch. | Read orders for owned stores. Status changes go through `order-transition`. | Read and manage all orders; refunds go through `stripe-refund`. | Creates and updates orders through edge functions and webhooks. |
| `order_items` | Read items for own orders. | Read items for owned-store orders. | Inherits visibility through admin order access. | Writes through trusted order creation paths. |
| `notification_logs` | No direct access. | Read logs for owned-store orders. | Read all notification logs. | Manage queued notifications and delivery status. |
| `notification_webhook_events` | No direct access. | No direct access. | Read webhook event records. | Manage provider webhook idempotency records. |
| `audit_logs` | No direct access. | No direct access. | Read audit logs. | Write audit logs from trusted flows. |
| `support_requests` | No direct read or write; submission goes through `support-request`. | No direct read or write; submission goes through `support-request`. | Read private cases; triage updates go through `admin-support-request`. | Create/update cases and audit triage through trusted functions. |
| `stripe_processed_events` | No direct access. | No direct access. | Read processed Stripe event records. | Manage Stripe webhook idempotency records. |

## Launch Boundary Decisions

- Vendor onboarding is admin-created for launch. Browser-side seller store insert/update policies are removed, and admin store/profile mutations go through `admin-store`.
- Buyer signup is allowed, but new profiles are forced to `buyer`; role changes are admin/server operations.
- Order creation is server-authoritative. Browser clients cannot insert `orders` directly.
- Issue submissions are stored privately. Buyers and sellers receive a reference after an authenticated Edge Function submission but do not query case rows directly.
- Protected edge functions use manual bearer validation with `requireUser()`; webhook and dispatch functions use signature or secret checks.

## Staging Validation

- Buyer: sign up/sign in, create checkout order through `order-create`, verify only own order tracker/profile data is visible.
- Seller: sign in, confirm own store/products/orders are visible, confirm order status changes use `order-transition`.
- Admin: sign in, confirm dashboard metrics, recent orders, vendor management, refunds, notification logs, and audit logs remain accessible.
- Service role: run Stripe webhook, refund, notification dispatch, and auth-trigger paths in staging test mode.
