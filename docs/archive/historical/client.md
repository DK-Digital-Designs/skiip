# SKIIP Project Scope, Launch Readiness, and Commercial Alignment

**Prepared by:** DK Digital
**Project:** SKIIP
**Date:** April 2026

---

## 1. Purpose of This Document

This document summarises the current state of the SKIIP platform, the remaining items to confirm before launch, and the commercial structure needed to move forward clearly.

The goal is to ensure that everyone is aligned on:

* what has already been built
* what is required before SKIIP can be considered launch-ready
* what should be treated as future roadmap work
* what is included in the current development scope
* what should be handled separately, such as maintenance, event support, hosting, and third-party costs

SKIIP is not simply a basic website. It is an operational ordering platform involving customers, vendors, payments, refunds, notifications, and event-day activity. For that reason, the next stage should be clearly scoped and confirmed in writing before final launch work continues.

---

## 2. Current Product State

SKIIP is currently in a workable closed-pilot state for the core ordering flow.

The main platform loop currently supports:

1. A customer signing up or logging in.
2. A customer browsing vendors and products.
3. A customer creating an authenticated checkout order.
4. Order pricing being calculated server-side.
5. The customer being redirected to Stripe Checkout.
6. Stripe confirming payment through a webhook.
7. The order being marked as paid.
8. Inventory being finalised after successful payment.
9. The vendor receiving and managing the paid order.
10. The admin user viewing operational information and issuing refunds where required.

This means the main SKIIP ordering journey exists and can be tested in controlled conditions. The next step is to confirm what is needed to move from a closed-pilot MVP into a launch-ready product.

---

## 3. What Has Already Been Built

### 3.1 Customer Flow

The customer-facing side currently includes:

* login and signup
* vendor browsing
* product/menu browsing
* cart functionality
* authenticated checkout
* Stripe Checkout redirect
* live order tracking
* customer order history/profile area

The customer flow is focused on proving the end-to-end ordering journey: authenticate, browse, order, pay, and track progress.

### 3.2 Vendor Flow

The vendor side currently includes:

* vendor/seller login
* invite-code-gated vendor signup route
* store lookup for authenticated sellers
* product/menu management
* active order view
* all orders view
* order status management
* order lifecycle from paid, to preparing, to ready, to collected
* cancellation path
* Stripe Connect onboarding link generation

The vendor flow is designed around live event handling, where vendors need to see paid orders, prepare them, mark them ready, and complete collection.

### 3.3 Admin Flow

The admin side currently includes:

* dashboard metrics
* recent order visibility
* vendor performance summary
* notification health summary
* refund actions
* vendor/store management

The admin area provides operational visibility and control, especially around refunds, vendor management, and platform health.

At this stage, event management should be treated as future scope unless specifically added to the launch scope. Any placeholder event-management areas should either be hidden, clarified, or completed as part of a separately agreed phase.

### 3.4 Backend, Payments, and Operations

The backend and payment foundation currently includes:

* server-authoritative order creation
* server-side price calculation
* Stripe Checkout integration
* Stripe Connect onboarding support for vendors
* Stripe webhook handling
* payment finalisation through webhook confirmation
* inventory finalisation after successful payment
* refund support
* payment failure recording
* audit logging for key order/payment events
* notification architecture for transactional communication

A significant part of the platform value is not only in the visible screens, but in the operational systems behind them. SKIIP processes real orders, real payments, vendor activity, refunds, and event-day operational flows.

---

## 4. Closed-Pilot MVP, Launch-Ready Product, and Future Platform

To keep the project scope clear, it is useful to separate SKIIP into three stages.

### 4.1 Closed-Pilot MVP

This is the current stage of the platform.

A closed-pilot MVP means the core ordering loop is built and can be tested under controlled conditions.

It includes:

* customer ordering
* vendor order handling
* admin monitoring
* Stripe payment integration
* refund support
* core data and audit flow

A closed-pilot MVP does not mean that every future feature, scale requirement, or operational process has been completed.

### 4.2 Launch-Ready Product

A launch-ready product should be stable, verified, configured, and operationally ready for real usage.

For SKIIP, launch-readiness is mainly about:

* access control
* payment reliability
* refund handling
* vendor onboarding
* notification setup
* environment configuration
* role-based testing
* operational support process
* incident and rollback handling

This is more than visual polish. Because SKIIP handles payments and live event activity, launch-readiness must include technical and operational checks.

### 4.3 Future Platform

The following should be treated as future roadmap items unless specifically included in the current launch scope:

* full multi-event management
* advanced organiser tools
* deeper payout/reconciliation dashboards
* QR/event operations utilities
* buyer notification history
* broader buyer account management
* advanced vendor search/filtering
* production-grade marketing-site lead capture
* larger reporting dashboards
* major UI/design-system rebuilds
* larger-scale load testing

These may become valuable as SKIIP grows, but they should be scoped and priced separately from the current Version 1 build unless otherwise agreed.

---

## 5. Launch-Readiness Items to Confirm

Before SKIIP is considered launch-ready, the following items should be confirmed or completed.

### 5.1 Technical and Operational Checks

* Final authentication and access-control approach confirmed.
* Buyer, vendor, admin, and service-role access paths reviewed.
* Hosted environment variables and platform secrets verified.
* Stripe keys and webhook endpoints confirmed for the intended environment.
* Notification provider keys and templates confirmed if email or WhatsApp notifications are part of launch.
* Full customer-to-vendor order rehearsal completed.
* Payment, webhook, vendor order management, and refund flow tested end to end.
* Stripe Connect vendor onboarding and payout behaviour tested with the intended vendor setup.
* Notification retry/backlog process defined.
* Signup experience aligned with the actual account confirmation policy.
* Vendor onboarding process confirmed.
* Placeholder or future-scope admin areas either hidden, clarified, or completed.
* Marketing-site forms either made operational or treated as non-operational for launch.

### 5.2 Product Decisions Required

The following decisions should be confirmed before launch:

* Is the first launch a controlled pilot, a public launch, or a single-event test?
* What features are essential before the first real event?
* Which vendor onboarding path should be used?
* Is WhatsApp required for launch, or is email/manual support sufficient for the first version?
* Is the current platform-fee logic the intended commercial model?
* Who handles vendor setup and menu setup before events?
* Who handles order support, refunds, and escalation during events?
* Is live DK Digital support required during events?

---

## 6. Recommended Meeting Agenda

### 6.1 Product Walkthrough

Recommended walkthrough order:

1. Customer flow
2. Vendor flow
3. Admin flow
4. Payment and refund flow
5. Notifications and operational support

The walkthrough should focus on what exists today and what still needs to be confirmed before launch.

### 6.2 Current State vs Launch State

The product should be discussed in three categories:

| Category               | Meaning                                                           |
| ---------------------- | ----------------------------------------------------------------- |
| Already built          | Completed core functionality currently available in the platform  |
| Required before launch | Items needed before SKIIP can be confidently used in a real event |
| Future roadmap         | Valuable future improvements that should be scoped separately     |

This will help ensure that feedback is captured properly and that future improvements do not accidentally become part of the current launch scope without discussion.

### 6.3 Scope Confirmation

The key practical outcome of the meeting should be a confirmed scope list covering:

* what is included in the current build
* what must still be completed before launch
* what is excluded from the current phase
* what will be quoted separately later

### 6.4 Commercial Confirmation

The commercial discussion should happen after the scope has been confirmed.

The final project amount should match the final agreed scope. If the agreed scope is limited to the current closed-pilot MVP and minor polish, the price can remain closer to the lower end. If launch-hardening, provider verification, payout testing, operational setup, or new features are required, those items should be included as a defined top-up or separate phase.

---

## 7. Pricing and Payment Position

### 7.1 Pricing Principle

The pricing should remain scope-based.

The current build includes meaningful operational and financial functionality, including:

* authenticated customer checkout
* vendor order handling
* Stripe payments
* Stripe Connect vendor onboarding support
* platform-fee logic
* refunds
* inventory finalisation
* audit logging
* notification architecture
* admin operational tooling

The value of the project is not only the visible interface. It is the platform foundation required to support real orders, real payments, and real event operations.

### 7.2 Proposed Payment Schedule

The following payment schedule is based on a currently assumed R25,000 total.

| Payment   |        Date |      Amount |
| --------- | ----------: | ----------: |
| #1        | Immediately |      R5,000 |
| #2        |  5 May 2026 |      R5,000 |
| #3        | 20 May 2026 |      R8,500 |
| #4        | 5 June 2026 |      R1,500 |
| #5        | 5 June 2026 |      R5,000 |
| **Total** |             | **R25,000** |

### 7.3 Scope-Based Options

| Option | Scope Position                    | Included Value                                                                                                                                                                                                   |                               Price Position | Payment Handling                                                                                                                   |
| ------ | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------: | ---------------------------------------------------------------------------------------------------------------------------------- |
| A      | Closed-pilot MVP only             | Current core build, walkthrough, written scope confirmation, basic handover, and minor bug/polish items within the agreed MVP                                                                                    |                                      R25,000 | Proposed payment schedule can apply, with any additional work quoted separately                                                    |
| B      | Recommended middle ground         | Closed-pilot MVP plus a defined launch-prep pack: final scope write-up, one guided customer-to-vendor test rehearsal, launch checklist review, basic provider/config handover, and small agreed launch polish    |                                      R27,000 | Proposed payment schedule can apply as the base, with the additional R2,000 added as a top-up                                      |
| C      | Launch-ready hardening phase      | Everything in Option B plus deeper launch checks: access-control review, environment checks, notification setup verification, Stripe Connect payout rehearsal, refund rehearsal, and operational support process | R30,000-R33,000 depending on confirmed scope | Proposed payment schedule covers the first R25,000; remaining balance paid as an agreed launch-phase top-up before launch handover |
| D      | Future roadmap / post-launch work | Event management, advanced admin tools, marketing-site lead capture, QR utilities, broader reporting, major UI redesign, new business-model logic, or multi-event tooling                                        |                             Quote separately | Separate written quote and timeline                                                                                                |

### 7.4 Recommended Position

The recommended middle ground is Option B, unless the expectation is a fully launch-ready product with deeper technical and operational hardening.

Option B provides a fair balance between the existing closed-pilot MVP and a practical launch-prep stage, without treating every future platform requirement as part of the original build.

If the expectation is full launch-readiness, including deeper verification around notifications, vendor payouts, environment setup, access control, and event operations, then Option C is more appropriate.

---

## 8. Maintenance, Event Support, and Third-Party Costs

### 8.1 Maintenance Support

Ongoing maintenance should be treated separately from the once-off development fee.

Proposed structure:

* R2,000 per month
* includes 4 hours of support per month
* additional work billed at R500 per hour unless otherwise agreed

Maintenance can include:

* bug fixes for agreed existing functionality
* minor technical adjustments
* light support communication
* basic stability checks
* small technical fixes within the included monthly hours

Maintenance does not include unlimited new feature development or major product changes.

Larger changes, new functionality, significant UI/UX changes, expanded reporting, new payment models, event management, or major operational tooling should be quoted separately.

### 8.2 Six-Month Support Review

Because event volume, vendor adoption, support demand, and platform usage are not yet known, the support agreement should be reviewed after six months.

The six-month review should assess:

* actual support hours used
* event frequency
* vendor activity
* customer activity
* operational demands
* new feature demand
* hosting and platform requirements

This gives SKIIP a clear starting support arrangement while allowing the support model to be adjusted fairly once real usage data is available.

An earlier review can also be triggered if usage, event activity, or support requirements increase significantly before the six-month point.

### 8.3 Event Support

Live event support should be treated separately from standard monthly maintenance.

Event-day support may include:

* standby technical support
* active monitoring
* vendor support
* refund support
* urgent issue response
* order-flow troubleshooting

Because events create time-sensitive operational responsibility, the support expectation should be confirmed before launch.

Possible event-support models:

| Model                 | When It Makes Sense                   | Notes                                                                                                           |
| --------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Per-event support fee | Recommended starting model            | Clear fit for an event-driven platform; support scales with event activity                                      |
| Hourly on-call        | Occasional or irregular event support | Can be billed at an agreed hourly rate with a minimum booking                                                   |
| Monthly event package | Regular event schedule                | Should define included events, included hours, response expectations, urgent-support scope, and overage billing |

### 8.4 Third-Party Costs

Third-party costs should be billed separately unless explicitly included in writing.

This may include:

* hosting
* domains
* Supabase/database costs
* Stripe processing fees
* Stripe Connect/payment-related costs, if any
* Resend/email costs
* Twilio/WhatsApp/SMS costs
* logging or monitoring tools
* required paid platform upgrades

These costs depend on actual usage and provider pricing, so they should not be silently absorbed into the once-off build fee or standard monthly maintenance fee.

---

## 9. Business Model Confirmation

The business model affects product and technical decisions.

SKIIP may generate revenue through one or more of the following:

* platform commission per order
* customer service fees
* event setup fees
* vendor participation fees
* vendor subscriptions
* featured vendor placement

The current payment implementation includes platform-fee logic. The SKIIP team should confirm whether this reflects the intended business model or whether it is a working assumption to be revisited.

This does not mean every business-model feature needs to be built into Version 1. However, confirming the direction will help guide future decisions around payments, reporting, vendor payouts, refunds, and admin tools.

---

## 10. Contract Items to Confirm

The agreement should clearly define:

* final agreed build scope
* what is included in the current price
* what is excluded
* payment schedule
* handling of any top-up amount above the base price
* maintenance/support terms
* monthly support hour allocation
* rate for additional work
* event-day support terms
* hosting and third-party cost responsibilities
* payment-provider responsibilities
* handover terms
* six-month support review
* early review triggers if usage or support requirements exceed expectations

Once scope and price are confirmed, the next step should be to move the agreement into signed contract form before major final launch work continues.

---

## 11. Key Questions for Alignment

### Product and Launch Scope

1. What is essential before SKIIP can launch?
2. Is the first launch a public launch, controlled pilot, or single-event test?
3. What does “launch-ready” mean for the first real event?
4. Are there any expected features that are not currently visible?
5. Which items can wait until after the first real event or pilot?
6. Is event management required before launch, or should it remain future scope?

### Testing and Feedback

7. Has the current version been tested fully as a customer?
8. Has the vendor/order management flow been tested?
9. Have admin refunds and vendor management been tested?
10. Are there any known bugs or unclear flows?
11. What feedback has been received from anyone else who has tested the product?

### Payments and Operations

12. Is the current platform-fee logic the intended commercial model?
13. How should vendor payouts work operationally?
14. Who approves refunds?
15. Who handles failed payments or payment disputes?
16. Who manages vendors and menus before events?
17. Who monitors orders during an event?
18. Is live DK Digital support expected during events?

### Notifications

19. Which notifications are essential for launch?
20. Is email enough for the first version?
21. Is WhatsApp required immediately, or can it be added later?
22. Who should receive order notifications?
23. Should customers receive receipts, status updates, or only ready-for-collection notices?
24. Who will provide and maintain Resend/Twilio accounts and templates?

### Commercial

25. Is the current payment schedule intended to cover only the closed-pilot MVP, or a launch-ready version?
26. Is the recommended R27,000 middle-ground option acceptable if it includes a defined launch-prep pack?
27. If launch-hardening work is required, should it be added as a separate phase?
28. Does the proposed payment schedule still work if the final amount is above R25,000?
29. When should contracts be signed?
30. What date is the product expected to be launch-ready?

---

## 12. Suggested Next Steps

After the meeting, the recommended next steps are:

1. Confirm the agreed product scope in writing.
2. Separate launch-critical items from future roadmap items.
3. Confirm the final project amount.
4. Confirm the final payment schedule.
5. Confirm maintenance and support terms.
6. Confirm event-support expectations.
7. Confirm third-party cost responsibilities.
8. Prepare and sign the final contract.
9. Complete the agreed launch-prep or launch-hardening phase.
10. Proceed toward the first controlled launch or event test.

---

## 13. Closing Position

SKIIP has reached a strong closed-pilot stage. The core platform is no longer just a concept; it has a functioning operational foundation for customer ordering, vendor order handling, admin oversight, payments, refunds, and notifications.

The important next step is to clearly define what is required before launch and ensure that the final price, payment plan, support model, and contract terms match the agreed scope.

This will allow the project to move forward with clear expectations, a fair commercial structure, and a stronger foundation for future growth.
