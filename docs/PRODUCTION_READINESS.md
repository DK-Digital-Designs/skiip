# SKIIP Closed Pilot Production Readiness

## What Changed
- Authenticated checkout is now the only supported buyer path.
- Order creation is server-authoritative via the `order-create` edge function.
- Vendor order progression uses the `order-transition` edge function.
- Refunds are admin-driven through the `stripe-refund` edge function.
- Stripe checkout and webhook handling now rely on authoritative order data.
- Notification delivery is tracked for both email and WhatsApp.
- Admin reporting now uses production-oriented metrics rather than sample summaries.

## Required Environment
- Separate Supabase projects for staging and production.
- Separate Stripe accounts/webhook secrets for staging and production.
- Twilio WhatsApp templates for:
  - order confirmation
  - preparing
  - ready for pickup
  - cancelled
  - refunded
- Resend or compatible email provider keys:
  - `RESEND_API_KEY`
  - `NOTIFICATION_FROM_EMAIL`

## Required Supabase Secrets
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_NUMBER`
- `TWILIO_WEBHOOK_TOKEN`
- `TWILIO_TEMPLATE_ORDER_CONFIRMATION`
- `TWILIO_TEMPLATE_ORDER_PREPARING`
- `TWILIO_TEMPLATE_READY_FOR_COLLECTION`
- `TWILIO_TEMPLATE_ORDER_CANCELLED`
- `TWILIO_TEMPLATE_ORDER_REFUNDED`
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`

## Verification Checklist
- Buyer can sign in, create an order, and reach Stripe checkout.
- Stripe webhook marks the order as `paid` and commits inventory.
- Vendor can move `paid -> preparing -> ready -> collected`.
- Admin dashboard shows paid revenue, refunded revenue, vendor performance, and notification failures.
- Admin refund updates order state and sends customer notifications.
