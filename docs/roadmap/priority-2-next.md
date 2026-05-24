# Priority 2: Next

Read this when you need the priority 2: next details from [Roadmap](../ROADMAP.md).

These items matter, but they do not block a safe first launch if Priority 1 is complete.

### Infrastructure and Environment Maturity

- Enable Supabase Pro features such as database branches if they become part of the deployment model.
- Run a backup verification and restore drill.
- Add environment comparison checks so staging and production do not drift silently.
- Configure external Supabase Metrics API monitoring and alert routes if the launch support model needs database-health alerts outside Supabase Studio.
- Decide whether preview deployments should have backend connectivity.

### Product and Admin Capability

- Improve admin tooling for investigating:
  - failed payments
  - refunded orders
  - notification failures
  - individual vendor performance and payout context
- Continue vendor-side queue polish with search, clearer order cards, and higher-volume handling on top of the current kanban baseline.
- Add buyer profile defaults for checkout data such as phone and country instead of relying on one deployment default country code.

### Engineering Quality

- Refactor large page components into clearer feature boundaries.
- Reduce inline-style-heavy UI surfaces where maintainability is suffering.
- Improve automated coverage depth around:
  - order creation validation
  - inventory finalization and restock
  - refund eligibility
  - auth failure paths
  - notification dispatch behavior
- Add stronger CI checks for docs, tests, and release consistency.
