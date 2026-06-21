# Stripe Configuration

Read this when you need the stripe configuration details from [Deployment](../DEPLOYMENT.md).

Webhook endpoint:

```text
https://<project-ref>.supabase.co/functions/v1/stripe-webhook
```

Events currently handled by code:

- `checkout.session.completed`
- `payment_intent.payment_failed`
- `account.updated`
- `charge.refunded`
- `charge.dispute.created`

Current payment specifics:

- checkout currency is `gbp`
- vendor onboarding creates Stripe Express accounts with `country = GB`
- onboarding currently requests `card_payments` and `transfers`
- vendor readiness is enforced through `stores.stripe_connect_status = 'ready'`
- `stripe-connect-status` reconciles live Stripe account state after onboarding return
- checkout includes a fixed buyer service fee of GBP 1.50 and sends a separate `Service Fee` line to Stripe Checkout
- service fees are still computed server-side in `order-create`; browser values are display-only
- Connect percentage application fees remain GBP 0 for the event, while the fixed GBP 1.50 service fee is still retained through `application_fee_amount`
- Stripe processing cost is recorded separately as `orders.stripe_fee`
- vendor revenue reporting should use subtotal plus tip, while service-fee retention is tracked separately
- test-event full refunds include item total, tips, and the retained service-fee allocation through the existing full destination-charge refund path
- full refunds on destination charges set `reverse_transfer` and `refund_application_fee` so the vendor transfer and platform allocation are reversed with the buyer refund

Important:

- the webhook signing secret must come from the exact hosted Stripe webhook endpoint in use
- do not mix Stripe CLI listener secrets with hosted endpoint secrets
- set `STRIPE_MODE=test` for test-mode endpoints and `STRIPE_MODE=live` for live endpoints; Stripe clients reject mismatched `sk_test_`, `rk_test_`, `sk_live_`, and `rk_live_` key prefixes at startup and mismatched `event.livemode` webhooks before event claiming
- set `PAYMENTS_ENABLED=false` to pause only new Checkout Session creation while leaving live webhooks, refunds, reconciliation, disputes, and Connect status recovery available
- `PAYMENTS_ENABLED` is the Supabase environment master switch; Admin Settings `Checkout availability` writes `app_settings.payment_controls` and can pause/resume checkout only when the master switch is `true`
- live webhook endpoint API version must be pinned to `2023-10-16` while the edge functions remain on `stripe@14.x`
- `stripe-checkout` reuses an existing open Checkout Session for an order and uses a Stripe idempotency key for new session creation
- `account.updated` Connect events are matched to stores by `event.account` when present, otherwise by the account object's `id`
- `charge.dispute.created` records an audit row and emits an alert-worthy warning for operator follow-up
- seeded test seller accounts are not automatically Stripe-onboarded by the repo seeding scripts
- payout timing, pending requirements, and manual or Instant Payout availability must be checked in the Stripe account before same-day settlement is promised
