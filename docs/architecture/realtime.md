# Realtime

Read this when you need the realtime details from [SKIIP Architecture](../ARCHITECTURE.md).

Realtime is used for:

- buyer order tracking
- vendor kanban order dashboard refreshes

Relevant frontend surfaces:

- [OrderTracker.jsx](../../app/src/pages/attendee/OrderTracker.jsx)
- [Dashboard.jsx](../../app/src/pages/vendor/Dashboard.jsx)

Realtime is a UX enhancement, not the source of truth. The database remains authoritative.
