# SKIIP Launch and Commercial Readiness Pack

Prepared for: SKIIP client meeting on 21 May 2026
Prepared by: Dean Gibson / DK Digital
Prepared on: 20 May 2026
First event target referenced in current launch documents: Saturday, 30 May 2026
Document status: Client-facing working pack for launch, commercial, and legal alignment

## Important Note

This pack is a factual working document based on the current SKIIP project state, source documentation, and local verification run on 20 May 2026. It is not legal advice. Contract terms, legal wording, data protection, refund policy, customer terms, and cross-border enforcement should be reviewed by lawyers before signature or public launch.

## Executive Position

SKIIP is best described as a strong closed-pilot launch candidate.

The platform has moved beyond a basic MVP or website build. It now includes the core buyer, vendor, admin, payment, notification, audit, and operational foundations required for a transactional event platform.

The remaining launch work is not simply "finish the app". The main remaining work is production activation and sign-off: live provider setup, real vendor onboarding, Stripe Connect readiness, live payment and refund rehearsal, environment parity, legal/customer policy approval, event-day support ownership, and a controlled go/no-go decision.

The safest first-event scope is focused food/vendor ordering with Stripe card payments, vendor fulfilment, admin oversight, refund/reconciliation support, and email notifications. WhatsApp should only be included if Twilio compliance, sender setup, templates, credentials, callbacks, opt-in wording, and smoke testing are complete before launch.

Ticketing, QR scanning, full event management, advanced analytics, production marketing lead capture, and broader platform expansion should be treated as separate scope unless agreed in writing.

## Current Product Position

The core operating loop exists:

- buyer signs in
- buyer creates an order through server-side order logic
- buyer is redirected to Stripe Checkout
- Stripe webhook finalises payment state
- inventory is protected and finalised after payment
- vendor sees the paid order
- vendor moves the order through fulfilment
- admin can monitor orders, reconciliation details, and refunds

Current implementation evidence shows a product that is substantially deeper than the visible screens alone. The platform includes payment hardening, refund and reconciliation paths, notification infrastructure, access-control work, admin/vendor operational controls, and launch documentation.

## Current Verification Baseline

Verification run locally on 20 May 2026:

| Check | Result |
| --- | --- |
| Current app/repo version | `0.28.0` |
| Unit test suite | Passed: 12 test files, 67 tests |
| Production build | Passed |
| Public Playwright smoke | Passed: 3 tests |
| Authenticated Playwright smoke | Skipped until buyer, seller, and admin credentials are supplied |

External checks still required:

- live Stripe account and webhook configuration
- live Stripe Connect vendor readiness
- hosted Vercel/Supabase production secret parity
- Resend sender/domain and webhook setup
- Twilio WhatsApp compliance, sender, templates, and callbacks
- lawyer review of agreement, policies, and customer-facing wording

## Work Already Delivered

Delivered platform areas include:

- buyer ordering, checkout, tracking, and account/history surfaces
- vendor dashboard, product management, active order queue, and fulfilment status flow
- admin dashboard, vendor management, refunds, and reconciliation visibility
- server-authoritative order creation
- Stripe Checkout and Stripe Connect support
- webhook-driven paid-order finalisation
- payment failure tracking and recovery paths
- refund and reconciliation functions
- inventory checks and payment-linked inventory finalisation
- product image storage and storage policy hardening
- notification outbox, email/WhatsApp provider paths, webhook logs, and cost guards
- admin-created vendor onboarding for launch
- launch documentation, operations documentation, deployment documentation, and environment matrix
- release/version governance, branch workflow, and progress tracking

This work should be recognised as operational hardening and launch-risk reduction, not only as visual polish.

## Commercial Recognition

The Phase 5 billing report records the following completed workstream amounts:

| Workstream | Amount |
| --- | ---: |
| SKIIP Application Phase 5+ | R30,500.00 |
| SKIIP Marketing Site | R6,000.00 to R6,500.00 |
| Total Payable Range | R36,500.00 to R37,000.00 |

Recommended commercial framing:

> Phase 5 moved SKIIP from a functional MVP baseline into a safer closed-pilot operational baseline. The work included payment recovery, webhook hardening, refunds, reconciliation, inventory protection, notification infrastructure, access-control work, admin/vendor operations, launch documentation, and release hygiene. These are not cosmetic extras; they are the work required to make a transactional event platform safer to operate.

Phase 6 should be scoped separately as final launch activation and live-provider verification. That includes production provider setup, real vendor onboarding, rehearsals, legal/customer policy approval, and event-day operational readiness.

## Launch Readiness Gates

SKIIP should not be treated as live-money launch-ready until these gates are passed or formally deferred.

| Priority | Gate | Required Evidence |
| --- | --- | --- |
| P0 | First-event scope locked | Written confirmation of food/vendor ordering scope and whether ticketing is excluded |
| P0 | Real vendor setup | Final vendor list, owner details, menus, prices, stock, availability, images, and collection instructions |
| P0 | Stripe live approval | Approval for live-mode switch, low-value live payment test, refund test, and platform fee model |
| P0 | Stripe Connect readiness | Each live vendor completes onboarding and dashboard requirements are checked |
| P0 | Sandbox payment rehearsal | Buyer order, Stripe test checkout, webhook paid transition, vendor fulfilment, admin reconciliation, and refund pass |
| P0 | Controlled live payment test | One low-value live payment completes and updates the app correctly |
| P0 | Event support ownership | Named owners for buyer support, vendor support, refunds, failed payments, disputes, and escalation |
| P0 | Legal/customer wording | Terms, privacy, refund/cancellation policy, WhatsApp opt-in wording, and support wording approved |
| P1 | Environment parity | Vercel, Supabase, Stripe, Resend, Twilio, secrets, and allowed origins checked against the same environment pair |
| P1 | Notification decision | Email verified; WhatsApp either fully tested or explicitly disabled for the first event |
| P1 | Authenticated smoke tests | Buyer, seller, and admin login flows pass with final role credentials |
| P1 | Production data cleanup | Test users, vendors, orders, notifications, and stale data cleaned or explicitly retained |
| P2 | Marketing role | Marketing forms treated as non-operational unless the external marketing repo is wired and tested |
| P2 | Post-event reporting | Required sales, vendor, refund, notification, and issue reporting agreed |

## Launch Pitfall Register

The following issues should be controlled before the first real event:

| Area | Pitfall | Required Control |
| --- | --- | --- |
| Scope | Ticketing, QR scanning, or event management added late | Written scope, price, owner, test plan, and separate go/no-go decision |
| Stripe live mode | Live payments fail or do not reconcile | Controlled live low-value payment test before customer launch |
| Stripe Connect | Vendors cannot receive funds or payouts are paused | Each vendor completes onboarding and dashboard requirements are checked |
| Webhooks | Payment succeeds but order stays pending | Hosted webhook endpoint and secret verified; reconciliation path rehearsed |
| Refunds | Refund path fails during event | Admin refund tested in Stripe test mode and live mode as agreed |
| Environment | Staging and production variables or secrets drift | Vercel, Supabase, Stripe, Resend, and Twilio parity checked |
| Auth/RLS | Wrong user can access wrong data or function | Auth/RLS sign-off and authenticated smoke tests with role credentials |
| Test data | Test records leak into launch | Production data cleanup approved and executed |
| Vendor data | Menus, prices, stock, or collection instructions are wrong | Vendor readiness pass with final vendor information |
| Inventory | Concurrent orders oversell limited stock | Inventory race/concurrency test and webhook finalisation rehearsal |
| Mobile UX | Buyers fail under event conditions | Mobile device checks on buyer ordering, payment return, and tracking |
| Notifications | WhatsApp compliance or templates are not ready | Decide WhatsApp yes/no now; email/manual fallback if not passed |
| Notification retries | Failed notifications never recover | Manual or external `notification-dispatch` process defined |
| Support | Customers/vendors do not know who owns issues | Named buyer support, vendor support, refund, and escalation owners |
| Legal | Terms, privacy, refund, opt-in, and support wording missing | Lawyer/client approval before live use |
| Monitoring | Event-day failures are invisible | Logs, Stripe dashboard, Supabase functions, notification logs, and Sentry checked |
| Backups | Bad data or release cannot be recovered | Backup/restore and rollback stance confirmed |
| Marketing | Marketing forms assumed operational when they are not | Treat marketing lead capture as separate unless tested in the external repo |
| Handover | Code/source/control expectations disputed | Contract annexures and handover terms settled before signature |
| Event support | DK Digital standby assumed but not agreed | Written support window, fee, response model, and exclusions |

## Required Testing Before Scale Use

Current automated checks are a useful baseline, but they do not prove live event readiness on their own.

Required next tests:

1. Authenticated smoke coverage
   - buyer login and order history
   - seller login and inventory/dashboard
   - admin login and vendor management

2. Full sandbox payment rehearsal
   - order creation
   - Stripe test checkout
   - webhook paid transition
   - inventory finalisation
   - vendor status progression
   - admin reconciliation
   - admin refund

3. Controlled live-money test
   - one low-value live card payment
   - correct return to app
   - live webhook update
   - connected vendor readiness checked
   - refund or reconciliation checked as agreed

4. Scale and stress testing
   - buyer browsing and cart creation at agreed expected peak
   - concurrent checkout attempts against limited stock
   - vendor dashboard with high order volume
   - webhook replay/idempotency tests
   - notification dispatch caps and backlog behaviour
   - mobile network and browser checks

5. Event-day operational rehearsal
   - named support owners
   - escalation path
   - refund decision path
   - vendor training
   - incident pause/rollback process
   - post-event reporting expectations

Scale target rule:

> The scale target must be based on expected event attendance, vendor count, menu size, and peak order window. Until SKIIP confirms those numbers, the platform should be tested against conservative stress scenarios rather than declared scale-ready.

## Client Decisions Needed

P0 decisions:

- Is the first event food/vendor ordering only?
- Is ticketing excluded for the first event?
- Is WhatsApp required, or is email/manual support acceptable?
- Who approves the live Stripe switch and low-value live payment test?
- Which real vendors are launching?
- Who owns buyer support, vendor support, refunds, failed payments, and escalation?
- What is the final go/no-go deadline?

P1 decisions:

- terms and privacy wording
- refund and cancellation policy
- WhatsApp opt-in wording
- support copy for customers/vendors
- production data cleanup approval
- post-event reporting expectations

## Contract and Lawyer Review List

The agreement should go to lawyers with these items clearly marked:

- exact legal names and addresses
- authorised signatories
- governing law and cross-border enforcement
- IP ownership, licence, source-code handover, and continuity if DK Digital becomes unavailable
- payment schedule and late-payment fee
- Phase 5 and Phase 6 separate-scope treatment
- platform fee wording
- liability cap and excluded damages
- POPIA/GDPR/data-processing roles
- customer terms, privacy, refund, cancellation, and WhatsApp consent wording
- electronic signature and WhatsApp/email approval wording
- event-day support pricing and exclusions

Recommended agreement annexures:

- Annexure A: completed baseline deliverables
- Annexure B: excluded and deferred future scope
- Annexure C: launch gates and client inputs
- Annexure D: maintenance and event-day support

## Recommended Meeting Outcome

The meeting should aim to confirm:

1. The Phase 5 billing report reflects completed hardening work and should be settled as completed value.
2. The first event remains focused on food/vendor ordering unless ticketing is separately scoped.
3. Phase 6 is a separate launch activation phase covering provider setup, rehearsals, live checks, legal/customer policy approval, and event-day operations.
4. The agreement goes to lawyers only after placeholders, annexures, platform fee terms, and support pricing are cleaned up.
5. No real customer launch happens until the P0 launch gates and rehearsals pass.

## Immediate Action Plan

Before the client meeting:

- Use this pack as the meeting narrative.
- Keep the three source PDFs available as supporting material.
- Decide the preferred commercial ask for Phase 5 and Phase 6.
- Mark contract placeholders that must be resolved before legal review.

Within 24 hours after the meeting:

- Convert agreed changes into three final documents:
  - Phase 5 billing report
  - launch readiness and go/no-go checklist
  - lawyer-ready agreement pack with annexures
- Capture all client decisions in writing.
- Schedule the sandbox rehearsal, live low-value payment test, and final go/no-go review.

Before the 30 May 2026 event:

- Complete all P0 launch inputs.
- Complete vendor Stripe onboarding.
- Pass sandbox rehearsal.
- Pass controlled live payment test.
- Pass notification fallback decision/test.
- Confirm event-day support ownership.
- Confirm legal/customer policy wording.
- Approve final go/no-go.
