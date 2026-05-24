# SKIIP Final Pre-Launch Meeting Pack

**Prepared for:** SKIIP final pre-launch decision meeting
**Meeting date:** 21 May 2026
**Prepared by:** Dean Gibson / DK Digital
**First event target:** Saturday, 30 May 2026
**Document status:** Working decision pack for client review, commercial alignment, and launch readiness sign-off

---

## 1. Purpose of This Pack

This pack is here to get everyone caught up and aligned before the first SKIIP launch window, so that there is nothing important left up in the air.

The project is coming along well. The goal of this meeting is not to reopen every historic conversation, but to confirm what has been completed, what is payable, what is launching in V1, what is deferred, what still needs to be tested, and who has authority to approve the final launch position.

The event is close. There are not ten clean working days left: DK Digital has fixed commitments and limited practical delivery capacity during the week leading into the 30 May 2026 launch. The remaining time should be spent on verification, provider setup, vendor readiness, and operational rehearsal - not on unclear scope, unpaid work, or informal assumptions.

The meeting should leave both parties with a written decision record covering:

- accepted completed work;
- payment date or payment plan;
- V1 launch scope;
- excluded/deferred items;
- Phase 6 launch activation scope and pricing;
- provider and vendor readiness;
- testing dates;
- event-day support ownership; and
- final go/no-go responsibility.

---

## 2. Executive Position

SKIIP is best described as a strong closed-pilot launch candidate.

The platform has moved beyond a simple MVP or visual prototype. The core buyer, vendor, admin, payment, refund, notification, audit, and operational foundations have been developed. The remaining work is not simply "finishing the app"; it is launch activation, provider verification, operational readiness, and commercial/legal sign-off.

Before real customers and vendors rely on the platform, the following must be aligned:

| Item | What It Means |
| --- | --- |
| Live payment setup | Stripe must be switched from test assumptions to the correct live configuration, including live keys, webhook endpoint, signing secret, and payment return behaviour. |
| Stripe Connect vendor readiness | Real vendors must complete Stripe Connect onboarding and outstanding identity, bank, payout, or business verification requirements. |
| Real vendor data | The launch environment must contain actual vendor names, owner contacts, menus, prices, stock, images, availability, and collection instructions. |
| Provider ownership and credentials | Vercel, Supabase, Stripe, Resend, Twilio, domain, sender, and webhook access must be owned, approved, and available under the agreed operating model. |
| WhatsApp or fallback decision | WhatsApp must either be provider-ready and smoke-tested, or explicitly deferred with email/manual support used as the first-event fallback. |
| Legal/customer wording | Terms, privacy, refund/cancellation, WhatsApp opt-in, support, and responsibility wording must be approved by the correct owner. |
| Event-day support ownership | Named people must own buyer support, vendor support, refunds, failed payments, disputes, escalation, and any pause-ordering decision. |
| Sandbox rehearsal | The full buyer -> Stripe test checkout -> webhook -> vendor -> admin -> refund path must be rehearsed before live-money testing. |
| Controlled live payment test | After approval, the team must run the smallest practical live purchase amount to prove live Stripe, webhook, vendor, and reconciliation behaviour. |
| Final go/no-go decision | A named decision-maker must confirm whether launch proceeds, launches in reduced scope, delays, or defers unresolved features. This is a formal launch decision, not a casual feeling that the app looks ready. |

---

## 3. Meeting Decisions Required

The meeting should not end without decisions on the following.

### Commercial

- Is the completed Phase 5+ application work accepted as delivered baseline work?
- Is the completed marketing-site work accepted as delivered work?
- What completed-work amount is accepted?
- What is the payment date or written payment plan?
- Is any amount disputed? If yes, exactly which item and why?
- Is Phase 6 approved as separate paid launch activation?
- Is event-day support required and separately payable?

### Scope

- Is the first event food/vendor ordering only?
- Is ticketing included through a reduced ticket-vendor option, or deferred?
- Is WhatsApp required or deferred?
- Are QR scanning and admission workflows deferred?
- Which remaining items are approved for V1?
- Which items are explicitly moved out of V1?

### Operations

- Who owns buyer support?
- Who owns vendor support?
- Who approves refunds?
- Who handles failed payments?
- Who has authority to pause ordering if needed?
- What is the final go/no-go deadline?

### Testing

- When is the sandbox group test happening?
- Who must attend?
- What buyer, vendor, and admin accounts will be used?
- Who signs off the result?
- When is the live low-value payment test happening?

### Decision Authority

SKIIP should confirm who has authority to make binding decisions on payment, payment plan, V1 scope, ticketing, WhatsApp, live Stripe testing, vendor readiness, event-day support, legal/customer wording, and final go/no-go.

If the authorised person is not present, the decision should be recorded as unresolved with a named owner and deadline. The project cannot safely proceed on informal "we will confirm later" assumptions during the final launch window.

---

## 4. V1 Lock Rule and Timeline

For the 30 May 2026 event, V1 should be treated as a controlled first-event release, not a catch-all for every idea discussed during the project.

V1 rule:

> If an item is not commercially approved, technically ready, supplied by the client where applicable, and tested by 24 May 2026, it is left out of V1 and moved to a post-launch or separately scoped phase unless DK Digital and SKIIP agree a narrower written exception.

| Date | Required Position | If Not Resolved |
| --- | --- | --- |
| 21 May 2026 meeting | Commercial position, V1 scope, payment path, decision authority, launch responsibilities | Launch acceleration remains blocked or reduced |
| 22 May 2026 close of business | Final vendor data, menus, event details, support owners, payment-plan confirmation, provider decisions | Missing items are at risk of V1 exclusion |
| 23 May 2026 | Big group sandbox test with final accounts and test Stripe flow | Launch confidence is materially reduced |
| 24 May 2026 | Hard cutoff for V1 inputs; controlled live data/live Stripe low-value test if ready | Anything unresolved is deferred for after launch and payment |
| 25-29 May 2026 | Only rehearsal defects, configuration fixes, vendor readiness support, and approved launch-critical fixes | No new feature requests, unresolved inputs, or untested features enter V1 |
| 30 May 2026 | First-event launch window | Launch proceeds only if payment position and P0 gates are resolved |

Earlier is better. The group sandbox test should ideally happen on 23 May 2026. The live data / live Stripe test should happen on 24 May 2026 only after the sandbox test, Stripe swap-over, and approval for low-value real purchases are ready.

---

## 5. Completed Work and Commercial Position

The work completed to date should be recognised as meaningful platform development and launch-risk reduction.

Completed areas include:

- buyer ordering, checkout, tracking, and account/history surfaces;
- vendor dashboard, product management, order queue, and fulfilment status flow;
- admin dashboard, vendor management, refunds, and reconciliation visibility;
- server-authoritative order creation;
- Stripe Checkout and Stripe Connect support;
- webhook-driven payment finalisation;
- payment failure tracking and recovery paths;
- refund and reconciliation functions;
- inventory checks and payment-linked inventory finalisation;
- product image storage and storage policy hardening;
- notification outbox, email/WhatsApp provider paths, webhook logs, and cost controls;
- admin-created vendor onboarding for launch;
- launch documentation, deployment notes, environment notes, and operational planning;
- marketing site production rebuild and public page coverage; and
- release/version governance, branch workflow, and progress tracking.

This work is not cosmetic polish. It is the work required to make a transactional event platform safer to operate.

For commercial clarity:

| Phase | Position |
| --- | --- |
| Phases 1-4 | The originally priced core app work: buyer, vendor, admin, checkout foundation, deployment foundations, and pilot baseline work. |
| Phase 5 | Hardening, fixes, reliability work, payment/reconciliation improvements, notification work, access-control work, and operational cleanup performed from that point until now. This is substantial operational and technical work and needs to be commercially addressed before DK Digital commits to further unpaid or unapproved work. |
| Phase 6 | Remaining launch activation: live provider setup, rehearsals, production checks, event support planning, legal/customer wording, and final go/no-go preparation. This should be treated as separate approved work unless agreed otherwise in writing. |

Completed-work billing position:

| Workstream | Amount |
| --- | ---: |
| SKIIP Application Phase 5+ | R30,500.00 |
| SKIIP Marketing Site | R6,000.00 - R6,500.00 |
| **Total Payable Range** | **R36,500.00 - R37,000.00** |

All completed-work billables must be paid before launch, or there must be a written payment plan agreed before launch. A payment plan should record the accepted amount, due dates, payment method, what work may continue while the plan is active, and what happens if the plan is missed.

If no settlement or written payment plan is agreed, the default position is that new development, launch acceleration, provider setup, event-specific support, and non-essential changes are paused unless separately approved in writing.

If an agreed payment-plan date is missed, DK Digital may pause further development, launch activation, provider setup, support, handover assistance, and event-day availability until the missed payment is resolved, unless otherwise agreed in writing.

---

## 6. Phase 6 Launch Activation Estimate

Phase 6 is the remaining launch activation work. It is separate from the completed Phase 5 hardening work and should be approved in writing before it continues.

The estimate below assumes the first event remains focused on food/vendor ordering and does not add full ticketing, QR scanning, admission control, or major new features.

Timeline assumption: Phase 6 is approved on 21 May, the group sandbox test happens by 23 May, the controlled live data / live Stripe test happens by 24 May if ready, and 25-29 May is reserved for rehearsal defects, configuration fixes, vendor readiness, and approved launch-critical fixes only.

| Phase 6 Workstream | Estimated Time | Estimated Cost at R500/hour |
| --- | ---: | ---: |
| Launch planning, decision capture, and scope lock | 2-3 hours | R1,000 - R1,500 |
| Environment and provider parity checks | 3-5 hours | R1,500 - R2,500 |
| Sandbox group test preparation and support | 3-4 hours | R1,500 - R2,000 |
| Controlled live Stripe test and reconciliation check | 2-4 hours | R1,000 - R2,000 |
| Vendor readiness and final launch data support | 3-5 hours | R1,500 - R2,500 |
| Notification/email/WhatsApp fallback verification | 2-4 hours | R1,000 - R2,000 |
| Final launch checklist, issue triage, and go/no-go pack | 2-3 hours | R1,000 - R1,500 |
| **Phase 6 launch activation estimate** | **17-28 hours** | **R8,500 - R14,000** |

Optional reduced ticket-vendor setup, if approved by 24 May 2026, should be treated as an additional 4-7 hours / R2,000 - R3,500. This does not include QR generation, QR scanning, or door/admission tooling.

Recommended route: agree the completed-work amount in the meeting, record the payment date or payment-plan dates in writing, approve a Phase 6 launch activation ceiling, and only continue launch acceleration against that written position.

Event-day standby or active support is not included in the estimate above unless expressly agreed.

Event-day support fee to be agreed: [insert agreed standby fee / hourly rate / support window].

---

## 7. First Event Scope and Ticketing Option

The safest first-event scope remains:

- food/vendor ordering;
- Stripe card payments;
- vendor dashboard fulfilment;
- admin oversight;
- refund and reconciliation support;
- email notifications; and
- WhatsApp order-ready notifications only if fully approved, configured, and tested.

### Reduced Ticketing Option: Ticket Vendor

If SKIIP still wants a lightweight ticketing option for the first event, the lowest-risk route is to use the existing vendor/order architecture rather than building a full ticketing system.

Possible approach:

- create a dedicated "Tickets" vendor/store;
- create ticket types as products;
- use existing product stock/inventory as ticket quantity;
- use the existing buyer cart and Stripe Checkout flow;
- treat paid ticket orders as proof of purchase;
- use admin/vendor order views to monitor ticket purchases; and
- use order confirmation/order tracker/email as the first-pass customer proof.

This option reuses the current architecture and avoids building QR scanning, door admission, or a separate ticketing module before launch.

Important limits:

- this is not full ticketing infrastructure;
- no QR code generation/scanning should be promised unless separately built and tested;
- door/admission validation would need a manual process or post-launch feature;
- refunds, support, and event admission rules must be agreed; and
- the ticket-vendor option still needs written scope, pricing, setup time, and testing before it can enter V1.

If this option is not approved, configured, and tested by 24 May 2026, ticketing should be deferred.

---

## 8. Deferred or Excluded From V1 Unless Resolved

| Item | V1 Treatment If Not Resolved By 24 May 2026 |
| --- | --- |
| Ticketing | Use only the reduced ticket-vendor option if scoped, paid, configured, and tested; otherwise defer. |
| QR ticket generation/scanning | Exclude from V1; future event-operations scope. |
| WhatsApp | Disable or keep to email/manual fallback unless Twilio setup and smoke tests pass. |
| Public vendor self-signup | Exclude from V1; continue admin-created vendor onboarding. |
| Marketing lead capture | Treat as non-operational unless the external marketing repo is wired and tested. |
| Advanced analytics/reporting | Defer to post-event or later paid scope. |
| Automated notification retry scheduler | Use manual/operator process unless a scheduler is separately approved and tested. |
| Major UI/UX redesign | Defer unless it fixes a launch-blocking usability issue. |
| Full event-management tooling | Exclude from V1; separate product phase. |
| Low-stock alert workflow | Defer unless specifically approved and tested before feature freeze. |
| Any late feature request | Exclude unless scoped, priced, implemented, and tested before the V1 cutoff. |

---

## 9. Launch Gates

SKIIP should not be treated as live-money launch-ready until these gates are passed or formally deferred in writing.

| Priority | Gate | Required Evidence | Owner / Decision Needed |
| --- | --- | --- | --- |
| P0 | First-event scope locked | Written confirmation of included/excluded scope | SKIIP + DK Digital |
| P0 | Commercial settlement/payment plan | Amount, payment date(s), and terms agreed in writing | SKIIP + DK Digital |
| P0 | Phase 6 approval | Scope, pricing ceiling, and continuation terms agreed | SKIIP + DK Digital |
| P0 | Real vendor setup | Final vendor list, owner details, menus, prices, stock, availability, images, collection instructions | SKIIP |
| P0 | Stripe live approval | Approval for live-mode switch, live test, refund test, and platform fee model | SKIIP |
| P0 | Stripe Connect readiness | Each vendor completes onboarding and outstanding requirements are checked | SKIIP/vendors |
| P0 | Sandbox rehearsal | Buyer order, Stripe test checkout, webhook transition, vendor fulfilment, admin reconciliation, refund test | DK Digital + SKIIP |
| P0 | Controlled live payment test | One low-value live payment completes and updates the app correctly | DK Digital + SKIIP |
| P0 | Event support ownership | Named owners for buyer support, vendor support, refunds, failed payments, disputes, escalation | SKIIP |
| P0 | Legal/customer wording | Terms, privacy, refund/cancellation policy, WhatsApp opt-in, support wording approved | SKIIP/lawyers |
| P1 | Environment parity | Vercel, Supabase, Stripe, Resend, Twilio, secrets, and allowed origins checked | DK Digital + SKIIP |
| P1 | Notification decision | Email verified; WhatsApp either tested or disabled | SKIIP + DK Digital |
| P1 | Authenticated smoke tests | Buyer, seller, and admin login flows pass with final role credentials | DK Digital + SKIIP |
| P1 | Production data cleanup | Test users, vendors, orders, notifications, and stale data cleaned or intentionally retained | DK Digital + SKIIP |

---

## 10. Testing Plan

### 23 May 2026: Sandbox Group Test

The group test should confirm:

- buyer login;
- vendor browsing and product selection;
- buyer order creation;
- Stripe test checkout;
- webhook paid transition;
- inventory finalisation;
- vendor receives and updates the order;
- buyer sees status updates;
- admin sees order and reconciliation information;
- refund path works in test mode;
- email notification works;
- WhatsApp only if provider setup allows it; and
- buyer, vendor, and admin flows are checked on realistic devices.

The result should be recorded in writing, including passed items, failed items, owners, and whether any failed item blocks V1 launch.

### 24 May 2026: Controlled Live Data / Live Stripe Test

If the sandbox test passes and SKIIP approves the Stripe swap-over, the live test should confirm:

- one lowest-practical-value real payment succeeds;
- buyer returns to the app correctly;
- live webhook updates the order;
- connected vendor route is checked;
- reconciliation is visible; and
- refund or refund-readiness is checked as agreed.

---

## 11. Missing Inputs From SKIIP

| Area | Required From SKIIP | Consequence If Missing |
| --- | --- | --- |
| Event scope | Confirm food/vendor only, reduced ticket-vendor option, or no ticketing | Testing and support cannot be finalised |
| Event details | Times, venue, expected order volume, vendor count, go-live deadline, go/no-go deadline | Scale assumptions remain unclear |
| Vendors | Final vendor list, owners, emails, phone numbers, store names, images, descriptions | Real vendor setup cannot be completed |
| Menus | Products, prices, stock, availability, collection instructions | Vendor launch data remains incomplete |
| Stripe | Live-mode approval, platform fee decision, vendor onboarding completion | Live payments and payouts cannot be trusted |
| Test accounts | Buyer, vendor, admin credentials for smoke testing | Authenticated testing remains blocked |
| WhatsApp | Required yes/no, Twilio details, compliance inputs, templates, opt-in wording, test numbers | WhatsApp must be postponed/disabled if incomplete |
| Legal | Terms, privacy, refund/cancellation policy, support wording | Customer-facing launch remains legally exposed |
| Support | Named owners for refunds, customer issues, vendor issues, failed payments, escalation | Event operations remain unsafe |
| Data cleanup | Approval on what test data to delete/archive/retain | Test data may leak into launch |

---

## 12. Event-Day Support Position

Event-day support, standby support, incident response, and on-site availability are not automatically included in normal development, Phase 5, or Phase 6 unless expressly agreed.

If SKIIP wants DK Digital to be available during the event, this must be agreed in writing before the event.

The agreement should define support window, communication channel, named SKIIP escalation person, DK Digital responsibilities, SKIIP/vendor responsibilities, response expectation, exclusions, fee, and payment terms.

Suggested position:

- fixed standby fee for reserved availability;
- additional hourly rate for active support or extended availability;
- no assumed free standby;
- no implied 24/7 support; and
- no responsibility for third-party provider outages, vendor device issues, incorrect vendor data, or business decisions outside DK Digital's control.

Event-day support fee to be agreed: [insert agreed standby fee / hourly rate / support window].

---

## 13. Go/No-Go Rule

The launch should proceed only if:

1. Completed-work billables are paid, or a written payment plan is agreed before launch.
2. Phase 6 launch activation is approved where further launch work is required.
3. First-event V1 scope is locked.
4. P0 launch inputs are complete.
5. Real vendor data is supplied.
6. Stripe Connect readiness is confirmed.
7. Sandbox rehearsal passes.
8. Controlled live payment test passes.
9. Notification decision is made.
10. Event-day support ownership is confirmed.
11. Legal/customer wording is approved.

If these are not complete before the agreed deadline, the safer options are:

- delay the live launch;
- launch with a reduced vendor set;
- launch food/vendor ordering only;
- disable WhatsApp until ready;
- exclude ticketing until separately scoped and tested; or
- run a controlled internal pilot instead of a public live-money rollout.

---

## 14. Required Written Output After the Meeting

After the meeting, the agreed decisions should be captured in writing and shared with both parties.

The written outcome should confirm:

- accepted completed-work amount;
- payment date or payment-plan schedule;
- any disputed items and reasons;
- approved V1 launch scope;
- excluded/deferred items;
- approved Phase 6 launch activation scope and pricing ceiling, if any;
- ticket-vendor decision, if any;
- sandbox test date and attendees;
- live payment test approval;
- event-day support arrangement;
- named support owners;
- WhatsApp decision;
- final go/no-go deadline; and
- legal/contract next steps.

If a point is not written down after the meeting, it should not be treated as approved.

---

## 15. Meeting Decision Tracker

| Decision Area | Decision Needed | Outcome / Notes |
| --- | --- | --- |
| Decision authority | Confirm who can approve payment, scope, launch, and go/no-go |  |
| Completed application work | Accepted, disputed, or partially disputed |  |
| Completed marketing-site work | Accepted, disputed, or partially disputed |  |
| Total payable amount | Amount agreed |  |
| Payment route | Full payment or written payment plan |  |
| Phase 6 launch activation | Approved, reduced, or paused; pricing ceiling agreed |  |
| V1 scope | Food/vendor only, ticket-vendor option, or expanded |  |
| Ticketing | Ticket-vendor option, deferred, or separately scoped |  |
| WhatsApp | Included, disabled, or fallback only |  |
| Vendor data | Complete or missing items listed |  |
| Stripe live test | Approved timing and owner |  |
| Sandbox group test | Date, attendees, accounts |  |
| Event-day support | Required yes/no, fee, window, owner |  |
| Legal review | Lawyer/contact and due date |  |
| Final go/no-go | Date and decision owner |  |

---

## 16. Suggested Closing Statement

> We need to leave this meeting with final decisions. The event is too close for vague scope, unpaid assumptions, or unresolved provider dependencies. The completed work needs to be recognised and paid, the payment plan needs to be agreed, the first-event scope needs to be locked, and the missing launch inputs need to be supplied immediately. If something is not ready - especially WhatsApp, ticketing, or provider-dependent features - then it should be postponed rather than rushed into the first launch. The priority now is a safe, controlled, paid, properly supported first event.
