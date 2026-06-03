# Backend Boundary Audit

This audit captures the Issue 28 backend-boundary review for the active product app.

Scope:

- active browser code in [`app/src`](../../app/src)
- Supabase Edge Functions and configuration in [`supabase/functions`](../../supabase/functions) and [`supabase/config.toml`](../../supabase/config.toml)
- authoritative schema and RLS policy source in [`supabase/migrations`](../../supabase/migrations)
- current architecture and RLS docs in [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) and [`docs/reference/RLS_ACCESS_MATRIX.md`](RLS_ACCESS_MATRIX.md)

Out of scope:

- rewriting browser write paths
- moving seller product management behind Edge Functions
- proving live hosted provider configuration

## Summary

The current launch boundary is broadly server-authoritative for sensitive business mutations. Orders, checkout, payments, refunds, reconciliation, admin vendor/store operations, Stripe webhooks, notification provider webhooks, and notification backlog dispatch are handled through Edge Functions, RPCs, webhooks, or service-role paths.

The active browser-side writes that remain are:

- Supabase Auth signup, sign-in, sign-out, and password recovery calls
- seller product create/update/soft-delete writes to `products`
- seller product image uploads to Supabase Storage

For closed-pilot launch, seller product CRUD and image uploads are acceptable as RLS/storage-protected browser writes. They are scoped to owned stores by current policies and do not directly mutate payments, orders, roles, vendor ownership, audit logs, notifications, or cross-tenant records.

No new untracked high-risk browser-side privileged write was found in this audit.

## Browser-Initiated Write Inventory

| Browser entrypoint | Backend path | Classification | Boundary notes |
| --- | --- | --- | --- |
| `AuthService.signUp()` in [`auth.service.js`](../../app/src/lib/services/auth.service.js) and routed buyer signup in [`Signup.jsx`](../../app/src/pages/shared/Signup.jsx) | Supabase Auth creates the user; `handle_new_user()` creates/reconciles `user_profiles` | Safe as-is for closed pilot | Browser does not choose privileged roles. New profiles are forced to buyer by backend trigger behavior documented in the architecture and RLS matrix. |
| `AuthService.signIn()` / `AuthService.signOut()` | Supabase Auth session lifecycle | Safe as-is for closed pilot | Session mutations are Supabase Auth-managed, not application data privilege writes. |
| `AuthService.requestPasswordReset()` / `AuthService.updatePassword()` in [`auth.service.js`](../../app/src/lib/services/auth.service.js), routed through [`ForgotPassword.jsx`](../../app/src/pages/shared/ForgotPassword.jsx) and [`ResetPassword.jsx`](../../app/src/pages/shared/ResetPassword.jsx) | Supabase Auth recovery email and password update lifecycle | Safe as-is for closed pilot | Reset requests return a generic confirmation; the update form is exposed only after Supabase emits `PASSWORD_RECOVERY` for the PKCE email callback, and the recovery state is cleared after use. |
| `ProductService.createProduct()` | Direct `products.insert()` from browser | Safe as-is for closed pilot | Seller insert policy checks that `store_id` belongs to the authenticated user's non-deleted store. Admin policy can manage all products. |
| `ProductService.updateProduct()` | Direct `products.update()` from browser | Safe as-is for closed pilot | Seller update policy uses and checks ownership through `stores.user_id = auth.uid()`. This covers product edits and soft-delete updates. |
| `ProductService.deleteProduct()` | Direct `products.update({ deleted_at, status: 'archived' })` from browser | Safe as-is for closed pilot | Soft-delete is constrained by the same seller-owned product update policy. |
| `ProductImageUpload` | Direct Supabase Storage upload to `product-images/products/<store_id>/<file>` | Safe as-is for closed pilot | Storage policies restrict insert/update to authenticated admins or users who own the store id embedded in the storage path. Bucket MIME and size limits are set in Supabase config/migrations. |
| `OrderService.createOrder()` | `order-create` Edge Function | Already server-authoritative | Browser checkout currently submits product ids, quantities, contact details, tip, and an immediate-collection scheduled payload; scheduled collection metadata is still validated when supplied by an older or future client path. Function validates auth, loads products, computes subtotal, service fee, and total, checks inventory, and writes orders/items through `create_order_with_items_v1()`. |
| `StripeService.createCheckoutSession()` | `stripe-checkout` Edge Function | Already server-authoritative | Function reloads the order, confirms ownership/payable state, checks vendor Stripe readiness, and creates the Checkout Session. |
| `OrderService.updateOrderStatus()` | `order-transition` Edge Function | Already server-authoritative | Vendor/admin status transitions go through function auth, ownership/role checks, and database-side transition rules. |
| `RefundService.refundOrder()` | `stripe-refund` Edge Function | Already server-authoritative | Admin refund mutation is server-side and integrates with Stripe plus order state updates. |
| `AdminService.reconcileOrderPayment()` | `stripe-reconcile-order` Edge Function | Already server-authoritative | Admin payment repair is server-side and scoped to exceptional stuck orders. |
| `AdminStoreService` create/status/archive calls | `admin-store` Edge Function and service-role-only RPCs | Already server-authoritative | Browser requests an admin action; function verifies admin role and calls service-role RPCs for vendor/store mutations and audit coverage. |
| `StripeService.createOnboardingLink()` | `stripe-onboarding-link` Edge Function | Already server-authoritative | Browser requests onboarding; function gates access and creates Stripe Connect onboarding links server-side. |
| `StripeService.reconcileConnectStatus()` | `stripe-connect-status` Edge Function | Already server-authoritative | Browser requests a refresh; function reconciles live Stripe account state and persists canonical readiness server-side. |

Read-only browser Supabase calls remain for profiles, stores, products, orders, dashboard data, and order history. Realtime subscriptions in the order tracker and vendor dashboard are UX refresh paths, not sources of truth.

`app/src/lib/examples/TodoExample.tsx` is example code and is not routed in the active app.

## Server-Authoritative Boundary Map

| Workflow | Authoritative boundary | Supporting implementation |
| --- | --- | --- |
| Buyer order creation | Edge Function plus service-role RPC | `order-create`, `create_order_with_items_v1()` |
| Stripe Checkout | Edge Function | `stripe-checkout` |
| Stripe webhook finalization, payment failure handling, inventory finalization, and auto-refund after inventory failure | Signature-verified webhook and service-role database functions | `stripe-webhook`, `claim_stripe_webhook_event()`, `finalize_paid_order_inventory()` |
| Vendor/admin order transitions | Edge Function | `order-transition` |
| Admin refunds | Edge Function | `stripe-refund` |
| Admin payment reconciliation | Edge Function | `stripe-reconcile-order` |
| Vendor onboarding and store lifecycle | Edge Function plus service-role-only admin RPCs | `admin-store`, `admin_create_vendor_store_v1()`, `admin_update_store_status_v1()`, `admin_archive_store_v1()` |
| Stripe Connect onboarding and status refresh | Edge Functions | `stripe-onboarding-link`, `stripe-connect-status` |
| Notification queue dispatch and provider webhooks | Secret/signature-protected functions and service-role paths | `notification-dispatch`, `resend-email-webhook`, `whatsapp-status-webhook` |
| Audit logs, notification logs, Stripe processed events | Service-role paths and RLS-protected admin reads | RLS policies in migrations and service-role function calls |

## RLS And Storage-Protected Browser Writes

Seller product management is intentionally left as a browser-side Supabase write for closed-pilot launch.

Current safeguards:

- product `INSERT` and `UPDATE` policies require the target `store_id` to belong to the authenticated user's non-deleted store
- product soft-delete is an `UPDATE`, so it uses the same ownership boundary
- active products are publicly readable only when their store is active and non-deleted
- admin product access is role-gated through `public.is_admin()`
- product image storage uploads must use `product-images/products/<store_id>/...`
- storage insert/update policies require either admin role or ownership of the store id in the path
- the bucket is restricted to PNG, JPEG, and WebP with a 5 MiB limit

This is acceptable for closed pilot because the remaining browser writes are operational content-management writes scoped to owned stores. They do not create orders, change payment state, issue refunds, alter roles, create vendor stores, mutate another tenant's store, write audit history, write notification state, or process webhooks.

Roadmap hardening trigger:

- move product CRUD and image handling behind Edge Functions or a focused backend if SKIIP adds richer moderation, product approval workflows, stronger audit requirements, multi-event ownership, cross-store operator roles, or a broader backend upgrade.

## Follow-Up Tracking

No new high-risk untracked browser-side privileged write was found.

Risk-ranked existing follow-up coverage:

| Risk | Issue | Boundary area |
| --- | --- | --- |
| P0 | [#17 Audit and lock environment and secret parity across Vercel, Supabase, Stripe, and notifications](https://github.com/DK-Digital-Designs/skiip/issues/17) | Live secret/origin/provider parity. |
| P0 | [#16 Add end-to-end Stripe payout, refund, and reconciliation checks for launch readiness](https://github.com/DK-Digital-Designs/skiip/issues/16) | Stripe payout, refund, and reconciliation rehearsal. |
| P1 | [#47 Fix Supabase database linter security warnings](https://github.com/DK-Digital-Designs/skiip/issues/47) | Database security lint cleanup. |
| P1 | [#48 Resolve GitHub dependency security and quality alerts](https://github.com/DK-Digital-Designs/skiip/issues/48) | Dependency/security alert cleanup. |
| P1 | [#18 Complete notification provider verification and outbox recovery operations](https://github.com/DK-Digital-Designs/skiip/issues/18) | Notification provider and backlog recovery verification. |
| P1 | [#19 Expand staging smoke coverage and seed discipline for buyer, seller, and admin flows](https://github.com/DK-Digital-Designs/skiip/issues/19) | Authenticated buyer/seller/admin smoke confidence. |
| P1 | [#39 Verify admin refund flow against Stripe test mode and app state](https://github.com/DK-Digital-Designs/skiip/issues/39) | Admin refund end-to-end behavior. |
| P1 | [#46 Plan beta-to-production readiness hardening](https://github.com/DK-Digital-Designs/skiip/issues/46) | Broader beta-to-production hardening plan. |
| P2 | [#26 Implement or retire marketing-site lead capture that currently stores only in browser localStorage](https://github.com/DK-Digital-Designs/skiip/issues/26) | Marketing-site lead capture decision, outside product app runtime truth. |

Completed related fix:

- [#45 Make post-mutation notification queueing best-effort](https://github.com/DK-Digital-Designs/skiip/issues/45)

## Verification Performed

This audit was built by searching `app/src` for:

- direct Supabase table writes: `.insert(`, `.update(`, `.upsert(`, `.delete(`
- Edge Function calls: `functions.invoke(`
- RPC calls: `.rpc(`
- storage writes: `.upload(` and `.remove(`
- auth mutations: `signUp`, `signInWithPassword`, `signOut`, `resetPasswordForEmail`, `updateUser`, and `PASSWORD_RECOVERY`
- realtime subscriptions: `.channel(` and `postgres_changes`

Findings were cross-checked against:

- [`docs/ARCHITECTURE.md`](../ARCHITECTURE.md)
- [`docs/reference/RLS_ACCESS_MATRIX.md`](RLS_ACCESS_MATRIX.md)
- [`supabase/config.toml`](../../supabase/config.toml)
- authoritative migrations in [`supabase/migrations`](../../supabase/migrations)

No runtime behavior was changed as part of the original audit. The browser-write inventory was later amended to include the password-recovery hotfix.
