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
- checkout includes a fixed GBP 2.00 `Service Fees` line on new orders
- service fees are computed server-side in `order-create`; browser values are display-only
- application fees are calculated as `10%` of order subtotal plus GBP 2.00 in `stripe-checkout`
- vendor revenue reporting must exclude the GBP 2.00 service fee
- test-event full refunds include the service fee; partial/non-refundable service-fee handling is deferred

Important:

- the webhook signing secret must come from the exact hosted Stripe webhook endpoint in use
- do not mix Stripe CLI listener secrets with hosted endpoint secrets
- set `STRIPE_MODE=test` for test-mode endpoints and `STRIPE_MODE=live` for live endpoints; mismatched `event.livemode` webhooks are rejected before event claiming
- set `PAYMENTS_ENABLED=false` to pause only new Checkout Session creation while leaving live webhooks, refunds, reconciliation, disputes, and Connect status recovery available
- `PAYMENTS_ENABLED` is the Supabase environment master switch; Admin Settings `Checkout availability` writes `app_settings.payment_controls` and can pause/resume checkout only when the master switch is `true`
- live webhook endpoint API version must be pinned to `2023-10-16` while the edge functions remain on `stripe@14.x`
- `stripe-checkout` reuses an existing open Checkout Session for an order and uses a Stripe idempotency key for new session creation
- `account.updated` Connect events are matched to stores by `event.account` when present, otherwise by the account object's `id`
- `charge.dispute.created` records an audit row and emits an alert-worthy warning for operator follow-up
- seeded test seller accounts are not automatically Stripe-onboarded by the repo seeding scripts
