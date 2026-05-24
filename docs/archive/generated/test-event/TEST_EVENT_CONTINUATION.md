# SKIIP Test Event Continuation Notes

Last known repo state:

- Local branch: `main`
- Local main was fast-forwarded from `origin/main`
- Merged hotfix commit on main: `4f43553`
- Hotfix PR: https://github.com/DK-Digital-Designs/skiip/pull/64

## Already Applied

- Supabase DB migrations were pushed to hosted project `jmqjuvfjthwbsbelgccs`.
- No pending remote migrations after push.
- Changed Supabase functions were deployed:
  - `order-create`
  - `stripe-checkout`
  - `admin-store`
- Hosted `app_settings.launch_event` now contains:
  - `FOOD WITHOUT THE QUEUE`
  - `Order food and drinks from your phone and collect when it's ready.`
- Production QR URL returned `200`:
  - `https://www.skiip.co.uk/?utm_source=nm&utm_medium=qr&utm_campaign=sawft_test_event&utm_content=event_entry#/order`
- Live frontend bundle contains:
  - `FOOD WITHOUT THE QUEUE`
  - `Let's eat`
  - `Service Fees`

## Passed Locally

- `npm run test -- src/lib/orders.test.js src/lib/vendor-tags.test.js src/lib/launch-event.test.js`
- `npm run build`
- `npm run test:e2e`
  - Public smoke passed.
  - Authenticated buyer/seller/admin smoke skipped because Playwright credentials are not set.
- `deno test --allow-env supabase/functions/tests/notifications-best-effort-test.ts supabase/functions/tests/order-transitions-test.ts supabase/functions/tests/whatsapp-guard-test.ts`
- Hosted SQL rollback checks passed through `supabase db query --linked`:
  - `supabase/tests/create_order_with_items_v1_service_fee.sql`
  - `supabase/tests/create_order_with_items_v1_rollback.sql`

## Email Status

Before you fixed Resend, recent email notification failures were:

```text
Resend API error: The skiip.co.uk domain is not verified.
```

You said this is now fixed by moving/setting up the correct SKIIP Resend domain/account.

Important: old failed rows may not automatically retry if they were marked as non-retryable. For the test event, the safest verification is to create a fresh test order after the Resend domain fix.

## Final Live Smoke Checklist

1. Open the production QR URL on a phone.
2. Create a fresh buyer test order.
3. Confirm checkout shows:
   - Items subtotal
   - Optional tip
   - `Service Fees` = GBP 2.00
   - Total = subtotal + tip + GBP 2.00
4. Pay in Stripe.
5. Confirm Stripe Checkout has a separate `Service Fees` line item.
6. Confirm order becomes `paid`.
7. Confirm `notification_logs` has `email / order_paid` as `sent` or `delivered`.
8. Mark the order `ready`.
9. Confirm `notification_logs` has `email / order_ready` as `sent` or `delivered`.
10. Move the order through:
    - `paid`
    - `preparing`
    - `ready`
    - `collected`
11. Confirm vendor/admin revenue does not treat the GBP 2 service fee as vendor revenue.
12. Keep WhatsApp disabled or allowlisted unless Twilio/Meta is definitely healthy.

## Useful Commands

Check deployed function versions:

```powershell
app\node_modules\.bin\supabase.cmd functions list --project-ref jmqjuvfjthwbsbelgccs
```

Check required email secret names exist:

```powershell
app\node_modules\.bin\supabase.cmd secrets list --project-ref jmqjuvfjthwbsbelgccs
```

Check recent notification statuses without exposing recipients:

```powershell
app\node_modules\.bin\supabase.cmd db query --linked "set statement_timeout = '10s'; select channel, event_type, status, count(*)::int as count from public.notification_logs where created_at >= now() - interval '1 day' group by channel, event_type, status order by channel, event_type, status;"
```

Check recent email failure reasons:

```powershell
app\node_modules\.bin\supabase.cmd db query --linked "set statement_timeout = '10s'; select created_at, event_type, status, left(coalesce(error_message, ''), 240) as error_message from public.notification_logs where channel = 'email' and created_at >= now() - interval '1 day' order by created_at desc limit 10;"
```

Check a specific test order's notifications:

```powershell
app\node_modules\.bin\supabase.cmd db query --linked "select o.order_number, nl.channel, nl.event_type, nl.status, nl.error_message, nl.created_at, nl.sent_at from public.notification_logs nl join public.orders o on o.id = nl.order_id where o.order_number = 'PASTE_ORDER_NUMBER_HERE' order by nl.created_at desc;"
```

## Only Requeue If Needed

Prefer a fresh test order. If you must requeue old failed email rows, only do it for a known test order, not globally.

Example shape:

```sql
update public.notification_logs nl
set status = 'queued',
    error_message = null,
    failed_at = null,
    processing_started_at = null,
    next_attempt_at = now(),
    dispatch_attempts = 0
from public.orders o
where o.id = nl.order_id
  and o.order_number = 'PASTE_TEST_ORDER_NUMBER_HERE'
  and nl.channel = 'email'
  and nl.status = 'failed';
```

Then trigger the `notification-dispatch` function or create a fresh event.
