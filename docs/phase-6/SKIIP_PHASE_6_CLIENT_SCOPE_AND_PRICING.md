# SKIIP Phase 6: Launch Delivery, Event Support, and Pricing

Prepared for: SKIIP stakeholders

Prepared by: DK Digital

Prepared on: 10 June 2026

Delivery period covered: 24 May 2026 to 6 June 2026

## Executive Summary

Phase 6 covered the work required to move SKIIP from the hardened Phase 5 baseline into real launch operation.

This phase included:

- production launch activation and environment checks
- event-specific fixes and operational changes
- payment, refund, cancellation, and fee adjustments
- vendor, admin, and buyer workflow improvements
- real vendor and product readiness
- production infrastructure upgrades
- preparation for two planned events
- an event-day hotfix and release for the event that went ahead
- post-event performance and sales reporting

The first planned event, scheduled for 30 May 2026, was cancelled. The preparation, production cutover, testing, feedback changes, and launch-readiness work completed for that event remained delivered work and formed the foundation for the next event.

The second event, held on 6 June 2026, went ahead successfully. SKIIP processed 48 orders, with 45 successful orders across three vendors and GBP 1,022.30 in customer-paid revenue. The production platform remained healthy during the event, with no reported Vercel function errors or timeouts and strong email delivery.

## Phase 6 Scope Delivered

### 1. Launch Activation and Production Readiness

- Confirmed the production domain, Supabase project, and deployed application baseline.
- Aligned production environment variables and Edge Function origins.
- Removed stale production CORS exposure.
- Confirmed production Stripe, Supabase, Vercel, Resend, and application configuration.
- Disabled unverified WhatsApp delivery while retaining email and manual support fallbacks.
- Completed focused production buyer-flow and launch-critical checks.
- Established the first public launch-ready `1.0.0` release baseline.

### 2. Admin and Operational Improvements

- Reorganised the admin portal into clearer operational areas for overview, orders, vendor performance, event setup, and checkout settings.
- Improved vendor order visibility and queue wording.
- Added a persistent vendor new-order banner with polling backup in addition to realtime updates and sound.
- Added protected buyer and vendor issue reporting with admin triage.
- Added internal support-request email alerts.
- Added event-day support and escalation guidance.

### 3. Account Access and Recovery

- Added secure password reset requests and password update screens.
- Corrected repeated production callback and PKCE recovery issues found during live validation.
- Forced recovery links onto the canonical SKIIP domain.
- Added a branded password-recovery email template.
- Added regression coverage for expired, failed, and valid recovery-link handling.

### 4. Buyer Ordering and Checkout Improvements

- Improved keyboard access and focus restoration for menu item details.
- Allowed buyers to reduce quantities to zero and remove checkout lines explicitly.
- Added and refined required checkout phone capture for manual event-day order verification.
- Normalised local and international phone number formatting.
- Hid scheduled-order controls so the event buyer flow remained immediate collection.
- Added allergen and late-collection information.
- Updated configurable-product calls to action to `+ Build My Plate`.
- Removed an unsupported `Trending` claim.
- Added `Snacks` to vendor product categories.
- Added final legal wording supplied for the external marketing site.

### 5. Payments, Fees, Refunds, and Cancellations

- Added the event buyer service-fee model and updated Stripe Checkout presentation.
- Temporarily applied a fee holiday for the cancelled 30 May event.
- Restored the fixed GBP 1.50 buyer service fee for the 6 June event.
- Kept the percentage Stripe Connect application fee at 0% for the live event.
- Added safer full-refund handling for destination charges and transfer reversals.
- Added refund-review support cases when a vendor cancels a paid order.
- Prevented vendors and buyers from cancelling once preparation has started.
- Added clearer buyer cancellation and refund instructions in the app and email notifications.
- Added an event-day correction so cancelled paid orders direct buyers to the SKIIP return form.

### 6. Vendor Product and Menu Readiness

- Added product modifier groups and options for combo-style or configurable products.
- Added buyer-side product configuration and line-specific cart handling.
- Added server-side validation and repricing of modifier selections.
- Added vendor controls for product modifier setup.
- Corrected and deployed the supporting production database migration.
- Reused the product image upload path for vendor profile images.
- Renamed the `Burgers` category/tag to `Mains` across the product and production data.

### 7. Event Operations and Reliability

- Added role-specific inactivity controls.
- Applied a temporary event-day vendor session override so vendors were not signed out during service.
- Added manual phone-contact fallback while WhatsApp/SMS automation remained disabled.
- Updated ready-order email wording for late collections.
- Added event-day release and refund guidance.
- Upgraded Supabase and Vercel capacity/analytics services for the live event.
- Produced a post-event report using order, payment, traffic, performance, email, and backend metrics.

## Event Summary

### Event 1: 30 May 2026

Status: Cancelled

Work completed before cancellation included:

- production activation and environment parity
- payment and service-fee changes
- real-world feedback fixes
- account recovery corrections
- issue reporting and refund-review support
- vendor and menu data updates
- release preparation and launch verification

The cancellation did not reverse the value of this work. The completed preparation reduced risk and carried directly into the 6 June launch.

No separate event-day standby charge for 30 May has been included in this document.

### Event 2: 6 June 2026

Status: Completed successfully

Recorded event results:

| Measure | Result |
| :--- | ---: |
| Total orders | 48 |
| Successful orders | 45 |
| Successful order rate | 94% |
| Customer-paid revenue | GBP 1,022.30 |
| SKIIP service fees | GBP 67.50 |
| Vendors operating | 3 |
| Visitors | 121 |
| Page views | 548 |
| Mobile traffic | 89% |
| Signup completion | 97% |
| Email deliverability | 99.28% |
| Vercel function errors/timeouts | 0 / 0 |

The event validated the core buyer, Stripe, vendor, admin, email, and production infrastructure flow under real usage.

## Pricing

The agreed additional-work and event-support rate is R500 per hour.

The Phase 6 tracker contained an arithmetic error: its listed entries totalled 24 hours, not the displayed 21.5 hours. A further 0.5 hours is recorded for the 6 June event-day hotfix, verification, and `1.12.5` release.

### Development and Launch Delivery

| Workstream | Hours | Rate | Amount |
| :--- | ---: | ---: | ---: |
| Phase setup, tracking, and delivery documentation | 0.5 | R500 | R250 |
| Admin, account recovery, and buyer launch fixes | 7.0 | R500 | R3,500 |
| 30 May event preparation, feedback, cutover, and release work | 7.5 | R500 | R3,750 |
| 6 June event preparation and event-specific product changes | 9.0 | R500 | R4,500 |
| 6 June event-day hotfix, verification, and release | 0.5 | R500 | R250 |
| **Phase 6 development and launch delivery** | **24.5** |  | **R12,250** |

### Reimbursable Infrastructure

Third-party infrastructure is separate from development and support fees.

| Provider | Purpose | Amount | Status |
| :--- | :--- | ---: | :--- |
| Supabase Pro | Production database, authentication, functions, and realtime capacity | R420.36 | Paid by DK Digital |
| Vercel Pro plus analytics add-on | Production hosting, analytics, and performance monitoring | R495.62 | Provisional until the final card charge is confirmed |
| **Infrastructure reimbursement** |  | **R915.98** | Includes provisional Vercel amount |

### Current Commercial Total

| Item | Amount |
| :--- | ---: |
| Phase 6 development and launch delivery | R12,250.00 |
| Confirmed Supabase reimbursement | R420.36 |
| Provisional Vercel reimbursement | R495.62 |
| **Current total before separate event-support hours** | **R13,165.98** |

The confirmed amount excluding the provisional Vercel charge is **R12,670.36**.

## Event-Day Support

The project agreement prices event presence and availability separately at R500 per hour.

No unverified event-support hours have been added to the total above. Any remote standby, active incident response, monitoring, reconciliation support, or on-site availability provided during the 6 June event should be added as:

> Confirmed event-support hours x R500 per hour

This keeps software delivery, third-party costs, and event operational responsibility commercially separate.

## Items Not Included in This Phase 6 Total

- future maintenance under the monthly support arrangement
- future event-day support or standby
- provider usage or overage charges not yet invoiced
- Stripe processing fees deducted from transactions
- WhatsApp sender/compliance activation and future messaging charges
- minimum basket enforcement
- further checkout retry-loop investigation
- future WhatsApp opt-in UX changes
- QR ticketing, scanning, admission control, or full event management
- advanced multi-event analytics and automated reporting
- major new features or redesign work after the launch event

## Recommended Closeout Position

1. Invoice Phase 6 development and launch delivery at **R12,250.00**.
2. Reimburse the confirmed Supabase cost of **R420.36**.
3. Add the final Vercel amount once the card charge is confirmed; the current working amount is **R495.62**.
4. Confirm and add any actual 6 June event-support hours at **R500 per hour**.
5. Move recurring infrastructure billing to SKIIP-owned payment methods.
6. Treat post-event improvements and future event preparation as new written scope.

## Closing

Phase 6 delivered more than a final deployment pass. It converted the hardened platform into a live operational release, absorbed the preparation for a cancelled event, incorporated rapid feedback for a second event, supported the successful 6 June launch, and produced evidence that the platform handled real orders, payments, vendors, traffic, and notifications reliably.

The proposed pricing is based on the agreed R500 hourly rate, the corrected delivery record, and separately recorded third-party infrastructure costs.
