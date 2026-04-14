# 🛸 Skiip — Project Handover & Roadmap

This document serves as the master "brain" for the project. If you are starting fresh on a new machine or location, follow this guide to pick up exactly where development left off.

---

## 🏗️ Current Tech Stack
- **Frontend**: React (v19) + Vite + Tailwind/Vanilla CSS.
- **Routing**: `HashRouter` (Required for nested paths on some hosts).
- **Backend & DB**: Supabase (PostgreSQL + Edge Functions).
- **Payments**: Stripe Connect (Standard/Express onboarding).
- **Real-time**: Supabase Broadcast/Presence for Vendor Dashboard order "pops."

---

## 📍 Current Status: "The Purchase Loop"
The primary focus is currently finalizing the Stripe -> Customer -> Vendor data loop.

### ✅ Recently Completed
- **Success Overlay**: A full-screen animated "Payment Successful" UI in `OrderTracker.jsx`.
- **Routing Fix**: Updated `Checkout.jsx` to return to `/#/order/track` (fixing the HashRouter landing page bug).
- **Order Tracker**: Functional tracking page with real-time status updates via Supabase.

### ⚠️ CRITICAL: Pending Logic & Config (Run these first!)
The system is currently throwing a `400 Bad Request` on order cancellations/updates because the database lacks local configuration for the WhatsApp trigger.

#### 1. Database Configuration (Required for Webhooks)
The `notify_whatsapp_on_order_status_change` function requires internal Supabase variables to be set in Postgres. Run this in your Supabase SQL Editor:
```sql
ALTER DATABASE postgres SET "app.settings.supabase_url" TO 'https://jmqjuvfjthwbsbelgccs.supabase.co';
-- Replace with your actual service_role key from Supabase Dashboard
ALTER DATABASE postgres SET "app.settings.service_role_key" TO 'YOUR_SERVICE_ROLE_KEY';

-- Add missing UPDATE policy for Sellers
CREATE POLICY "Sellers can update store orders" ON public.orders
FOR UPDATE
USING (
    store_id IN (
        SELECT id
        FROM public.stores
        WHERE user_id = auth.uid()
    )
);
```

#### 2. Environmental Secrets (Supabase CLI)
Ensure these are set in your remote Supabase project:
```bash
npx supabase secrets set STRIPE_SECRET_KEY="sk_test_..."
npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 📋 Direct To-Do List

### 🐛 Bug Tracker
- [ ] **Blank screen error**: Occasional white-out on landing page when logged in.
- [ ] **400 Update Error**: Fix the `pg_net` trigger crashing on order status changes (See SQL fix above).
- [ ] **Double buys**: Strengthen `decrement_inventory` RPC for high-concurrency protection.

### 🚀 Immediate Priorities
1. **Prove Webhook End-to-End**: Ensure `paid` status flips automatically on the dashboard after a real (test) payment.
2. **WhatsApp Alerts**: Finish the `whatsapp-notify` Edge Function logic to message vendors.
3. **Receipt Emails**: Implement basic transactional emails for buyers.

### 💎 Future Additions (Phase 2+)
- **Analytics**: "Today's Volume" counter and revenue charts on the Vendor Dashboard.
- **Inventory Management**: Auto-cancel `PENDING` orders after 60 mins to release stock.
- **Refunds**: One-click refund button for vendors (calls Stripe API).
- **Customer Profiles**: Allow buyers to see history of orders across different vendors.

---

## 🛠️ Dev Setup Reminder
1. `npm install` in `/app`.
2. `npm run dev` to start frontend.
3. Use a tunnel (like `ngrok`) if testing webhooks locally, OR deploy functions:
   `npx supabase functions deploy stripe-webhook --no-verify-jwt`
