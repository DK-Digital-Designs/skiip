# Admin Vendor Operations

Read this when you need the admin vendor operations details from [Operations](../OPERATIONS.md).

Launch vendor/store mutations go through `admin-store`, an admin-only Edge Function that calls service-role RPCs and writes audit records.

Current admin vendor operations:

- create a vendor store and promote the selected owner to `seller`
- activate or suspend a store
- archive a store by setting `deleted_at` and suspending it

Operational consequence:

- store creation, status changes, and archival are actor-audited
- browser-side admin writes to `stores` and `user_profiles` are not part of the launch path
- archival is used instead of hard delete for launch safety
