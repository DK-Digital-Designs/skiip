# Edge Functions

Read this when you need the edge functions details from [Deployment](../DEPLOYMENT.md).

Functions live in [`supabase/functions`](../../../supabase/functions).

Current critical functions:

- `order-create`
- `stripe-checkout`
- `stripe-webhook`
- `order-transition`
- `admin-store`
- `payment-control`
- `stripe-refund`
- `stripe-reconcile-order`
- `stripe-onboarding-link`
- `stripe-connect-status`
- `notification-dispatch`
- `resend-email-webhook`
- `whatsapp-status-webhook`
- `support-request`
- `admin-support-request`

Support request behavior:

- `support-request` accepts authenticated buyer and seller submissions and validates role-specific issue types and owned order/store links
- `support-request` sends a best-effort internal Resend email alert to `SUPPORT_ALERT_EMAIL`, defaulting to `info@skiip.co.uk`
- `admin-support-request` lists and updates private support cases for admin triage
- paid vendor cancellation through `order-transition` creates one high-priority `vendor_cancellation` case for refund review; it does not issue a refund

Current notification-dispatch behavior:

- business flows queue notification rows
- immediate sends are attempted in edge-runtime background work
- delayed retries or backlog sweeps require `notification-dispatch`

Important current limitation:

- no scheduler for `notification-dispatch` is defined in this repository
- if retry sweeps are required in staging or production, they must be triggered manually or by an external scheduler

Legacy compatibility note:

- `whatsapp-notify` is still configured and deployable
- the ordered migration chain removes the old database trigger that called it
- do not treat `whatsapp-notify` as part of the intended current production flow

Deploy functions:

```bash
supabase functions deploy
```

Set secrets:

```bash
supabase secrets set --env-file supabase/.env.functions
```
