# Admin Vendor Operations

Read this when you need the admin vendor operations details from [SKIIP Architecture](../ARCHITECTURE.md).

Admin vendor/store mutations go through [`admin-store`](../../supabase/functions/admin-store/index.ts) for launch.

Current admin vendor operations:

- create a vendor store and promote the selected owner to `seller`
- activate or suspend a store
- archive a store by setting `deleted_at` instead of hard-deleting it

Audit coverage:

- store creation and archival write explicit admin audit events
- store status changes are audit logged by database trigger with the admin actor supplied by the RPC boundary
- order creation, payment, status transitions, and refunds are audit logged

Also note:

- vendor performance visibility is presented with vendor management at `/admin/vendors`
- launch-event public copy is managed separately at `/admin/events`
