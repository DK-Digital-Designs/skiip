# Event-Day Support Note

Read this when you need the event-day support posture and fallback handling from [Operations](../OPERATIONS.md).

For the event, the ground team should handle most customer and vendor questions directly. Checkout captures a required operational phone number on each order so staff have a manual fallback contact if signal drops, email is missed, dashboard refresh is delayed, fulfilment needs verification, or payment reconciliation needs buyer confirmation.

WhatsApp and SMS automation remain off for the pilot. Captured phone numbers are for manual order verification/contact only.

Main risks and fallback plan:

- Weak signal or buyer cannot show order: use the vendor/admin order list and verify by order number, name/email, and phone number.
- Vendor dashboard does not refresh: refresh the page, check the active order list, and escalate if multiple vendors are affected.
- Payment succeeds but order does not show as paid: check Stripe first, then reconcile from Admin Orders if Stripe confirms payment.
- Checkout or payments start failing for multiple people: pause new checkout from Admin Settings while the issue is investigated, then reopen once stable.
- Email or order-ready notification is missed: vendors should still move orders through the dashboard; staff can contact the buyer manually using the captured phone number.
- Refund or cancellation issue: log it in Admin Issues/Admin Orders and avoid retrying from multiple places; review and action from one operator path.

Backend, payment, and order support can be available on paid standby during the agreed event window. Lwazi and the on-site team remain first line for ground questions. Escalate to technical support for backend data, payment state, order reconciliation, checkout failures, or urgent hotfixes.
