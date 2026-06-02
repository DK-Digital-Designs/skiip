# Order and Payment Flow

Read this when you need the order and payment flow details from [SKIIP Architecture](../ARCHITECTURE.md).

The buyer checkout flow is server-authoritative.

Sequence:

1. Buyer signs in.
2. Buyer builds a cart in the browser. Cart state is stored locally via Zustand in `localStorage`.
3. [`Checkout.jsx`](../../app/src/pages/attendee/Checkout.jsx) submits only product IDs, quantities, contact details, optional WhatsApp opt-in, notes, and tip. The browser may display service fees, but it does not supply them authoritatively.
4. [`order-create`](../../supabase/functions/order-create/index.ts) validates the user, rejects malformed quantities, aggregates duplicate product IDs, loads products, checks inventory, computes subtotal/tip/service-fee/total on the server, persists `orders` and `order_items` atomically through `create_order_with_items_v1()`, and writes an `order_created` audit event.
5. [`stripe-checkout`](../../supabase/functions/stripe-checkout/index.ts) reloads the order, confirms ownership and payable state, verifies the store has completed Stripe onboarding, and creates a Stripe Checkout session.
6. Checkout is currently GBP-only, and vendor onboarding creates Stripe Express accounts with `country = GB`.
7. The buyer service fee is currently a fixed GBP 1.50 per order; the percentage Stripe Connect application fee remains 0, and Stripe processing fees are still retrieved and recorded during reconciliation.
8. Stripe redirects the buyer back to the hash-routed order tracker.
9. [`stripe-webhook`](../../supabase/functions/stripe-webhook/index.ts) verifies the signature, claims the event through retryable idempotency tracking, marks the order paid, records payment IDs and fee ledger fields, finalizes inventory atomically, and queues audit/notification side effects.
10. If inventory finalization fails after capture, the webhook auto-refunds and records a refund event.
11. [`payment_intent.payment_failed`](../../supabase/functions/stripe-webhook/index.ts) updates the order with failure timestamps and failure details.
12. Vendor or admin status changes go through [`order-transition`](../../supabase/functions/order-transition/index.ts).
13. Admin refunds go through [`stripe-refund`](../../supabase/functions/stripe-refund/index.ts), and full destination-charge refunds reverse the vendor transfer and application-fee allocation.
14. Admin payment repair for exceptional stuck orders goes through [`stripe-reconcile-order`](../../supabase/functions/stripe-reconcile-order/index.ts).

Vendor Connect readiness:

- [`stripe-connect-status`](../../supabase/functions/stripe-connect-status/index.ts) actively reconciles live Stripe account state after onboarding return.
- `stores.stripe_connect_status = 'ready'` is the canonical payment-readiness flag consumed by the dashboard and checkout.
- Raw Stripe account fields are persisted on `stores` for debugging only.

Current operational lifecycle:

- `pending -> paid -> preparing -> ready -> collected`
- `paid -> cancelled`
- `paid|preparing|ready -> refunded` through the admin refund path

Legacy order statuses still exist in the schema:

- `processing`
- `shipped`
- `delivered`

They are not part of the current UI or edge-function flow.
