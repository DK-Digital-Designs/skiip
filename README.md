# SKIIP - Premium Festival Ordering Platform

**Skip the queue. Order food and drinks instantly from your phone.**

SKIIP is a high-performance, multi-tenant ordering platform designed for high-concurrency environments like music festivals and large-scale venues. It provides a seamless guest checkout experience for attendees and robust management tools for vendors and administrators.

---

## 🔐 Demo Accounts (Testing)

Use these credentials to explore the different roles within the ecosystem:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `admin@example.com` | `password123` |
| **Vendor (Burger Bliss)**| `vendor@example.com` | `password123` |
| **Standard Buyer** | `buyer@example.com` | `password123` |

---

## 📱 Ecosystem Roles

### 🎟️ Attendee Experience
- **Frictionless Ordering**: Browse menus and add items to a persistent cart.
- **Guest Checkout**: Securely checkout using just a phone number or email.
- **Real-time Tracking**: Watch your order status change from "Pending" to "Ready" via live Supabase updates.
- **Stable UX**: Specialized reconnection logic and storage sanitization to ensure the app works in crowded festival environments.

### 🏪 Vendor Portal
- **Order Management**: Real-time dashboard with audio alerts for new orders.
- **Menu Control**: (In Progress) Toggle stock availability and manage product listings.
- **Quick Actions**: Double-tap status updates to move orders through the pipeline.

### 🛡️ Admin Suite
- **Live Metrics**: Dashboard connected to live production data (Revenue, Order volume, Vendor count).
- **Vendor CRUD**: Full control to create, approve, or suspend vendor stores.
- **System Health**: Monitoring for Supabase connectivity and Stripe webhook status.

---

## 🛠️ Technology Stack

- **Frontend**: React 18 + Vite (optimized for speed/LCP)
- **Styling**: Modern CSS with high-end glassmorphism and responsiveness.
- **Backend / DB**: Supabase (PostgreSQL + Realtime + Auth)
- **Payments**: Stripe (UK Standard GBP Integration)
- **Infrastructure**: Vercel (Deployed in London/LHR region for low latency)

---

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Copy `.env.example` to `.env` and provide your credentials:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### 3. Local Development
```bash
npm run dev
```

For a deeper dive into architecture and setup, see [SETUP.md](SETUP.md).

---

## 🏁 Current Status: PILOT READY

✅ **Infrastructure**: UK Localization (GBP), Error Tracking (Sentry), Loading States.
✅ **Payments**: Stripe UK integration verified.
✅ **Admin**: Vendor management and live dashboard complete.
✅ **Stability**: Global storage sanitization and auth-lock fail-safes implemented.

🔜 **Next Steps**:
- High-concurrency load testing.
- QR Code Batch Generation toolkit.
- "Global Pause" Emergency override.

---

## 📝 License

Private Property - **Skiip Technologies © 2026**
All rights reserved.