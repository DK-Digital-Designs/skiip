# Skiip - Architecture & Implementation Analysis

This document outlines the technical approach, feasibility, and implementation strategy for the Skiip system based on `SYSTEM_OVERVIEW.md`.

## 1. High-Level Architecture
**Pattern:** Unified Monorepo with Role-Based Access or Micro-frontends.
**Recommended Stack:**
- **Frontend:** Next.js (React) or Vite.
  - Allows Server-Side Rendering (SSR) for SEO (Marketing/Organiser pages) and Client-Side Rendering (CSR) for dynamic dashboards (Vendor/Client).
- **Backend:** Node.js (Serverless functions or Dedicated Container) or Go.
- **Database:** PostgreSQL (via Supabase or Neon).
- **Infrastructure:** Vercel (Frontend) + AWS/GCP (Backend logic/Storage).

---

## 2. Core Modules Implementation

### A. Authentication & Users
- **Requirement:** Google, Apple, etc.
- **Implementation:** 
  - Use **Supabase Auth** or **Clerk** or **Auth0**.
  - **Why:** Handles OAuth social providers out-of-the-box, manages sessions, and scales easily.
  - **Challenge:** Ensuring "Guest Checkout" flow exists if needed, or if every user *must* have an account (fast onboarding is critical at festivals).

### B. Database & Data Model
- **Requirement:** Scalable, Relations (Vendors -> Events -> Orders).
- **Strategy:** Relational Database (PostgreSQL).
- **Key Tables:**
  - `Profiles` (Users/Admins)
  - `Vendors` (Shops)
  - `Menus` & `Products`
  - `Orders` (High read/write throughput)
  - `Events` (Festival config)
- **Scalability:** High read/write during festivals. Indexes on `event_id` and `vendor_id` are critical.

### C. Live Real-Time Engine (The "Heart")
- **Requirement:** Live Ordering System, Order Tracking, Vendor Dashboard Updates.
- **Implementation:** **WebSockets** or **Server-Sent Events (SSE)**.
  - **Supabase Realtime**: Excellent choice if using Postgres. Listen to `INSERT/UPDATE` on the `orders` table.
  - **Alternative**: Socket.io server (Node.js) backed by Redis for pub/sub.
- **Feasibility:** High. Essential for the "update status" -> "Client view updates" loop.

---

## 3. Dashboard Implementation Breakdown

### Client App (Web/Mobile)
- **Focus:** Performance, Mobile-first, Speed.
- **Tech:** PWA (Progressive Web App).
- **UX:** QR Code scan -> Menu -> Cart -> Apple Pay/Google Pay (Stripe) -> Order Tracking screen.
- **Offline Note:** Needs graceful error handling if network drops.

### Vendor Dashboard
- **Focus:** Reliability, Sound alerts, Large buttons (Tablet use).
- **Tech:** React Dashboard protected by Vendor Auth.
- **UX:** Kanban or List View. "New" (Start) -> "Cooking" (Notify) -> "Ready" (WhatsApp).

### Organiser/Admin Dashboard
- **Focus:** Analytics, Management.
- **Tech:** React with Chart libraries (Recharts/Chart.js).
- **Data:** Aggregated queries (e.g., `SUM(order_total) WHERE event_id = X`).

---

## 4. Connections & Integrations

### Payment Gateways (Stripe)
- **Implementation:** **Stripe Connect**.
  - Allows handling complex flows: Customer pays Platform -> Platform takes fee -> Platform payouts Vendor.
  - Essential for multi-vendor environments.

### WhatsApp API (Notifications)
- **Requirement:** Notify users when food is ready.
- **Implementation:** **Twilio** or **Meta Business Platform API**.
- **Constraint:** Costs per message and strict template rules (cannot spam marketing, only transactional "Your burger is ready").
- **Feasibility:** High, but requires business verification.

### Bot Detection
- **Implementation:** **Cloudflare Turnstile**.
- **Placement:** Login, Sign-up, and Payment endpoints.
- **Why:** Invisible to humans, blocks scrapers/bots.

---

## 5. Hosting & Scalability ("Tons of Users")
- **Frontend**: Vercel/Netlify for global Edge Network (CDN).
- **Backend**:
  - **Serverless**: Good for variable traffic, but watch out for "Cold Starts".
  - **Edge Functions**: For ultra-low latency API calls (e.g., getting menu data).
- **Database**: Connection pooling (PgBouncer) is mandatory to handle thousands of concurrent connections.

## 6. Potential Challenges & Risks
1.  **Network Connectivity**: Festivals are notorious for bad signal.
    *   *Mitigation*: Optimistic UI (app feels fast even if API lags), extensive retry logic.
2.  **Concurrency**: 5,000 people ordering at 1 PM.
    *   *Mitigation*: Message Queues (Redis/BullMQ) to process orders sequentially instead of locking the DB.
3.  **WhatsApp Cost**: If 10k orders = 10k messages, cost accumulates. Push notifications (PWA) are free alternatives.

## Conclusion
The proposed system is **highly feasible** with modern Jamstack technologies. The "Secret Sauce" will be the **Real-time implementation** (keeping everyone in sync without refreshing) and **Network resilience**.
