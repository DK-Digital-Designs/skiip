# Priority 3: Later

Read this when you need the priority 3: later details from [Roadmap](../ROADMAP.md).

These are worthwhile improvements, but they should not distract from launch safety or operational maturity.

### UI and UX

- Full visual polish pass across buyer, vendor, and admin surfaces.
- Design system cleanup and stronger shared component consistency.
- Better mobile-first polish for high-traffic buyer flows.
- Improved loading, empty, and error states throughout the app.
- Accessibility pass across forms, dashboards, and order tracking.

### Product Expansion

- True multi-event and broader multi-tenant support.
- Expanded organiser tooling.
- Buyer-facing notification history.
- QR tooling and event operations utilities.
- Broader buyer account management.

### Scale and Performance

- Large-scale concurrency and load-test tooling.
- Deeper performance profiling for peak-event traffic using Vercel Speed Insights field data plus targeted load testing.
- Background-job architecture changes if current edge-function plus outbox flow no longer scales.
- Archival and retention strategy for orders, notifications, and audit logs.

### Analytics and Reporting

- Advanced reporting beyond the current Vercel/Search Console launch telemetry.
- Post-event report automation that combines campaign/funnel analytics with authoritative Supabase and Stripe order/payment data.
- Multi-event analytics once event-management scope is implemented.
