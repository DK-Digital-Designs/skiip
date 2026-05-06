# SKIIP Meeting Preparation Pack

## Purpose

This document is for preparing and guiding the upcoming SKIIP meeting.

The goal is to keep the discussion grounded in the actual state of the app, separate MVP/closed-pilot work from launch-ready work, confirm the remaining scope, and handle pricing/payment in a way that is fair and clearly tied to what is included.

---

# 1. Core Meeting Position

## Short Version

SKIIP is no longer just an idea or a basic prototype. The core operational loop exists and is in a workable closed-pilot state.

The right framing for the meeting is:

> The main SKIIP ordering loop has been built. The next step is to agree what is required to move it from a closed-pilot MVP into a launch-ready product, and to make sure the final price and payment plan match that agreed scope.

## What We Should Avoid

Do not let the meeting become only about whether the number should be R25k, R27k, or R30k.

The stronger position is:

1. Show what has already been built.
2. Clarify what is genuinely required before launch.
3. Separate launch-critical work from future roadmap work.
4. Tie the final price to the final agreed scope.
5. Keep maintenance, event support, hosting, and third-party costs separate.
6. Confirm everything in writing before major final launch work continues.

---

# 2. Current Product Truth

## Current State

SKIIP is currently in a workable closed-pilot state for the core buyer -> payment -> vendor -> admin loop.

The main product flow that exists today is:

- Buyer signs up or logs in.
- Buyer browses vendors/products.
- Buyer creates an authenticated checkout order.
- Order pricing is calculated server-side, not trusted from the browser.
- Buyer is redirected to Stripe Checkout.
- Stripe webhook confirms payment and marks the order as paid.
- Inventory is finalized after successful payment.
- Vendor receives the paid order and moves it through the active workflow.
- Admin can view operational metrics and issue refunds.

## What Has Already Been Built

### Buyer Flow

- Shared login/signup.
- Authenticated checkout.
- Vendor list and menu/product browsing.
- Cart and checkout flow.
- Stripe Checkout redirect.
- Order tracker with live updates.
- Buyer order history/profile area.

### Vendor Flow

- Seller login.
- Invite-code-gated vendor signup route.
- Store lookup for authenticated sellers.
- Product/menu management.
- Active/all order views.
- Order lifecycle: `paid -> preparing -> ready -> collected`.
- Cancellation path.
- Stripe Connect onboarding link generation.

### Admin Flow

- Admin dashboard metrics.
- Recent order visibility.
- Vendor performance summary.
- Notification health summary.
- Refund actions.
- Vendor/store management.
- Placeholder events route exists, but event management itself is not implemented yet.

### Backend and Payments

- Server-authoritative order creation.
- Stripe Checkout integration.
- Stripe Connect onboarding for vendors.
- Stripe webhook idempotency tracking.
- Payment finalization through webhook.
- Inventory finalization after successful payment.
- Automatic refund path if inventory finalization fails after payment.
- Admin refund path.
- Payment failure recording.
- Audit logging for key order/payment events.
- Queue-backed notification dispatch with delivery webhook support.

## Important Runtime Truths

These points matter because they affect launch scope and commercial expectations:

- Buyer checkout is authenticated only.
- Checkout currency is currently GBP.
- Stripe Connect onboarding is currently set up for GB Express accounts.
- The current platform fee logic is 10% of order subtotal.
- Protected edge functions currently use manual bearer validation.
- Notifications are architected for Resend email and Twilio WhatsApp, but provider setup, secrets, and end-to-end verification still matter.
- The static marketing site is separate from the product app and should not be treated as the operational source of truth.
- Marketing-site waitlist/contact capture is currently not production-grade lead capture.

---

# 3. MVP, Launch-Ready, and Future Roadmap

## Better Framing

Instead of treating the conversation as "MVP vs final product", use three buckets:

1. **Closed-pilot MVP**: the core loop works and can be tested in controlled conditions.
2. **Launch-ready product**: the core loop is hardened, verified, documented, and operationally ready.
3. **Future platform**: larger product expansion after real usage and feedback.

## Closed-Pilot MVP

This is where SKIIP broadly is now.

It means the app is real enough to test the business flow:

- Buyer can order.
- Vendor can handle paid orders.
- Admin can monitor and refund.
- Stripe integration exists.
- Core data and audit flow exists.

It does not mean every future feature, operational tool, or scale concern is solved.

## Launch-Ready Product

Launch-ready should mean the product has passed specific operational checks, especially around:

- auth and access control
- payments
- refunds
- vendor onboarding
- notifications
- environment configuration
- role-based testing
- operator support process
- rollback/incident handling

This is not just visual polish. For SKIIP, launch-readiness is mostly about trust, payments, support, and event operations.

## Future Platform

These should be treated as roadmap items unless explicitly priced into the current phase:

- true multi-event management
- advanced organiser tooling
- stronger vendor search/filtering at high order volume
- deeper payout/reconciliation dashboards
- QR/event operations utilities
- buyer notification history
- broader buyer account management
- production-grade marketing-site lead capture
- full UI/design-system cleanup
- larger scale/load testing

---

# 4. Launch-Readiness Gaps to Discuss

These are the most grounded remaining items to raise in the meeting.

## Technical and Operational Gates

Before calling SKIIP launch-ready, we should confirm:

- Final auth posture is agreed and signed off.
- RLS/access-control audit is complete for buyer, seller, admin, and service-role paths.
- Vercel app variables, Supabase secrets, Stripe keys, notification provider keys, and webhook endpoints all match the intended environment.
- `ALLOWED_ORIGINS` is explicitly set for hosted environments.
- A full buyer -> payment -> webhook -> vendor -> admin refund rehearsal has passed.
- Stripe Connect payout behavior has been tested with a real/onboarded GB seller account.
- Notification provider setup is complete for Resend and Twilio if they are part of launch.
- Notification retry/backlog process is defined.
- Signup UX matches the actual auth confirmation policy.
- Vendor onboarding path is agreed: admin-created sellers, invite-code signup, or both.
- `/admin/events` is either replaced, hidden, or clearly marked as future scope.
- Marketing site contact/waitlist forms are either made operational or treated as non-operational for launch.

## Product Decisions Needed

The SKIIP team should confirm:

- What does "launch-ready" mean for the first public/real event?
- Is the first launch a controlled pilot, a public launch, or a single-event test?
- Which vendor onboarding path do they want?
- Is WhatsApp required for launch, or is email plus manual support enough?
- Is the 10% platform fee the intended model, a placeholder, or something to revisit?
- Who handles vendor setup, menu setup, order support, refunds, and event-day escalation?
- Does SKIIP expect live DK Digital support during events?

---

# 5. Suggested Meeting Agenda

## 1. Opening

Suggested wording:

> Thanks for making time to chat. The main thing we want to do tonight is walk through where the product currently is, get your feedback, and clearly define what still needs to be done before we call it launch-ready. From there, we can finalise the remaining scope, price, payment schedule, and contracts properly.

## 2. Current Product Walkthrough

Walk through the actual platform in this order:

1. Buyer flow.
2. Vendor flow.
3. Admin flow.
4. Payment/refund flow.
5. Notifications and operational support.

## 3. Current State vs Launch State

Frame the app as:

- core closed-pilot loop: built
- launch hardening: needs confirmation
- future platform: roadmap

Suggested wording:

> The core loop is in place. What we need to decide tonight is what has to be included before launch, what can wait until after the first real test, and what should be treated as a separate future roadmap.

## 4. Scope Confirmation

Sort all feedback into three groups:

1. Already built.
2. Required before launch.
3. Future improvement.

This is the most important practical output of the meeting.

## 5. Commercial Discussion

Discuss price only after scope is clearer.

Suggested wording:

> We understand the R25k-R27k range that was suggested. From our side, the important point is that the final amount needs to match the final agreed scope. R25k can work only if everyone is clear about what it includes and what it does not include.

## 6. Contracts and Next Steps

End by confirming:

- final remaining requirements
- included/excluded scope
- final amount
- payment schedule
- invoice timing
- contract timing
- launch plan

---

# 6. Walkthrough Talking Points

## Buyer Walkthrough

Show:

- login/signup
- vendor selection
- menu/products
- cart
- checkout
- order tracker
- order history/profile

Explain:

> The buyer flow is focused on proving the ordering journey. The buyer can authenticate, browse vendors, build a cart, submit an order, pay through Stripe, and track order progress.

## Vendor Walkthrough

Show:

- seller login
- product/menu management
- active orders
- all orders
- status updates
- Stripe onboarding link

Explain:

> The vendor side is built around live event handling: seeing paid orders, preparing them, marking them ready, and completing collection.

## Admin Walkthrough

Show:

- dashboard metrics
- recent orders
- vendor performance
- notification health
- refund action
- vendor/store management

Explain:

> The admin side gives visibility and control over live operations, especially refunds, vendor management, and operational health.

Also be clear:

> Event management is not fully implemented yet. The `/admin/events` area exists as a placeholder, so if event-management tooling is expected before launch, that needs to be added to the confirmed scope.

## Backend and Payment Explanation

Suggested wording:

> A lot of the important work is not only what is visible on the screen. The system creates orders server-side, recalculates totals server-side, uses Stripe Checkout, processes payment confirmation through Stripe webhooks, finalizes inventory after payment, records audit events, and supports refunds from the admin side. That is why this should be treated as an operational platform, not just a basic website.

---

# 7. Pricing and Payment Discussion

## Pricing Position

The pricing conversation should stay scope-based.

The key point:

> R25k may be workable for the closed-pilot core build if the scope is tightly defined. If SKIIP expects additional launch hardening, operational setup, event support, marketing-site work, or new product features, that needs to be priced separately or added as a defined top-up.

## Why the Build Has Real Value

SKIIP includes work that carries operational and financial responsibility:

- authenticated customer checkout
- vendor order handling
- Stripe payments
- Stripe Connect vendor onboarding
- platform fee logic
- refunds
- inventory finalization
- audit logging
- notification architecture
- admin operational tooling

The value is not just in building screens. The value is in creating a platform foundation that can handle real orders, real payments, and real event operations.

## Client-Provided Billing Schedule

Do not edit this table. This is the schedule proposed by Nkosi based on a currently assumed R25k total.

| Payment   |        Date |      Amount |
| --------- | ----------: | ----------: |
| #1        | Immediately |      R5,000 |
| #2        |  5 May 2026 |      R5,000 |
| #3        | 20 May 2026 |      R8,500 |
| #4        | 5 June 2026 |      R1,500 |
| #5        | 5 June 2026 |      R5,000 |
| **Total** |             | **R25,000** |

## Our Response Table

Use this as our own scope/price response without changing their payment table.

| Option | Scope Position | Included Value | Price Position | Payment Handling |
| --- | --- | --- | ---: | --- |
| A | Accept R25k for closed-pilot MVP only | Current core build, walkthrough, written scope confirmation, basic handover, and minor bug/polish items already within the agreed MVP | R25,000 | Client schedule can apply as proposed, but anything outside MVP is separate |
| B | Recommended middle ground | Closed-pilot MVP plus a defined launch-prep pack: final scope write-up, one full guided buyer-to-vendor test rehearsal, launch checklist review, basic provider/config handover, and small agreed launch polish | R27,000 | Use the client schedule as the base, with the extra R2,000 paid as a top-up on or before the 20 May payment |
| C | Launch-ready hardening phase | Everything in Option B plus deeper launch hardening: auth/RLS review, environment parity checks, notification setup verification, Stripe Connect payout rehearsal, refund rehearsal, and operational support process | R30,000-R33,000 depending confirmed scope | Client schedule covers the first R25,000; remaining balance paid as an agreed launch-phase top-up before launch handover |
| D | Future roadmap / post-launch work | Event management, advanced admin tools, marketing-site lead capture, QR utilities, broader reporting, major UI redesign, subscriptions/commission changes, or multi-event tooling | Quote separately | Separate written quote and timeline |

## Recommended Position

The best position is Option B unless they expect true launch hardening immediately.

Suggested wording:

> We can work with the R25k-R27k range if the included scope is clear. Our recommended middle ground would be R27k for the current closed-pilot MVP plus a defined launch-prep pack. If the expectation is a fully launch-ready product with deeper hardening, provider verification, payout rehearsal, and operational setup, then that should be treated as a separate launch-hardening phase.

## Questions to Clarify

- Is the R25k schedule intended to cover only the current MVP/core build?
- If we agree to R27k, can the additional R2k be included in the 20 May payment or paid as a separate top-up?
- If they want full launch-hardening work, are they comfortable treating that as a separate phase?
- What is the minimum paid amount required before final launch/handover work continues?
- When do contracts need to be signed?

---

# 8. Maintenance, Event Support, and Third-Party Costs

## Maintenance Is Separate From Development

The proposed monthly support fee should not be treated as payment for unlimited new feature development.

Proposed structure:

- R2,000/month.
- Includes 4 hours of support per month.
- Additional work billed at R500/hour unless otherwise agreed.

Suggested position:

- Maintenance covers agreed bug fixes, light support, and small technical tasks.
- New features or larger changes are quoted separately.
- Monthly support should have a clear hour allocation.
- Additional hours should be charged at the agreed hourly/project rate.
- The support agreement should be reviewed after six months.

## Event Support Is Separate

Live support during an event is operationally different from normal maintenance.

Suggested position:

- Event-day support should be billed separately.
- This can be a per-event support fee or an hourly event-support rate.
- The support expectation must be clear: standby only, active monitoring, refund support, vendor support, or full operational support.
- Recommended starting model: a per-event support fee, because operational responsibility scales with event activity.

Possible event-support models:

| Model | When It Makes Sense | Notes |
| --- | --- | --- |
| Per-event fee | Recommended starting model | Cleanest fit for an event-driven platform; more events means more operational responsibility |
| Hourly on-call | Occasional or irregular event support | Could use R500-R750/hour with a minimum booking |
| Monthly event package | Regular event schedule | Must define included events, included hours, response expectations, urgent-support scope, and overage billing |

## Third-Party Costs Are Separate

The following should not be silently absorbed into the build fee unless explicitly agreed:

- hosting
- domains
- Stripe fees
- Stripe account costs, if any
- Resend/email costs
- Twilio/WhatsApp costs
- SMS costs
- Sentry/logging costs
- any paid database/platform upgrades

---

# 9. Business Model Discussion

## Why It Matters

The business model affects product and technical decisions.

SKIIP may make money through:

- platform commission per order
- customer service fees
- event setup fees
- vendor participation fees
- vendor subscriptions
- featured vendor placement
- a combination of these

The current payment implementation includes a 10% platform fee on order subtotal. We should confirm whether that reflects the intended business model or is only a working assumption.

## Suggested Wording

> One thing that would help us plan the roadmap properly is confirming SKIIP's intended revenue model. The current payment flow includes platform-fee logic, but we should confirm whether the plan is commission, customer service fees, event fees, vendor subscriptions, or something else.
>
> We do not need to build every business-model feature into the MVP right now, but knowing the direction will help us make better decisions around payments, reporting, vendor payouts, refunds, and admin tools.

---

# 10. Contract Points

The contract should clearly include:

- final agreed build scope
- what is included in the current price
- what is excluded
- payment schedule
- top-up handling if final price is above R25k
- maintenance/support terms
- monthly support hour allocation
- rate for extra work
- event-day support terms
- hosting and third-party cost responsibilities
- Stripe/payment-provider responsibilities
- handover terms
- six-month support review or renegotiation clause
- early review trigger if workload, event volume, support requests, or platform usage exceeds expectations
- clear statement that DK Digital is not obligated to continue under outdated support pricing if no revised agreement is reached after the review

Suggested wording:

> Once scope and price are confirmed, we should move to signed contracts before continuing with major final launch work. That protects both sides and makes sure expectations are clear.

---

# 11. Questions to Ask During the Meeting

## Product and Launch Scope

1. What do you consider essential before SKIIP can launch?
2. Is the first launch a public launch, a controlled pilot, or a single-event test?
3. What does "final product" mean to you compared to the current closed-pilot product?
4. Are there features you expected that are not currently visible?
5. Which items can wait until after the first real event or pilot?
6. Is event management required before launch, or can it remain future scope?

## Testing and Feedback

7. Have you tested the current version fully as a buyer?
8. Have you tested the vendor/order management flow?
9. Have you tested admin refunds and vendor management?
10. Are there any bugs you have noticed?
11. Are there any screens or flows that feel unclear?
12. What feedback have you received from anyone else who has tested it?

## Payments and Operations

13. Is the 10% platform fee the intended model?
14. How should vendor payouts work operationally?
15. Who approves refunds?
16. Who handles failed payments or payment disputes?
17. Who will manage vendors and menus before events?
18. Who will be responsible for monitoring orders during an event?
19. Do you expect DK Digital to be available live during events?

## Notifications

20. Which notifications are essential for launch?
21. Is email enough for the first version?
22. Is WhatsApp required immediately, or can it be added/expanded after launch?
23. Who should receive order notifications?
24. Should customers receive receipts, status updates, or only ready-for-collection notices?
25. Who will provide and maintain Resend/Twilio accounts and templates?

## Commercial

26. Is the R25k-R27k range meant to cover only the closed-pilot MVP or a launch-ready version?
27. Are you comfortable with R27k if it includes a defined launch-prep pack?
28. If launch-hardening work is required, should it be added as a separate phase?
29. Does the proposed payment schedule still work if the final amount is above R25k?
30. When do you want contracts signed?
31. What date are you expecting the product to be launch-ready?

---

# 12. Suggested Closing Summary

## If Scope and Price Are Not Finalised

> Just to summarise what we have agreed: we have reviewed the current closed-pilot product, identified the remaining launch requirements, and separated immediate launch items from future improvements. From here, we will write up the confirmed scope and send through a final price/payment position based on what was discussed.

## If Scope and Price Are Finalised

> Based on what we have discussed, we are aligned on the current product state, the remaining launch requirements, and the commercial direction. We will write up the confirmed scope, final amount, and payment schedule, then send through the final invoice and contract documents for review.

---

# Appendix A: Post-Meeting Follow-Up Templates

## Option A: If Scope and Price Are Not Fully Finalised

Hi guys,

Thanks for the meeting tonight.

It was helpful to walk through the current SKIIP platform and discuss what is still required to move from the current closed-pilot version toward a launch-ready product.

From our side, the next step will be to summarise the remaining requirements, separate the immediate launch items from future improvements, and then confirm the final scope and price based on what was discussed.

Once that is confirmed, we can send through the final invoice/payment schedule and proceed with the contracts.

Thanks again.

## Option B: If Scope and Price Are Finalised

Hi guys,

Thanks for the meeting tonight.

Following our walkthrough and discussion, we are aligned on the current SKIIP progress, the remaining launch requirements, and the agreed commercial direction.

We will write up the confirmed scope, final amount, and payment schedule, then send through the final invoice and contract documents for review.

Thanks again, and we are looking forward to getting SKIIP ready for launch.

---

# Appendix B: Internal Partner Alignment

This appendix is for internal partner alignment before finalising the SKIIP agreement. It should inform the meeting position, but it does not need to be shared word-for-word with the client.

## Core Concern

SKIIP is not a typical website project.

It is:

- a live, revenue-generating platform
- event-driven, with usage spikes and real-time pressure
- connected to customers, vendors, orders, payments, refunds, and operational support
- a product that will require ongoing technical ownership if it succeeds

If pricing and responsibilities are structured incorrectly now, DK Digital risks:

- being locked into low monthly revenue with high responsibility
- absorbing event-day operational stress for free
- supporting a growing platform without proportional compensation
- letting maintenance become a catch-all for unlimited future work
- blurring the line between development, support, hosting, and event operations

## Required Contract Mechanism: Six-Month Review

A mandatory six-month pricing and support review clause should be included in the agreement.

Reason:

- event volume is unknown
- vendor adoption is unknown
- system load is unknown
- support demand is unknown
- live-event support demand is unknown
- future feature request volume is unknown

The agreement should state:

- initial support pricing is valid for the first six months after launch
- a mandatory review happens at month six
- pricing, support scope, included hours, and responsibilities can be adjusted based on actual usage
- an earlier review can be triggered if workload exceeds expectations
- if no revised agreement is reached, DK Digital is not obligated to continue under outdated pricing

This protects both sides: SKIIP gets a clear starting support arrangement, and DK Digital is not permanently locked into an unsustainable support model.

## Three Separate Services

We are delivering three distinct services. They must be separated clearly.

### Service 1: Once-Off Software Development

This covers the initial SKIIP Version 1 build based on agreed scope.

It includes the core platform work:

- buyer/attendee app
- vendor dashboard
- admin functionality
- core ordering flow
- core payment flow
- refund/admin operations
- initial platform foundation

Pricing position:

> The once-off development fee is being discussed around the R25,000-R31,000 range, depending on final confirmed scope. We are delivering Version 1 based on agreed scope, not a complete future-proof platform.

Risk if unclear:

- endless feature requests after launch
- future roadmap work treated as already included
- launch-hardening work absorbed into the original MVP price
- no clear boundary between Version 1 and future development

### Service 2: Monthly Maintenance Retainer

Proposed structure:

- R2,000/month
- includes 4 hours of support per month
- additional work billed at R500/hour unless otherwise agreed

Maintenance can cover:

- bug fixes for existing agreed features
- minor adjustments
- light support communication
- basic stability checks
- small technical fixes within included monthly hours

Maintenance should not include:

- new features
- major UI/UX changes
- major product changes
- infrastructure scaling
- event-day support
- new payment models
- new business-model logic
- full vendor onboarding operations
- marketing-site lead capture work
- major reporting/dashboard expansion

Risk if unclear:

> Maintenance becomes a catch-all, creating unlimited expectations under a fixed monthly fee.

### Service 3: Event / On-Call Support

Event support is the highest-risk service and must be treated separately.

SKIIP events involve:

- live orders
- live payment issues
- vendor issues affecting customer experience immediately
- urgent response expectations
- potential client expectation of instant technical support

Key principle:

> Event support is operational responsibility, not standard maintenance.

Recommended internal position:

> A per-event support fee is the cleanest starting model because event workload scales with event activity.

Other possible models:

- hourly on-call at R500-R750/hour with a minimum booking
- monthly event support package with defined event count, included hours, response expectations, urgent-support definition, and overage billing

Risk if bundled into maintenance:

- high-stress live-event work becomes unpaid
- increasing events create increasing workload without increasing revenue
- DK Digital becomes operationally responsible without matching compensation
- the project can become unsustainable even if SKIIP succeeds

## Infrastructure and Third-Party Costs

Hosting, database, payment processing, messaging, and related platform costs should be the client's responsibility unless explicitly agreed otherwise.

This includes:

- Vercel hosting
- Supabase database and auth costs
- Stripe processing fees
- Stripe Connect/payment-related costs, if any
- Resend/email costs
- Twilio/WhatsApp/SMS costs
- domains
- logging/monitoring tools
- required paid platform upgrades

DK Digital should not silently absorb these costs into the once-off build fee or monthly maintenance fee.

## Strategic Positioning

DK Digital is not only acting as a basic website developer on this project.

We are contributing as:

- platform developers
- technical architects
- payment-flow implementers
- operational support providers
- ongoing system maintainers

If SKIIP succeeds:

- usage will increase
- support demand may increase
- event pressure will increase
- reliance on DK Digital may increase
- system complexity will increase

Therefore:

- pricing must be able to scale with usage
- responsibilities must be clearly separated
- flexibility must be built into the contract
- future work must be scoped and priced properly

## Internal Decisions Required

Before finalising the agreement, align on:

- six-month support/pricing review clause
- early review triggers if workload exceeds expectations
- separation of once-off development, monthly maintenance, and event/on-call support
- preferred event support model
- maintenance boundaries
- initial Version 1 build boundaries

Recommended final internal position:

- clear service separation
- mandatory six-month pricing/support review clause
- independent event support pricing
- explicit maintenance boundaries
- clear infrastructure and third-party cost responsibility
- written scope confirmation before major final launch work continues

Do not proceed without these commercial protections being included in some form.

---

# Appendix C: Internal Reminder

Do not allow the meeting to become only about price.

The strongest position is:

- Show the value already delivered.
- Anchor the conversation in the real product state.
- Confirm what remains.
- Separate closed-pilot MVP from launch-ready work.
- Tie price to scope.
- Keep maintenance separate.
- Keep event support separate.
- Keep third-party costs separate.
- Get everything into writing.

Final reminder:

> Be flexible on payment timing if needed, but be careful about being too flexible on scope without pricing it properly.
