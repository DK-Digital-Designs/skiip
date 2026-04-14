# SKIIP Pilot Launch Runbook

## Before Launch
1. Deploy Supabase migrations to staging, then production.
2. Deploy edge functions:
   - `order-create`
   - `order-transition`
   - `stripe-checkout`
   - `stripe-webhook`
   - `stripe-refund`
   - `stripe-onboarding-link`
   - `whatsapp-notify`
   - `whatsapp-status-webhook`
3. Confirm Stripe webhook endpoint points at the deployed `stripe-webhook` function.
4. Confirm Twilio status callbacks resolve to `whatsapp-status-webhook`.
5. Confirm Resend sender domain is verified.

## Staging Rehearsal
1. Create one buyer, one vendor, and one admin account.
2. Run a full payment flow in Stripe test mode.
3. Verify:
   - paid order appears on vendor dashboard
   - paid notification is delivered
   - vendor can mark ready
   - ready notification is delivered
   - admin can refund the order
   - refund notification is delivered

## Incident Handling
- Payment captured but order not visible:
  - check `stripe_processed_events`
  - inspect `audit_logs`
  - inspect order status and `inventory_committed_at`
- Notification complaints:
  - inspect `notification_logs`
  - retry through the relevant server function only
- Inventory mismatch:
  - compare `order_items` to `products.inventory_quantity`
  - inspect recent refund/audit events before manual correction
