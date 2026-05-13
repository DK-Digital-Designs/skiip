# SKIIP Scope Comparison and Scope Creep Analysis

Prepared for: DK Digital / SKIIP project review  
Prepared on: 6 May 2026  
Repository reviewed: `C:\Users\deang\OneDrive\Documents\GitHub\skiip` on branch `staging`

## Executive Summary

SKIIP has turned out materially larger than the original MVP scope. The original agreement described a mobile-first festival ordering platform with customer ordering, a vendor dashboard, an admin console, Stripe payments, WhatsApp/SMS notifications, responsive UI, QA, and basic reporting. The current project does include the core buyer, vendor, admin, payment, and notification foundation, but the delivered implementation goes beyond a simple MVP in several high-effort backend and operational areas.

The strongest scope expansion is not cosmetic. It is in payment safety, auditability, operational recovery, admin controls, notification infrastructure, launch documentation, and release hygiene. These are valuable and appropriate for a real payments platform, but they are materially beyond a simple page-build or demo-style MVP.

At the same time, some items that appear in the revised agreement are not currently delivered or are intentionally deferred: QR code generation and scanning, full event creation/configuration, deeper platform analytics, low-stock alerts, full multi-event operations, production-grade marketing lead capture, and automated notification retry scheduling.

The cleanest commercial framing is:

- Current state: strong closed-pilot MVP / first operational baseline.
- Additional work already performed: launch-hardening and operational infrastructure beyond the original MVP.
- Still not included unless separately agreed: full launch-readiness verification, live provider setup, event-day support, QR operations, event management, advanced analytics, and future platform expansion.

This is a factual scope analysis, not legal advice.

## Sources Reviewed

| Source | Purpose |
| --- | --- |
| `C:\Users\deang\Downloads\Skiip contract.docx` | Original agreement / early scope baseline and contract terms. |
| `C:\Users\deang\Downloads\SKIIP_Development_Agreement_REVISED (1).docx` | Revised agreement / expanded MVP baseline. |
| User-provided invoice screenshot | Time-estimate baseline for core app setup, database setup, page build, QA/compliance, polish, and content. |
| `docs/CURRENT_STATE.md` | Current implementation truth. |
| `docs/ARCHITECTURE.md` | Active system architecture and runtime boundaries. |
| `docs/ROADMAP.md` | Work not yet implemented. |
| `docs/launch/LAUNCH_CHECKLIST.md` | Launch gates and operational readiness requirements. |
| `docs/operations/OPERATIONS.md` | Day-to-day operational behavior. |
| `docs/operations/NOTIFICATIONS.md` | Notification provider and retry reality. |
| `docs/phase-5/PHASE_5_CLIENT_RECAP.md` | Client-facing recent delivery summary. |
| `docs/phase-5/PHASE_5_INTERNAL_DELIVERY_REPORT.md` | Internal delivery state and verification history. |
| `app/src/App.jsx` | Current routed app surfaces. |
| `app/package.json` | Current frontend stack and test scripts. |
| `supabase/functions/` and `supabase/migrations/` | Backend functions, schema evolution, and hardening evidence. |
| External marketing repo | Separate marketing surface maintained outside this repository. |

## Original Scope Baseline

The original scope described SKIIP as a mobile-first web application for festival attendees to browse vendor menus, place online orders, and collect purchases without waiting in queues.

The original core deliverables were:

- Customer ordering interface: vendor selection, menus, item selection, cart, order submission, order status view, mobile responsiveness.
- Vendor dashboard: secure login, real-time order list, manual status updates, basic menu management.
- Admin / organiser console: vendor onboarding, menu oversight, order monitoring by vendor/status, basic reporting.
- Integrations: Stripe payment gateway and WhatsApp Business API or SMS notifications.
- Backend: user/vendor/menu/order data management, order processing, status tracking, secure interactions, future payment/messaging expansion.
- QA: end-to-end flow testing, browser/device responsiveness, performance, security checks, and MVP bug fixes.
- Exclusions: advanced analytics, multi-event enterprise scaling, payout automation beyond Stripe settlement, offline-first behavior, complex refund handling, accounting integrations, native apps, and SLA guarantees.

The invoice screenshot also frames the project as a scoped build made up of:

- authentication system: estimated 10-20 hours
- database setup and configuration: estimated 10-20 hours
- page design and implementation: estimated 3-5 hours per page
- SEO: estimated 2 hours
- accessibility compliance: estimated 2 hours
- performance optimization: estimated 2 hours
- UI polish and final QA: estimated 5 hours
- copywriting/content refinement: estimated 10 hours

That invoice baseline is closer to a conventional web-app build estimate than to a full payment operations, reconciliation, notification outbox, audit, and launch-hardening program.

## Revised Scope Baseline

The revised agreement expands and clarifies the MVP. It adds or makes explicit:

- event selection and browsing
- vendor filtering by category
- product images and descriptions
- Stripe checkout
- QR code generation for collection
- order history and receipt access
- vendor sound alerts
- QR scanning validation
- product archive behavior
- inventory tracking and low-stock alerts
- basic vendor sales reporting
- event creation and configuration
- transaction monitoring and reconciliation tools
- platform analytics
- detailed acceptance testing and warranty terms
- full IP transfer upon full payment
- optional monthly hosting and maintenance service terms

This revised scope is materially broader than the older agreement, but it still excludes advanced analytics, multi-event enterprise scaling, automated payout systems beyond Stripe settlement, complex refund/dispute systems, accounting integrations, native apps, loyalty/reviews, in-app support chat, and SLA uptime guarantees.

## Current Project Outcome

As of this review, the product is best described as a strong closed-pilot MVP / first operational baseline.

Current implemented surfaces include:

- Product app in `app/`, built with React 19, Vite 7, React Router, Supabase JS, TanStack Query, and Zustand.
- Separate marketing site maintained outside this repository.
- Supabase backend with 24 timestamped migrations.
- 12 deployable edge-function directories plus shared backend helpers.
- Buyer routes for signup/login, vendor browsing, menu, cart/checkout, order tracking, and profile/history.
- Vendor routes for dashboard and product management.
- Admin routes for dashboard and vendor management.
- 35 passing unit tests from the current `npm run test` run.

The current production-critical path is:

1. buyer signs in
2. buyer creates an order through a server-authoritative edge function
3. buyer is redirected to Stripe Checkout
4. Stripe webhook marks the order as paid and finalizes inventory
5. vendor moves the paid order through the active lifecycle
6. admin can view metrics and issue refunds

This goes beyond a simple frontend/admin build because the money path now has server-side validation, Stripe webhook idempotency, inventory finalization, audit logging, refunds, and reconciliation fields.

## Scope Comparison Matrix

| Area | Original / revised expectation | Current outcome | Classification | Notes |
| --- | --- | --- | --- | --- |
| Customer ordering | Vendor browsing, menu, cart, order submission, status view, mobile-first UI. Revised adds event selection/filtering, product images, order history/receipts, QR collection. | Buyer signup/login, vendor listing, menu, cart, authenticated checkout, Stripe redirect, live order tracker, profile/order history. Product images are supported. | Mostly delivered, with gaps | QR collection and full event browsing/filtering are not currently active launch features. |
| Vendor dashboard | Secure login, real-time order list, status updates, basic menu management. Revised adds sound alerts, QR scanning, inventory tracking, low-stock alerts, sales reporting. | Vendor login, protected dashboard, live order refresh, sound notification behavior, kanban-style active/scheduled/all queue filtering, status transitions, cancellation, Stripe Connect onboarding, product and inventory management. | Delivered plus expanded | QR scanning and explicit low-stock alerts are not delivered; inventory exists with stock/sold-out handling. |
| Admin / organiser console | Vendor onboarding, menu oversight, order monitoring, basic reporting. Revised adds event creation, content moderation, reconciliation, platform analytics. | Admin dashboard metrics, recent orders, vendor performance, notification health, refunds, payment reconciliation, vendor creation/status/archive through edge functions. | Delivered plus expanded, with event gap | Event management is deferred; `/admin/events` exists as a stub but is not routed for launch. |
| Payments | Stripe payment gateway; revenue settlement through Stripe. Revised explicitly includes secure checkout. Complex refund handling excluded. | Stripe Checkout, Stripe Connect, 10% platform fee logic, webhook-driven finalization, multiple webhook secret support, payment failure recording, admin refund path, admin reconciliation path, fee/vendor net fields. | Major scope expansion | Payment recovery, idempotency, refunds, and reconciliation are launch-hardening work beyond a basic gateway integration. |
| Inventory | Menu/item management; revised adds inventory tracking and low-stock alerts. | Inventory quantity on products, buyer sold-out handling, server-side inventory checks, atomic inventory finalization after payment, restock on cancellation/refund paths. | Expanded | Atomic inventory and restock behavior exceed basic inventory tracking. Low-stock alerts remain future work. |
| Notifications | WhatsApp Business API or SMS for order confirmations/status updates. | Email via Resend and WhatsApp via Twilio architecture, notification logs/outbox, provider webhooks, retry/backlog endpoint, opt-in WhatsApp behavior. | Expanded but not fully live-verified | Provider accounts/secrets/templates and automatic retry scheduler still require external setup. SMS has no live sender path. |
| Auth and access control | Role-based auth for admins/vendors; standard security practices. Revised adds role-based access control and Supabase Auth. | Supabase Auth, user profile reconciliation, ProtectedRoute, launch RLS matrix, manual bearer validation in protected edge functions, 401/403 behavior documented. | Expanded | This is more robust than basic login pages. Final auth posture still requires launch sign-off. |
| Backend/database | Structured database for customers, vendors, menus, orders/status. | 24 migrations, RLS, RPCs, audit logs, payment/event logs, notification outbox tables, Stripe processed events, storage policies. | Major expansion | Backend has become an operational platform foundation rather than a basic database. |
| QA/testing | Functional testing, responsiveness, performance, basic security checks. | 35 unit tests passed in this review. Docs record previous build/lint/e2e passing, with authenticated e2e skipped without credentials. | Partially delivered | Live provider, Stripe payout, RLS, full auth e2e, and payment-path rehearsals still need completion before launch-ready status. |
| SEO/accessibility/performance | Foundational SEO, WCAG-aligned basics, optimization. | Product app and separate marketing surface exist, but accessibility/performance are not evidenced as complete launch checks. | Partial / unclear | This should not be oversold as fully complete without a separate audit. |
| Marketing site/content | Original scope references content and SEO, not a separate full marketing surface. | Separate marketing site maintained in an external repo. | Additional surface | Useful, but not an operational lead-capture system. |
| Documentation/handover | Revised agreement asks for technical documentation, deployment/setup instructions, and training materials. | Extensive docs source of truth: architecture, current state, roadmap, deployment, secrets, launch checklist, operations, notifications, testing data, delivery workflow, release docs. | Expanded | Documentation is materially stronger than a minimal handover pack. |
| Event management | Original mentions event organisers; revised explicitly includes event creation/configuration. | Event management is deferred; admin event page is not routed for launch. | Not delivered / future scope | Should be treated as separate phase unless re-scoped. |
| QR collection | Revised agreement includes QR generation and validation/scanning. | No active QR generation or scanning evidence found in app/functions/migrations. | Not delivered / future scope | This should be clearly excluded from current acceptance unless separately implemented. |

## Clear Scope Expansion Already Performed

| Expansion item | Why it exceeds the original MVP baseline | Evidence |
| --- | --- | --- |
| Server-authoritative order creation | Original scope did not require a hardened server-side price authority. Current system rejects client-trusted pricing and computes totals server-side. | `order-create`, `create_order_with_items_v1()`, `docs/ARCHITECTURE.md`. |
| Stripe webhook idempotency and retry recovery | A basic Stripe integration does not require retry-aware event processing and processed-event state. | `stripe_processed_events`, `stripe-webhook`, `20260502000000_payment_state_recovery.sql`. |
| Automatic inventory finalization and restock logic | Original scope described order/menu handling, not race-safe inventory commits after payment. | `finalize_paid_order_inventory()`, `restock_order_inventory()`. |
| Admin refunds and payment reconciliation | Original/revised exclusions push complex refund/dispute systems outside MVP, yet current admin has refund and reconcile paths. | `stripe-refund`, `stripe-reconcile-order`, `DashboardV2.jsx`. |
| Payment ledger fields | Platform fee, Stripe fee, vendor net, charge/payment IDs, and reconciliation display are beyond basic order monitoring. | `orders.platform_fee`, `stripe_fee`, `vendor_net`, admin recent orders. |
| Notification outbox and provider webhooks | Original scope mentioned WhatsApp/SMS notifications, not durable notification logs, Resend/Twilio adapters, webhook event capture, and backlog dispatch endpoint. | `notification_logs`, `notification_webhook_events`, `notification-dispatch`, Resend/Twilio functions. |
| Launch RLS/access-control hardening | Basic role auth expanded into role matrix, manual edge-function bearer validation, and documented 401/403 contract. | `docs/reference/RLS_ACCESS_MATRIX.md`, `_shared/auth.ts`, `supabase/config.toml`. |
| Admin-created vendor operations | Admin vendor creation, role promotion, activation/suspension/archive, and audit records exceed basic vendor management. | `admin-store`, `AdminVendors.jsx`, `20260428000003_admin_vendor_operations.sql`. |
| Product image storage hardening | Revised scope mentions images, but storage bucket policy repair and MIME/size controls are additional backend/storage work. | `20260504120822_repair_product_images_storage_policies.sql`, `ProductImageUpload.jsx`. |
| Delivery and release governance | GitHub workflow, release rules, launch runbooks, docs audit, progress logs, and issue tracking are beyond a normal MVP build. | `docs/delivery/*`, `docs/launch/*`, `PROGRESS-2.md`. |
| Separate marketing site | Marketing ownership now sits outside this repository. | [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing). |

## Revised-Scope Items Still Missing or Deferred

| Item | Current status | Commercial / scope implication |
| --- | --- | --- |
| QR code generation for collection | No active implementation evidence found. | Should be future scope or change order. |
| QR scanning validation for pickup | No active implementation evidence found. | Should be future scope or change order. |
| Event creation and configuration | Stub exists but not routed; docs classify event management as deferred. | Should be future scope unless explicitly added. |
| Full multi-event operation | Not launch-ready; current docs classify true multi-event tenancy as intentional scope limit. | Separate phase. |
| Advanced platform analytics | Admin metrics exist, but advanced analytics/BI remains excluded/future. | Do not count as delivered advanced analytics. |
| Low-stock alerts | Inventory count and sold-out handling exist; no clear low-stock alert workflow found. | Future polish/operations feature. |
| Production-grade lead capture | Static marketing forms open email drafts. | Future marketing-site integration. |
| Automated notification retry scheduler | `notification-dispatch` exists, but no in-repo scheduler calls it. | Launch operations decision or separate setup task. |
| Live notification provider verification | Code supports Resend/Twilio, but provider secrets/templates still need real setup. | External launch-readiness task. |
| Full payment/payout rehearsal | Stripe code exists; launch docs still require one complete payment, payout, refund, and reconciliation rehearsal. | Launch-hardening task, not just code delivery. |
| Authenticated e2e coverage | Unit tests pass; docs record authenticated e2e tests as skipped without credentials. | Testing gap before launch-ready status. |

## Implementation Variance From Revised Agreement

The revised agreement names a specific technical architecture: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Vercel, Supabase Realtime, and Supabase Storage.

The current repo differs:

- Frontend is React 19 with Vite 7, JavaScript, React Router, TanStack Query, Supabase JS, and Zustand.
- It is not a Next.js / TypeScript / Tailwind / shadcn app.
- Supabase remains the backend and system of record.
- Realtime is used for order tracking and vendor dashboard refresh behavior.
- Supabase Storage is used for product images.

This is not automatically a negative outcome if the app works, but it is a contract variance. If the revised agreement is being treated as the governing scope, either the agreement should be updated to match the actual stack or the variance should be formally accepted.

## Launch-Readiness Position

The current repo should not be described as a finished open-launch platform yet. It is better described as:

> A strong closed-pilot MVP with substantial launch-hardening already completed, but still requiring live-provider verification, payment rehearsal, access-control sign-off, and operational support decisions before real event launch.

Remaining launch gates include:

- final auth/RLS sign-off
- environment and secret parity across Vercel, Supabase, Stripe, Resend, and Twilio
- Stripe test-mode payment, payout, refund, and reconciliation rehearsal with a Stripe-onboarded seller
- provider setup and verification for notifications
- notification retry/backlog process decision
- authenticated Playwright smoke tests with stable role credentials
- marketing-site ownership decision if the external marketing repo is part of launch
- event support and escalation process confirmation

## Commercial Interpretation

The original MVP price and invoice-style estimates are not well aligned with the current project reality. The project now includes payment operations, refund handling, notification delivery infrastructure, auditability, storage policy work, launch runbooks, and release governance.

Suggested commercial framing:

| Category | Recommended treatment |
| --- | --- |
| Original MVP | Customer ordering, vendor dashboard, basic admin console, Stripe checkout, basic notifications, responsive UI, basic QA. |
| Already-performed added value | Payment hardening, webhook recovery, admin reconciliation/refunds, audit logs, RLS/auth hardening, durable notifications, vendor ops hardening, product image storage, launch docs. |
| Launch-hardening still needed | Live provider setup, Stripe payout/refund rehearsal, RLS sign-off, environment parity, notification retry decision, authenticated e2e, operator runbooks. |
| Future roadmap / change orders | QR pickup, event management, multi-event operations, advanced analytics, lead capture, broader buyer account tools, mobile polish, design-system overhaul. |
| Ongoing support | Maintenance, event-day standby, incident response, provider monitoring, and hosting coordination should remain separate from one-off development. |

If the discussion is about scope creep, the most defensible position is that the build has already moved beyond a conventional MVP into launch-hardening work. That extra work should be recognized commercially, even though several revised-agreement product features remain unbuilt.

## Recommended Client-Facing Position

Use this wording or similar in a scope discussion:

> The original MVP was a customer/vendor/admin ordering platform with Stripe and notifications. The current build now includes that core loop plus substantial production safety work: server-side order authority, Stripe webhook recovery, audit logs, refunds, payment reconciliation, notification delivery tracking, vendor operations hardening, and launch documentation. Those additions make the platform safer for real event usage, but they also represent work beyond a simple MVP page build. Some later product features, such as QR collection, event management, advanced analytics, and production lead capture, remain future scope and should be separately agreed before implementation.

## Recommended Next Steps

1. Confirm which agreement is the commercial baseline: original contract, revised agreement, or a new written scope confirmation.
2. Separate the discussion into three buckets: delivered MVP, already-performed launch-hardening, and future/change-order work.
3. Do not label the current project “fully launch-ready” until live-provider checks and payment rehearsals pass.
4. Treat QR operations, event management, advanced analytics, marketing lead capture, and multi-event tooling as future scope.
5. If launch support is expected, define it separately from monthly maintenance: support hours, response windows, event-day standby, provider responsibilities, and escalation process.

## Verification Performed During This Review

- Extracted and reviewed both provided `.docx` agreements.
- Reviewed active repo source-of-truth docs in `docs/`.
- Reviewed routed app surfaces in `app/src/App.jsx`.
- Reviewed frontend stack and scripts in `app/package.json`.
- Reviewed Supabase migrations and edge-function directories.
- Searched implementation evidence for QR, event management, inventory, payments, notifications, and reconciliation.
- Ran `npm run test` in `app/`: 4 test files passed, 35 tests passed.
