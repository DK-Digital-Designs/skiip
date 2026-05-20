# Client Launch Inputs Required

Prepared: 2026-05-19

Context: revised first-event deadline. The first live event is confirmed for Saturday, 30 May 2026. Launch scope is still to be decided by SKIIP.

## Purpose

This document lists the items still needed from SKIIP before the platform can be treated as ready for real customers, real vendors, and real payments at a live event.

The core buyer -> Stripe -> vendor -> admin flow exists in the product. What remains before launch is mostly outside the codebase: live provider setup, account ownership, real vendor configuration, operational sign-off, and rehearsals against the actual production setup.

## Immediate Position

SKIIP should not be treated as fully live-ready until the following are complete:

- Stripe live-mode setup is confirmed and one real low-value payment test has passed. DK Digital has access to the Stripe account and can handle the live-mode switch, but the live test still needs approval and a controlled timing window.
- At least one real vendor is onboarded through Stripe Connect and can receive orders.
- Twilio WhatsApp compliance, sender, templates, and test delivery are complete, or WhatsApp is explicitly disabled for the first event. WhatsApp is urgent if SKIIP wants it live on 30 May 2026.
- Real vendors, menus, prices, inventory, opening times, and support owners are confirmed.
- A full sandbox rehearsal and a controlled live test session both pass.

If ticket sales are still being considered for the first event, that should be treated as separate urgent scope. It should not be bundled into core food/vendor ordering readiness without a written scope, price, support expectation, and go/no-go date.

## Required From SKIIP

| Priority | Missing from SKIIP | Exact input needed | Why it matters |
| :--- | :--- | :--- | :--- |
| P0 | Launch scope and event details | Event date is confirmed as Saturday, 30 May 2026. Still confirm event times, venue, expected order volume, go-live deadline, go/no-go deadline, and whether launch is food/vendor ordering only or includes ticket sales. | The team cannot safely plan testing, support, vendor setup, or scope control without an agreed launch scope. |
| P0 | Stripe live-money approval | DK Digital has access to the Stripe account and can switch over to live-money mode. SKIIP still needs to approve the timing of that switch, approve a low-value live card test, confirm refund testing, and confirm whether the current platform fee model is final. | The platform is still being treated as sandbox/test-mode until a real live payment, webhook, refund, and reconciliation path has been proven. |
| P0 | Real vendor setup | Provide the final vendor list, vendor owner names, vendor emails, phone numbers, store names, store descriptions, logos or images, menu items, prices, stock/inventory, availability, collection instructions, and vendor device/staff readiness. | Test vendors do not prove event readiness. The real launch depends on actual vendors being configured, trained, and visible in the buyer flow. |
| P0 | Vendor Stripe Connect onboarding | Each real vendor must complete Stripe Connect onboarding and submit the required payout details, including bank details and any requested identity or business documents. Vendors should use clear colour document images and ensure names, business details, addresses, and registration details match exactly. | Vendors cannot safely accept paid orders until their connected account is ready and payout/payment routing has been tested. Stripe checks can be fast, but manual review or mismatched documents can take multiple business days, so this needs to start immediately. |
| P0 | Twilio WhatsApp compliance profile | Complete the SKIIP-owned Twilio WhatsApp compliance/business profile before number purchase or sender activation can be treated as ready. After compliance is accepted, the remaining setup still includes sender/number purchase or activation, account SID, auth/API key setup, approved templates, status callback, and smoke testing. | WhatsApp notifications cannot be treated as launch-ready until compliance, sender, templates, credentials, and delivery callbacks are verified against the final account. This is urgent if SKIIP wants WhatsApp for 30 May 2026. |
| P0 | WhatsApp launch decision | Confirm whether WhatsApp is required for the first event. If yes, provide the compliance/profile inputs and operator test numbers in E.164 format. If no, approve email/manual support as the first-event notification fallback. | The code has guardrails, but WhatsApp cannot be promised until the provider-side compliance and sender path is complete. |
| P1 | Email sender and customer copy | DK Digital can tweak the email format and presentation. SKIIP only needs to flag any brand, legal, support, or wording requirement that must appear in customer emails. | Email can be the fallback if WhatsApp is delayed, but legal/support wording still needs to be correct. |
| P1 | Production environment ownership and access | DK Digital owns and can handle the production environment setup across Vercel, Supabase, Stripe configuration, Resend, Twilio, secrets, and `ALLOWED_ORIGINS`. SKIIP only needs to approve any client-owned provider/account decisions and provide legal/commercial inputs where required. | Environment drift is still one of the highest launch risks, but this is now primarily a DK Digital/operator responsibility rather than a SKIIP input item. |
| P1 | Legal and customer policy text | Provide or approve terms, privacy wording, refund/cancellation policy, customer support wording, WhatsApp opt-in wording, and any vendor/customer legal text required for the event. | These are client compliance responsibilities and affect the checkout, notifications, refunds, and support process. |
| P1 | Event-day operations owner | Confirm who handles buyer support, vendor support, refunds, failed payments, order disputes, device issues, and escalation during the event. Confirm whether DK Digital is expected to provide live event support and for which hours. | A live event creates operational responsibility. Support expectations need to be written down before real customers are involved. |
| P1 | Production data cleanup approval | Confirm what test users, vendors, orders, carts, notifications, and audit/history data should be removed or kept before launch. | The production-facing environment should not carry stale test-era data into the first real event without an explicit decision. |
| P2 | Marketing and public lead-capture decision | Confirm whether the external marketing site is part of launch operations and whether contact/waitlist forms must capture real leads. | The product app is the operational ordering surface. Marketing lead capture is separate unless explicitly connected and tested. |
| P2 | Post-event reporting expectations | Confirm what SKIIP expects after the event: sales totals, vendor totals, refunds, notification performance, customer issues, or a fuller operations report. | Reporting can be prepared, but expectations should be agreed before the event so the right data is checked. |

## DK Digital / Operator-Owned Work

The following items are not blocked on SKIIP doing the technical work, but they still need to be completed before go-live:

- switch Stripe from sandbox/test mode to live mode at the agreed time
- configure live Stripe webhook endpoint and signing secret
- run one full sandbox payment session before live testing
- run one controlled live low-value payment session after SKIIP approves it
- verify payment return, webhook finalization, admin reconciliation, and refund behavior
- configure production Vercel/Supabase environment values and hosted origins
- configure production Resend and email formatting
- configure Twilio credentials and callback settings after SKIIP completes WhatsApp compliance/sender prerequisites
- run the final buyer, vendor, admin, notification, and cutover smoke checks

## Stripe Connect Timing Note

Stripe Connect onboarding is time-sensitive for the 30 May 2026 event.

Planning assumptions:

- Many automated identity and business checks can complete quickly when the supplied details match, sometimes within minutes.
- For planning, assume normal verification can still take up to about 3 business days.
- Manual review, unclear documents, name/address mismatches, or flagged business details should be allowed 1-5 business days.
- Vendors may be able to accept charges before all payout checks are complete, but payouts can be paused until verification requirements are resolved.
- A first Stripe payout commonly has an additional 7-14 day initial delay after the first successful live payment.

Vendor document hygiene matters:

- use clear colour images or PDFs
- ensure legal names match the identity document and business registration
- ensure business names, registration numbers, addresses, and bank details match the Stripe account details
- avoid cropped, blurry, expired, or inconsistent documents
- check the Stripe Dashboard immediately for any `currently_due`, `pending_verification`, or `disabled_reason` requirements

Stripe's dashboard remains the source of truth for the exact requirements on each vendor account.

Reference: Stripe documents that initial payouts are typically scheduled 7-14 days after the first successful payment, and that payout availability varies by industry and country. Stripe also documents that connected-account requirements can pause payouts or charges when required information is missing or pending verification. See [Stripe payout timing](https://docs.stripe.com/payouts) and [Stripe Connect verification handling](https://docs.stripe.com/connect/handling-api-verification).

## Verification After SKIIP Provides The Inputs

After the missing inputs are supplied, the following checks still need to be run before go-live.

1. Sandbox payment rehearsal
   - Buyer creates an order.
   - Stripe test checkout succeeds.
   - Stripe webhook marks the order paid.
   - Vendor sees the paid order.
   - Vendor moves the order through `paid -> preparing -> ready -> collected`.
   - Admin can see the reconciliation fields.
   - Admin refund path is tested against Stripe test mode.

2. Real low-value payment test
   - One real buyer card payment is made in live mode.
   - The order returns to the app correctly.
   - The live Stripe webhook updates the order.
   - The real connected vendor path is checked.
   - The refund or payout/reconciliation path is verified as agreed.

3. Vendor readiness pass
   - Each vendor logs in.
   - Each vendor can see their store and products.
   - Each vendor receives a test paid order.
   - Each vendor can move an order through the active lifecycle.
   - Each vendor understands the support/escalation route.

4. Notification smoke test
   - Email notification is sent and received.
   - WhatsApp test runs in allowlist mode.
   - Twilio message SID is recorded for an allowed test number.
   - Twilio status callback updates notification records.
   - A non-allowlisted number is blocked as expected.
   - Daily and per-dispatch WhatsApp caps are confirmed.

5. Production cutover smoke
   - Production app points to the intended production Supabase project.
   - Production Stripe webhook points to the production Supabase function.
   - Production notification callbacks point to the production functions.
   - Hosted origins are explicit and not relying on fallback origins.
   - Admin, vendor, and buyer access all work with the final accounts.

## Recommended First-Event Scope

The safest first-event scope is:

- food/vendor ordering
- Stripe card payments
- vendor dashboard fulfilment
- admin oversight
- refund and reconciliation support
- email notifications
- WhatsApp order-ready notifications only if Twilio setup is fully approved and tested

The following should be treated as separate scope unless agreed in writing:

- ticket sales
- QR ticket generation or scanning
- full event management
- advanced analytics
- custom admission workflow
- offline door operations
- major new feature work after the go/no-go deadline

## Practical Go/No-Go Rule

If the P0 items are not complete before the agreed go/no-go deadline, the safest options are:

1. Delay SKIIP live-money launch.
2. Run SKIIP as a tightly controlled pilot with a reduced vendor set.
3. Launch food/vendor ordering only and keep WhatsApp or ticket sales disabled until verified.

Real-money launch should not proceed only because the app can run in test mode. The launch decision should be based on the actual production account setup, real vendors, real provider configuration, and completed rehearsals.
