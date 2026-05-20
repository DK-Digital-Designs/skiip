# SKIIP First Event + Ticketing Decision Note

## Purpose

SKIIP has now potentially moved from a development/pilot build into a real live-event situation. The client has indicated that their first event may use SKIIP, with an expected order volume around the level of their previous event, approximately 100 orders.

They have also raised a new request: whether SKIIP could be used for ticket sales, specifically ticket sales at the door.

This document collects the current thinking, risks, commercial considerations, and possible paths forward before committing to anything.

---

## 1. Current Situation

The client has said:

- They have landed their first event that may use SKIIP.
- The event is very soon, currently referenced as either the 30th or 31st.
- Their previous event had around 100 orders.
- They are asking whether the platform can support ticket sales, especially ticket sales at the door.
- They will send a brief with more details.

This changes the project from a normal MVP delivery conversation into a live operational launch conversation.

The core question is no longer only:

> Is the platform built?

It is now also:

> Can the platform be used safely at a real commercial event with live customers, real payments, vendors, and support pressure?

---

## 2. Initial View

The expected order volume of around 100 orders is not the main concern. That level should be manageable if the platform is configured, tested, and operated properly.

The bigger risks are:

- rushed scope changes
- payment and refund edge cases
- vendor readiness
- staff training
- device and internet reliability
- support availability during the event
- unclear commercial responsibility
- adding ticket sales too close to launch

The first event should ideally be treated as a controlled live pilot, not as an open-ended feature expansion.

---

## 3. Core Food/Vendor Ordering

The safest first-event scope is:

- food/drink/vendor ordering
- Stripe payment flow
- order confirmation
- vendor dashboard/order handling
- admin oversight
- order ready/collection flow
- refund checks
- basic event-day support

This is the platform’s core purpose and should remain the priority.

### Minimum Readiness Checklist

Before the event, the team should confirm:

- exact event date and times
- expected vendors
- menus/items/prices
- Stripe/payment routing
- whether service/platform fees are active
- buyer checkout flow
- vendor logins and devices
- admin access
- test orders from buyer to vendor to admin
- refund flow
- order ready and collected flow
- notification approach
- fallback plan if notifications fail
- event-day support roles

---

## 4. The Ticket Sales Request

The ticket sales request should not be treated as a small copy change or simple add-on.

Even if the first version is technically simple, ticketing introduces a new operational workflow:

- selling admission rather than food
- tracking paid entry
- preventing duplicate use
- giving door staff a fast workflow
- handling refunds and voided tickets
- separating ticket revenue from food/vendor revenue
- managing customer confusion at the door
- dealing with weak Wi-Fi or mobile signal

The main issue is not whether it is possible. It is whether it is wise to absorb this into the existing scope and budget days before the first event.

---

## 5. Ticketing Options

### Option A: Keep Ticket Sales Outside SKIIP

For the first event, SKIIP is used only for food/vendor ordering.

Ticket sales remain outside the platform using the client’s existing door process, card machine, cash, guestlist, or ticket provider.

#### Pros

- safest launch option
- protects the core platform test
- avoids new workflow risk
- avoids last-minute feature work
- keeps responsibility clearer

#### Cons

- does not satisfy the client’s new request
- misses a possible commercial opportunity
- may reduce SKIIP’s perceived usefulness for full event operations

#### Suitability

Best option if the goal is a controlled first event with minimal risk.

---

### Option B: Limited Door-Ticket Sales Add-On

Use the existing SKIIP order system to sell tickets as a special vendor/product flow.

Example flow:

```text
Customer opens SKIIP
-> selects Door Tickets / Event Tickets vendor
-> chooses Entry Ticket product
-> pays through Stripe
-> paid ticket order appears in vendor/admin dashboard
-> door staff verifies paid status
-> door staff marks order as collected/admitted
```

This is not a full ticketing system. It is a controlled workaround built on top of the existing SKIIP ordering system.

#### Possible Implementation Shape

- Vendor: Door Tickets / Event Tickets
- Product: Entry Ticket / Door Ticket
- Order: Ticket purchase
- Payment: Existing Stripe checkout flow
- Fulfilment: Door staff mark as collected/admitted
- Reporting: Ticket sales can be tracked separately because tickets are under a separate vendor/product

#### Pros

- commercially useful
- achievable faster than a full ticketing module
- reuses existing payment/order infrastructure
- gives the client a practical answer
- could validate demand for future ticketing features

#### Cons

- still new scope
- needs focused testing
- depends on door staff process
- not fraud-proof
- no QR scanning unless separately built
- no proper admission system
- manual checking could become slow under pressure

#### Suitability

Potentially viable for the upcoming event only if:

- outstanding work is paid first
- scope is separately agreed
- the feature is paid as urgent new scope
- expectations are clearly limited
- the team focuses heavily on testing and event-day process

---

### Option C: Proper Ticketing MVP

Build a real v1 ticketing module with ticket records and QR check-in.

Example flow:

```text
Event created
-> ticket types configured
-> customer buys ticket
-> payment succeeds
-> unique ticket generated
-> ticket delivered to customer
-> door staff scans QR
-> system validates ticket
-> ticket marked as checked in
```

#### Likely Features

- event-level ticket setup
- ticket types
- capacity limits
- ticket purchase flow
- unique ticket records
- QR code generation
- online scanner/check-in screen
- ticket status: issued, checked_in, refunded, voided
- basic attendee/ticket report
- audit logs for check-ins

#### Pros

- a real product direction
- stronger long-term SKIIP positioning
- more professional admission process
- better reporting and fraud prevention

#### Cons

- too much for a few days unless heavily cut down
- requires careful database and payment design
- introduces new domain models
- increases testing burden
- door scanner UX must be reliable
- refund/ticket invalidation must be correct

#### Suitability

Good future scope after the first event. Not ideal as a last-minute addition unless the team accepts a very constrained MVP and enough paid time.

---

### Option D: Full Ticketing System

A full ticketing system is a separate product layer. It includes event management, ticket inventory, sales rules, QR tickets, staff scanning, refund invalidation, reporting, and possibly offline scanning.

#### Full Ticketing Flow

```text
Event
-> ticket types
-> capacity / allocation
-> purchase
-> ticket issuance
-> QR / unique code
-> entry validation
-> check-in state
-> reporting / reconciliation
```

#### Full Feature Areas

- event setup
- ticket types and pricing
- sale windows
- capacity and inventory controls
- Stripe checkout
- unique ticket issuance
- QR code generation
- customer ticket delivery
- scanner/check-in app
- manual lookup by name/order number
- duplicate scan prevention
- refund and void handling
- guestlist / comps
- multi-entrance support
- staff roles
- audit logs
- post-event reports
- offline scanning strategy

#### Suitability

Strategically interesting, but not suitable for the upcoming event as a full build.

---

## 6. Achievability Assessment

### 100 Food/Drink Orders

Achievability: High, if the system is configured and tested properly.

The risk is operational rather than raw technical capacity.

### Limited Door-Ticket Sales Add-On

Achievability: Moderate to high, if kept simple.

This may be plausible if the team focuses the rest of the week on it, then uses the weekend and following days for testing and staff process.

However, it must be framed as a limited workflow, not a full ticketing platform.

### Proper Ticketing MVP

Achievability: Moderate, but likely not sensible before the upcoming event unless the scope is extremely constrained.

A careful version would more realistically be a separate post-event phase.

### Full Ticketing System

Achievability: Medium to hard.

This is a larger product expansion and should be scoped properly after the event.

---

## 7. Commercial Position

The commercial situation is now more important than ever.

The team is already over the original budget due to the amount of work required to make the platform production-capable:

- payments
- Stripe integration
- order handling
- vendor flows
- admin flows
- refunds
- notifications
- testing
- launch readiness
- operational hardening

A real live event adds new responsibility and support pressure.

Ticket sales would be new scope.

The team should not absorb:

- outstanding build work
- urgent live-event support
- new ticketing functionality
- extra testing burden
- operational risk

inside the original budget.

### Recommended Commercial Line

Before agreeing to ticket sales or event support:

1. Outstanding phases should be paid.
2. Phase 5 should be paid/agreed.
3. Ticket sales should be quoted separately.
4. Event-day support should be priced separately.
5. The scope should be written down and agreed before work starts.

### Suggested Package Structure

#### Package 1: Live Pilot Support

For core food/vendor ordering only.

Includes:

- production readiness checks
- vendor/menu setup support
- Stripe test orders
- refund test
- buyer/vendor/admin walkthrough
- event-day support window
- post-event review

Excludes:

- ticketing
- QR scanning
- door admission workflow
- major new backend changes
- major UI changes
- new payment models

#### Package 2: Urgent Door-Ticket Sales Add-On

A paid add-on using the existing SKIIP order system.

Includes:

- Door Tickets vendor/product setup
- ticket-specific buyer copy where needed
- door-staff order handling process
- paid/admitted or collected status workflow
- testing of ticket purchase flow
- simple post-event ticket sales report/export

Excludes:

- full ticketing platform
- QR ticket generation
- QR scanning
- offline scanning
- advanced capacity controls
- duplicate-proof/fraud-proof admission
- guestlist/comp ticket system
- ticket transfer/resale
- advanced reporting

#### Package 3: Proper Ticketing MVP

Future post-event scope.

Includes:

- ticket records
- ticket types
- capacity controls
- QR generation
- online check-in scanner
- refund invalidation
- ticket reports
- audit logs

---

## 8. Risks To Raise In The Meeting

### Scope Risk

The ticketing request is a new system surface. It should not be casually bundled into the original MVP.

### Timing Risk

The event is very close. New functionality needs enough testing time, especially around payment and event-day operations.

### Operational Risk

Door staff need a simple, fast, reliable process. If the door workflow is slow, customers will feel it immediately.

### Payment Risk

Ticket sales involve real customer payments. Refunds, failed payments, and reconciliation must be handled clearly.

### Internet/Device Risk

Door staff need reliable devices and internet. A fallback process is needed if the dashboard cannot be accessed.

### Expectation Risk

The client may think “ticket sales” means full ticketing, QR codes, scanning, and fraud prevention. The team must clearly define what is and is not included.

---

## 9. Recommended Path Forward

### Recommended Immediate Position

Do not reject the ticket idea outright.

Instead:

> We can explore a limited door-ticket sales workflow using the existing SKIIP order/payment system, but this is new scope and must be commercially agreed before work begins.

### Recommended Short-Term Plan

1. Ask the client to send the brief ASAP.
2. Confirm the actual event date.
3. Confirm whether they want:
   - food/vendor ordering only
   - limited ticket sales workaround
   - proper ticketing module
4. Confirm outstanding payment for work already completed.
5. Agree paid launch support terms.
6. Agree paid ticket add-on scope if they want it.
7. Set a go/no-go deadline.
8. If approved, pause non-essential work and focus on ticket flow + event readiness.
9. Test heavily over the weekend and following days.
10. Keep the first event controlled and simple.

---

## 10. Decision Matrix

| Option | Description | Achievable Before Event | Risk | Commercial Value | Recommendation |
|---|---|---:|---:|---:|---|
| A | Food/vendor ordering only | High | Low-medium | Medium | Safest launch option |
| B | Limited door-ticket sales add-on | Moderate-high | Medium | High | Viable if paid and tightly scoped |
| C | Proper ticketing MVP | Low-moderate | High | High | Future phase, not ideal now |
| D | Full ticketing system | Low | Very high | Very high | Strategic future product, not now |

---

## 11. Suggested Internal Position

The team’s internal stance should be:

> This could be worth doing, but only under the right commercial terms.

More specifically:

- Do not absorb this into the current scope.
- Do not start before outstanding payments are settled or clearly committed.
- Do not sell it as a full ticketing system.
- Do not accept responsibility for QR scanning, fraud prevention, or advanced admission control unless separately scoped.
- Treat this as an urgent paid add-on or keep tickets outside SKIIP for the first event.

---

## 12. Suggested Client Message

```text
I’ve read through this properly now, and there’s quite a lot for us to think through and digest.

Please send through the brief as soon as possible so we can understand exactly what is being asked and what the expectations are.

We’ll look into the ticket sales idea and discuss it properly on our side, but with the event being so close, we need to be careful about scope, timing, testing, and overall risk.

The finances are also more important than ever now, especially with the work already done and the possibility of additional event-specific requirements.

Let’s sit down for a meeting soon and go through everything properly before we commit to the final approach.
```

---

## 13. Strong Meeting Line

Use this if the conversation needs to become direct:

> We want this first event to succeed, but we need to be honest that the project is already beyond the original budget and scope. Adding ticketing days before launch is not a small request; it is effectively a new operational workflow. We can help, but we need to agree what is included, what is excluded, what is being paid, and how launch support is handled commercially.

---

## 14. Final Recommendation

The most sensible path is:

1. Treat the first event as a controlled live pilot.
2. Prioritise food/vendor ordering readiness.
3. Consider ticket sales only as a limited paid add-on.
4. Require outstanding work/payment to be settled before urgent new work begins.
5. Clearly define ticket sales as a workaround, not a full ticketing system.
6. Save proper ticketing as a future paid product phase if the event proves demand.

The best commercial and technical stance is:

> SKIIP can probably support a limited door-ticket sales workflow for this event, but only if it is separately scoped, separately paid, and kept operationally simple.

