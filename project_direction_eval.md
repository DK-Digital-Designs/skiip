# SKIIP — Project Direction Evaluation (14 April 2026)

## Summary Verdict

> **The project is firmly headed in the right direction.** Today's overhaul was the most structurally important day of the project so far. You moved from a demo-quality, client-trusting codebase to a server-authoritative, production-hardened backend. The right architecture is now in place to support a real pilot.

---

## What Changed Today & Why It Matters

### 1. Server-Authoritative Order Creation (`order-create`)

**Old approach**: The frontend called a database RPC (`create_order_v1`) directly with client-supplied prices.
**New approach**: A server-side Edge Function validates the order, fetches prices from the database itself, and inserts the order.

```
Old: Frontend → DB (trust client prices)
New: Frontend → Edge Function → DB (server re-prices everything)
```

**Verdict**: ✅ Critical improvement. This closes the most serious vulnerability in a payments system: a customer manipulating the price on the way to Stripe. The new function correctly re-fetches and validates prices, checks inventory before creating the order, and rejects unavailable products.

---

### 2. Price Re-Validation at Checkout (`stripe-checkout`)

The `stripe-checkout` function not only takes the order to Stripe — it re-validates the subtotal **again** by summing `order_items` and comparing against the stored total:

```
if (Math.abs(computedSubtotal - storedSubtotal) > 0.01) → reject
```

**Verdict**: ✅ This is textbook defence-in-depth. A tampered order can't make it to Stripe even if it somehow got past `order-create`. The 10% platform fee application via `payment_intent_data.application_fee_amount` is also exactly correct for Stripe Connect.

---

### 3. Atomic Inventory Finalization (`stripe-webhook` + `finalize_paid_order_inventory`)

Payment confirmation now triggers an atomic DB function that decrements stock under a row-level lock. If stock is insufficient _at the moment of payment_, it auto-refunds via Stripe and creates an audit entry.

**Verdict**: ✅ This is the right answer for a festival/concurrency environment. The failure path (refund + restock + audit) is clean. The remaining known risk `Double buys` in the TO-DO list is now significantly reduced by this locking approach.

---

### 4. Idempotent Webhook Processing

The `stripe_processed_events` table prevents the same Stripe event from being processed twice by catching the unique constraint error (`23505`).

**Verdict**: ✅ Production essential. Stripe can and does re-deliver events. Without this, a network hiccup could result in double inventory deductions or double refunds.

---

### 5. State-Machine Order Transitions (`order-transition`)

The `ALLOWED_TRANSITIONS` map enforces that orders can only move through legal states:

```
pending → (payment only, no manual skip)
paid → preparing | cancelled
preparing → ready | cancelled
ready → collected | cancelled
collected → (terminal)
```

**Verdict**: ✅ Correct. Vendors cannot skip states or move orders backward. Cancellations correctly trigger inventory restock only if inventory was previously committed. Audit log entries are created for every transition.

---

### 6. Notifications Architecture (`_shared/notifications.ts`)

All transactional notifications (email via Resend, WhatsApp via Twilio) are now dispatched server-side, gated on environment variables being present. If `RESEND_API_KEY` is missing, email is silently skipped. If the Twilio WhatsApp vars are missing, WhatsApp is silently skipped. Both are logged.

**Verdict**: ✅ The graceful degradation pattern is correct. The system doesn't crash if you only have some notification providers configured. The dual `Promise.allSettled` dispatch means one failing provider doesn't kill the other.

---

## Remaining Risks & Open Items

| Risk                                               | Severity  | Status                                      |
| :------------------------------------------------- | :-------- | :------------------------------------------ |
| 401 on `order-create` in production                | 🔴 High   | Blocked — suspected Vercel env var mismatch |
| `fix_seller_order_updates.sql` not applied         | 🟡 Medium | Vendors can't update orders until pushed    |
| No `RESEND_API_KEY` configured                     | 🟡 Medium | Email receipts silently skipped             |
| `stripe-onboarding-link` uses `verify_jwt = false` | 🟡 Medium | Acceptable now; tighten before scale        |
| WhatsApp deferred (no Twilio keys)                 | 🟢 Low    | Correctly skipped, no crash risk            |
| Blank screen bug (TO-DO)                           | 🟡 Medium | Still open from earlier work                |
| Real-time push dropping on vendor dashboard        | 🟡 Medium | Still open                                  |

---

## What Tomorrow Should Prove

If the 401 is resolved (Vercel env vars synced to `jmqjuvfjthwbsbelgccs`), one clean buyer-to-vendor transaction should demonstrate:

1. Order created server-side with server-priced items
2. Inventory checked before creation
3. Stripe Checkout session opened with correct GBP amounts
4. Webhook fires → order marked `paid` → inventory committed atomically
5. Vendor sees order as `paid` in dashboard
6. Vendor moves through `preparing → ready → collected`
7. Audit log has a clean entry for every step

That is a complete, production-quality order lifecycle. **The architecture supports it today.** The only thing blocking you is the auth context sync.

---

## Overall Assessment

| Dimension                 | Score | Notes                                                                                                                         |
| :------------------------ | :---- | :---------------------------------------------------------------------------------------------------------------------------- |
| **Security**              | 9/10  | Server-authoritative, price-validated, idempotent webhooks. Only gap: onboarding link doesn't verify JWT.                     |
| **Data Integrity**        | 9/10  | Atomic inventory, audit logs, state machine transitions.                                                                      |
| **Resilience**            | 8/10  | Graceful notification degradation, auto-refund on inventory failure. Real-time reliability still a known risk.                |
| **Operational Readiness** | 7/10  | Functions deployed, secrets pushed, tests passing. Still need confirmed Vercel env sync and one live order to prove the loop. |
| **Code Quality**          | 8/10  | Shared auth/service/notification helpers are clean and reusable. Minor: `any` types in notifications.ts could be tightened.   |
