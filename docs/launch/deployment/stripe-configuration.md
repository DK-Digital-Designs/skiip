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
- seeded test seller accounts are not automatically Stripe-onboarded by the repo seeding scripts
