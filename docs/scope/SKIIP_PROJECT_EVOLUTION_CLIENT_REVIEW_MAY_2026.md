# SKIIP Project Evolution Review

Prepared for: SKIIP stakeholders  
Prepared by: DK Digital  
Prepared on: 6 May 2026

## Purpose of This Document

This document explains how the SKIIP project has evolved from the original MVP concept into a broader and more operationally mature platform.

The intention is not to dispute the value of the current direction. In many ways, the platform is stronger because of that evolution. The purpose is to make clear:

- what the original baseline was
- how the platform has developed beyond that baseline
- which higher-effort areas have already been completed
- which Phase 6 final launch-readiness items still need live-provider or operational verification
- which Phase 7 and beyond items should be treated as post-launch scope

This is a project and scope review, not legal advice.

## Executive Summary

SKIIP began as a mobile-first ordering platform focused on helping festival attendees skip queues by ordering ahead, while giving vendors and organisers the tools needed to manage orders.

As development progressed, the project evolved beyond a straightforward MVP build. The platform now includes not only the core buyer, vendor, and admin experience, but also a substantial amount of backend and operational work that supports safer real-world usage.

The most important growth has not been in visual polish alone. It has been in the technical depth of the system. This includes stronger payment handling, webhook recovery, reconciliation support, inventory protection, vendor and admin controls, notification delivery infrastructure, auditability, and launch documentation.

These additions are valuable because they move the platform closer to something that can operate more reliably in a real event environment. At the same time, they also represent meaningful implementation effort beyond what would normally be expected from a simple MVP web-app build.

The clearest summary is:

- the original project baseline was narrower than the current platform reality
- the delivered work already includes substantial additional implementation depth
- Phase 6 final launch readiness is separate from code existing in the repository, because some checks depend on live provider accounts, secrets, rehearsals, and support decisions
- Phase 7 and beyond items remain outside the current delivered baseline and should be separately agreed before being treated as included
- the work so far is best understood in phases: Phase 1 established the mockup, Phase 2 created the technical foundation, Phase 3 built the main product flows, Phase 4 moved the platform toward pilot readiness, and Phase 5 moved into hardening, security, and bug fixing

## Evidence Base

This review is based on the original agreement, the revised agreement, the project invoice/time-estimate baseline, and the current repository state.

The supporting internal analysis is available in:

- `docs/scope/SKIIP_SCOPE_CREEP_ANALYSIS_MAY_2026.md`

Key implementation evidence reviewed includes:

| Area | Evidence reviewed |
| --- | --- |
| Current platform state | `docs/CURRENT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md` |
| Buyer, vendor, and admin routes | `app/src/App.jsx` |
| Payment hardening | `supabase/functions/stripe-checkout`, `supabase/functions/stripe-webhook`, `supabase/functions/stripe-refund`, `supabase/functions/stripe-reconcile-order` |
| Server-authoritative ordering | `supabase/functions/order-create`, `create_order_with_items_v1()` |
| Inventory protection | `finalize_paid_order_inventory()`, `restock_order_inventory()` |
| Vendor/admin operations | `supabase/functions/admin-store`, `app/src/pages/admin/Vendors.jsx`, `app/src/pages/admin/DashboardV2.jsx` |
| Notifications | `notification_logs`, `notification_webhook_events`, `supabase/functions/notification-dispatch`, Resend and Twilio webhook functions |
| Launch and operations | `docs/launch/LAUNCH_CHECKLIST.md`, `docs/operations/OPERATIONS.md`, `docs/operations/NOTIFICATIONS.md` |
| Phase history | `PROGRESS.md`, `PROGRESS-2.md`, `docs/phase-5/PHASE_5_CLIENT_RECAP.md` |
| Verification state | Current repo unit test run passed: 4 test files, 35 tests |

This evidence matters because much of the extra work is below the visible UI layer. It is not always obvious in a walkthrough, but it affects payment safety, recovery, supportability, and launch confidence.

## Original Project Baseline

The original concept for SKIIP was a mobile-first festival ordering system with a focused MVP scope.

At a high level, that baseline included:

- a customer-facing ordering flow
- a vendor dashboard for receiving and updating orders
- an admin or organiser dashboard for oversight
- Stripe payments
- order notifications
- responsive UI and foundational QA

This is the type of scope that normally aligns with a conventional MVP web application: core pages, user flows, database structure, integrations, and basic testing.

The original commercial framing also reflected that type of project. It was closer to a standard scoped software build than to a deeply hardened payment and operations platform.

## Project Phases So Far

The project is easier to understand if the work is separated into phases rather than treated as one flat build.

| Phase | Plain-English summary | What it means |
| --- | --- | --- |
| Phase 1 | Mockup and concept shape | The initial product direction, user experience, and visual/product concept were established. This phase was about proving what SKIIP should feel like and how the main roles would interact with the platform. |
| Phase 2 | Technical foundation and backend setup | The project moved from concept into system foundations: database structure, core backend logic, role-based access patterns, early Stripe/payment integration, guest ordering capability, global error handling, and the first structure needed for buyer, vendor, and admin areas. |
| Phase 3 | Core product flow implementation | The main platform loop was built out: buyer and vendor authentication, menu browsing, cart and checkout flow, order tracking, vendor product management, admin overview, inventory handling, product image support, and notification/webhook foundations. This is where the product became more than a mockup. |
| Phase 4 | Pilot readiness, deployment, and core-loop polish | The work shifted toward making the product usable in a controlled pilot: deployment structure, marketing/supporting pages, Vercel/GitHub Pages setup, Stripe Connect vendor onboarding, stability fixes, GBP/localisation changes, checkout crash fixes, vendor paid-order rules, and routing/tracker refinements. |
| Phase 5 | Hardening, security, and bug fixes | The work shifted from "does the flow work?" to "can the flow be trusted in a real event environment?" This included payment recovery, refund handling, reconciliation, inventory protection, notification reliability, access-control checks, documentation, and operational cleanup. |

This phase framing is important because Phase 5 is where much of the less-visible effort sits. It is not mainly a design or page-building phase. It is the work required to make the system safer, more recoverable, and easier to support.

## How the Project Evolved

As implementation progressed, the platform requirements became more demanding than the initial functional summary suggested.

What started as a core ordering product increasingly needed to behave like a real operational system. That meant the work expanded beyond basic screens and CRUD flows into areas such as:

- server-side enforcement of payment and order rules
- safer inventory handling after successful payment
- webhook reliability and replay protection
- refund and reconciliation support
- stronger vendor and admin operational tooling
- notification logging and delivery infrastructure
- launch readiness documentation and release controls

This is an important distinction.

The platform did not simply grow by adding a few extra pages. It grew in technical and operational depth, especially during Phase 5. That depth is less visible than front-end screens, but it carries significant implementation effort and directly affects how safe and reliable the platform is in practice.

## Areas Where the Platform Has Grown Beyond the Initial Baseline

### 1. Payments Became More Than Basic Checkout

The original concept required Stripe payments. The current platform goes further than simply redirecting users to a payment gateway.

The implemented direction includes:

- server-authoritative order creation
- Stripe webhook-driven payment finalisation
- payment state recovery
- idempotent webhook handling
- refund support
- reconciliation-oriented payment fields and admin visibility
- platform fee, Stripe fee, and vendor net values exposed for operator review

This is materially more complex than a basic checkout integration and represents real launch-hardening work.

### 2. Inventory Handling Became Operationally Safer

A normal MVP might track stock levels at a simple product level. The current platform includes stronger payment-linked inventory behaviour, including protected stock handling during order finalisation and recovery paths when orders are cancelled or refunded.

That shifts inventory from simple display logic into operational logic.

### 3. Admin and Vendor Operations Became More Robust

The original baseline included admin oversight and vendor management. The current implementation has evolved toward a more complete operational model, including stronger vendor lifecycle controls, clearer order-state management, and broader admin visibility into orders, payments, and system health.

Current admin/vendor depth includes:

- admin-created vendor onboarding for the launch path
- vendor store activation, suspension, and archive flows
- vendor product and inventory management
- vendor order status progression
- admin refund actions
- admin payment reconciliation support
- notification health visibility

### 4. Notifications Became Infrastructure, Not Just Messages

Notifications were originally framed as WhatsApp or SMS updates. The project has since grown to include a broader notification architecture with provider support, logging, webhook/event handling, and backlog-oriented delivery structure.

That is meaningfully more advanced than simply sending a confirmation message.

It is also important to be clear that notification provider setup is partly external. The code supports the architecture, but live provider accounts, templates, secrets, and retry scheduling still need to be confirmed for a launch environment.

### 5. Documentation and Release Management Expanded

The project now includes significantly more internal structure around documentation, launch preparation, operational process, and release management than would usually exist in a lightweight MVP build.

This work adds long-term value because it improves maintainability, launch safety, and future handover quality.

## What This Means in Practical Terms

From a client perspective, the platform is no longer best described as only a simple MVP page build.

It is better described as:

> a strong early operational baseline that includes both the core product flow and substantial implementation work to make the system safer, more supportable, and more realistic for real-world use.

That distinction matters because some of the most significant work completed is not purely visual. It sits underneath the surface in the form of system behaviour, reliability, and operational control.

## Current State of the Platform

At this stage, SKIIP includes a solid foundation across the main product roles:

- buyer-facing ordering flow
- vendor dashboard and product management
- admin dashboard and vendor oversight
- Stripe-based order flow
- order tracking and account history
- supporting backend functions, database structure, and documentation

In addition, the project includes several higher-effort areas that were not part of a minimal implementation path, especially around payments, recovery handling, notification infrastructure, and operational governance.

The platform is therefore stronger than the original baseline in several important respects.

## Platform Value Positioning

SKIIP should be understood as a custom digital platform build rather than a small website or a simple MVP landing-page style product.

In its current form, it represents a custom transactional platform with multiple user roles, operational workflows, payment integration, notifications, vendor management, and launch-readiness work.

A product of this nature would typically be priced materially higher if commissioned from an external software company today.

Based on the current product shape, a reasonable market replacement-cost framing for a platform like SKIIP would sit in the following ranges:

- Lean small studio / freelancer build: R250,000-R400,000
- Established South African agency build: R600,000-R1,200,000
- Higher-end international product agency build: R1,500,000+

These ranges are not presented as a formal quotation. They are included as a market-value framing of what it generally costs to design, build, test, and deliver a custom platform of this type.

### Why SKIIP Is Not a Basic Website Project

SKIIP should not be viewed as a brochure site or a once-off marketing website.

It includes a combination of platform features and operational systems that increase both technical complexity and delivery value, including:

- customer account and ordering flows
- vendor-side operational tooling
- admin-level management capability
- payment processing and payment-state handling
- live order visibility and status transitions
- notification flows across the platform
- launch hardening, testing, and production-readiness work

This means the project sits closer to a custom commerce or marketplace-style platform than a standard web build.

### What Drives the Value of the Current Build

The current value of SKIIP is not only in the visible screens, but in the system underneath them.

A platform like this carries value across several layers:

| Value layer | Why it matters |
| --- | --- |
| Product and workflow design | The system is built around real-world event and vendor operations, not only static pages. It required thought around how customers place orders, how vendors receive and manage those orders, and how administrators oversee activity. |
| Custom development | The platform includes bespoke functionality rather than off-the-shelf website components. Core logic, operational dashboards, payment handling, and workflow rules all increase effort compared to a typical site build. |
| Transactional risk and reliability | Any platform that handles orders, payment states, and operational fulfilment requires a higher level of care than a non-transactional website. Development time is spent not only on features, but also on making those features reliable. |
| Multi-role system complexity | SKIIP is not built for a single type of user. It requires separate experiences and permissions across customer, vendor, and administrative use cases, which adds scope and development overhead. |
| Launch preparation and hardening | A meaningful portion of value in software projects like this comes after the first version works. Refinement, fixes, production hardening, edge-case handling, and operational confidence all contribute to the real delivery value. |

In the current software market, custom platforms are generally priced based on complexity, delivery risk, number of system roles, integration requirements, and expected operational reliability.

Where a simple business website may be priced in the tens of thousands of rand, a platform like SKIIP typically enters a different commercial category entirely.

A company taking on a comparable project from scratch would usually need to price for:

- product planning and scoping
- interface design and implementation
- frontend and backend development
- database and operational logic
- payment integration
- testing and defect resolution
- launch preparation and deployment support
- project management and iteration across multiple phases

Once these are considered together, the current shape of SKIIP sits comfortably above the level of a small MVP website engagement.

The important takeaway is simple:

> The value already represented in the current SKIIP platform is materially higher than what would normally be expected from a low-cost web project.

Even where a project may originally have been discussed in early MVP terms, the platform as it exists now reflects an expanded and more capable build. That does not only mean more screens or more time spent. It means the project has matured into something with broader operational capability and greater commercial replacement value.

## Phase 6: Final Launch Readiness

Final launch readiness should be treated separately from whether code exists in the repository.

The current platform has a strong closed-pilot foundation, but a real event launch still requires external setup and operational verification. These items are not the same as post-launch product features, but they do require time and coordination.

Phase 6 final launch-readiness items still to confirm include:

- live provider setup for Stripe, Resend, Twilio/WhatsApp, Vercel, and Supabase
- environment and secret parity across staging and production
- Stripe test-mode payment, refund, payout, and reconciliation rehearsal
- vendor onboarding rehearsal with a Stripe-onboarded seller
- notification provider template and webhook verification
- decision on whether notification retries are manual or externally scheduled
- final auth/RLS sign-off
- authenticated smoke tests with stable buyer, seller, and admin credentials
- event-day support, escalation, and response expectations

This should be framed as a final launch-readiness layer, not as a hidden feature gap.

## Phase 7 and Beyond: Post-Launch Scope

It is also important to separate platform evolution from later post-launch product work.

Some items that may appear in later discussions, revised expectations, or broader product vision are still best treated as Phase 7 and beyond unless separately confirmed and implemented.

These include:

- QR code collection and scanning workflows
- deeper event creation and event management tools
- full multi-event operational capability
- advanced analytics and reporting
- low-stock alert workflows
- production-grade marketing lead capture
- broader buyer account tools
- larger reporting dashboards
- major design-system or UI rebuilds

This distinction helps keep the conversation clear:

- some work has expanded beyond the original baseline and has already been completed
- Phase 6 launch-readiness work still needs to be completed before real launch
- Phase 7 and beyond work should not be assumed to be included automatically

## Commercial Interpretation

The original commercial framing appears to match a conventional MVP software build.

The current delivery profile is broader than that.

This is because the project has grown not only in user-facing functionality, but also in technical depth. That additional depth includes money-handling safeguards, reconciliation behaviour, notification systems, admin tooling, release preparation, and operational support structures.

That broader delivery profile should also be considered against realistic replacement cost. A fair client-facing view is that SKIIP, in its current state, is a custom platform product with a realistic market value significantly above an entry-level website or early concept MVP.

A reasonable replacement-cost framing today would be:

- Conservative lean-build view: approximately R250,000-R400,000
- Realistic professional agency view: approximately R600,000-R1,200,000
- Higher-end agency / international delivery view: R1,500,000+

Accordingly, any pricing previously discussed at a far lower level should be seen in the context of an early-stage commercial assumption rather than a full reflection of the platform's current scope and value.

For the current commercial discussion, the original project value of R30,000 was based on an upfront assumption of scope and effort, rather than a detailed phase-by-phase delivery breakdown.

As the project evolved, the delivered work extended beyond the initial MVP and into later phases of development. The current stage, Phase 5, covers hardening, stabilization, launch-readiness work, bug fixes, and final refinements. This phase still includes roughly 14 remaining issues, in addition to final touch-ups and overall platform polish.

Based on the work already delivered and the time invested, the project value has now reached approximately R50,000. That said, because the original estimate was based on an inaccurate assumption of time and scope from our side, we do not believe it would be reasonable or fair to charge for every hour invested.

The fairer position is to acknowledge both sides:

- SKIIP has received significantly more depth and operational value than the original MVP estimate allowed for.
- DK Digital should also recognise that the initial estimate did not accurately reflect the amount of work required.
- The next step should therefore be a balanced commercial reset rather than a full hourly back-charge.

In practical terms, the project has evolved across the following phases:

| Layer | Description |
| --- | --- |
| Phase 1: mockup | Product concept, initial UX direction, and visual/product shape |
| Phase 2: technical foundation | Database, backend structure, early payments, access patterns, guest ordering, and core app scaffolding |
| Phase 3: core product flows | Buyer authentication, vendor/auth flows, menu/cart/checkout, order tracking, vendor products, admin overview, inventory, images, and notification foundations |
| Phase 4: pilot readiness and polish | Deployment setup, marketing/supporting pages, Stripe Connect, stability fixes, GBP/payment readiness, checkout fixes, and vendor paid-order lifecycle rules |
| Phase 5: hardening and fixes | Payment hardening, inventory protection, reconciliation support, notification infrastructure, operational tooling, security/access work, documentation, and bug fixes |
| Phase 6: final launch readiness | Live provider setup, environment parity, payment/refund rehearsal, auth/RLS sign-off, notification verification, and event support planning |
| Phase 7 and beyond: post-launch scope | QR operations, fuller event tooling, advanced analytics, broader platform expansion, and major UI/product expansion |

This is why the current project should be understood as an evolved platform build rather than only the original MVP concept.

## Recommended Client Understanding

The fairest way to view the project is:

> SKIIP started as a focused MVP ordering platform, but during delivery it evolved into a broader operational product. The current build includes not only the core ordering experience, but also substantial behind-the-scenes work to improve payment safety, reliability, recoverability, admin/vendor operations, and launch preparation. Those additions strengthen the platform materially, but they also represent implementation effort beyond a basic MVP baseline. Phase 6 should now focus on final launch readiness, while Phase 7 and beyond should cover post-launch product expansion that is separately agreed before being treated as included deliverables.

## Recommended Next Steps

1. Confirm the commercial baseline being used for discussion.
2. Separate the project into clear buckets:
   - Phase 1 mockup
   - Phase 2 technical foundation
   - Phase 3 core product flows
   - Phase 4 pilot readiness and polish
   - Phase 5 hardening, security, and bug fixes
   - Phase 6 final launch readiness
   - Phase 7 and beyond post-launch scope
3. Avoid treating deferred items as part of the already-delivered implementation unless they have been explicitly built and accepted.
4. Keep launch support, event-day support, provider setup, and post-launch platform expansion separate from the original build conversation.
5. Agree the next written scope before continuing with Phase 6 launch-readiness work or Phase 7 and beyond product expansion.

## Closing Position

SKIIP has evolved meaningfully during delivery.

That evolution has improved the strength of the platform, especially in areas that matter for real event usage. It has also taken the project beyond the level of a simple MVP implementation.

The current platform reflects custom software design, iterative development, operational problem-solving, and launch-readiness work that together place it in a meaningfully higher value bracket than a standard website project.

The key point is not that the project changed in a negative way. It is that the project became broader and deeper than the initial baseline, and that evolution should be understood clearly when discussing delivery, scope, and commercial expectations.
