# Frontend

Read this when you need the frontend details from [SKIIP Architecture](../ARCHITECTURE.md).

The product app is built with:

- React 19
- Vite 7
- React Router 7 using `HashRouter`
- TanStack Query
- Supabase JS
- Zustand for cart state
- Vercel Web Analytics
- Vercel Speed Insights

Important consequence:

- app URLs use `/#/...` routes, for example `/#/order` and `/#/vendor/dashboard`
- campaign links should keep UTM parameters before the hash route when possible, for example `/?utm_source=poster&utm_medium=qr&utm_campaign=sawft_launch#/order`

Current routed surfaces in [App.jsx](../../app/src/App.jsx):

- landing page
- shared buyer/admin/seller login and buyer signup
- admin-created vendor onboarding for launch; `/vendor/signup` is not exposed in the app router
- buyer ordering flow
- vendor kanban order dashboard and product management
- admin operations workspace with overview, orders, vendor management, event setup, and checkout settings routes

Admin routes:

- `/admin/dashboard` provides read-only operational summaries
- `/admin/orders` provides refund and payment reconciliation actions
- `/admin/vendors` provides vendor mutations and performance visibility
- `/admin/events` provides launch-event public copy management
- `/admin/settings` provides checkout pause/resume controls

Legacy files still exist in the repo but are not part of the routed app today, including:

- [`app/src/pages/attendee/BuyerLogin.jsx`](../../app/src/pages/attendee/BuyerLogin.jsx)
- [`app/src/pages/attendee/BuyerSignup.jsx`](../../app/src/pages/attendee/BuyerSignup.jsx)
- [`app/src/pages/admin/Dashboard.jsx`](../../app/src/pages/admin/Dashboard.jsx)
