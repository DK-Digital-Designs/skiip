# Important Clarifications

Read this when you need the important clarifications details from [Current State](../CURRENT_STATE.md).

### Signup behavior is launch-aligned

Current code exposes:

- buyer signup at `/signup`

Vendor signup is not exposed in the app router for launch. Admins create seller/store records from the admin vendor management path.

Also note:

- repo auth config keeps email confirmations disabled
- buyer signup copy assumes immediate account availability

That means buyer signup copy and auth configuration are aligned for the launch path.

### Admin vendor operations are edge-function mediated

The admin dashboard refund flow and vendor management flow are edge-function mediated for launch.

[`AdminVendors.jsx`](../../app/src/pages/admin/Vendors.jsx) calls [`admin-store`](../../supabase/functions/admin-store/index.ts) for:

- creating stores
- upgrading users to `seller`
- activating/suspending stores
- archiving stores

Store creation, status changes, and archival are audited. Direct seller store insert/update is disabled for launch, and archived stores use `deleted_at` rather than hard delete.

### Notifications are durable, but retries are not scheduled in-repo

Current notification behavior:

- business flows queue rows into `notification_logs`
- edge-runtime background work attempts immediate dispatch
- provider webhooks update delivery state

Important operational limit:

- there is no scheduler defined in this repository for delayed retry sweeps
- [`notification-dispatch`](../../supabase/functions/notification-dispatch/index.ts) must be triggered manually or by an external scheduler if backlog recovery matters

### The marketing site is not operational lead capture

The marketing surface is maintained outside this repository.

Current reality:

- do not assume marketing-site forms are backend-integrated
- marketing analytics and lead capture are owned by the external marketing repo
- the product app in this repo remains the operational ordering surface and now has its own launch-level analytics/search measurement

Do not treat the marketing site as a backend-integrated operational surface.
