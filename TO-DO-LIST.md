# Skiip — The Launch Checklist 🏁

---

## ✅ PHASE 0: COMPLETED (The Engine is Running)
- [x] **Stripe Sandbox Setup**: Verified payments, onboarding, and webhook routing.
- [x] **Dashboard Workflow**: Intelligent Logic (Pending vs. Paid) is live.
- [x] **Public Storefronts**: Customers can browse Vercel site and pay in £ GBP.

---

## 🔥 PHASE 1: DO THIS NOW (Critical for MVP Launch)
*These must be finished before any "Real" customers use the site.*

### 📢 Communication
- [ ] **WhatsApp Alerts**: Real-time notifications for vendors when a "PAID" order arrives. Must also notify customers when the Order is ready for pickup
- [ ] **Basic Email Receipts**: Send a simple "Order Confirmed" to the customer.

### 🛡️ Security & Reliability
- [ ] **Frontend Security Sweep**: Remove all `SERVICE_ROLE` keys from the client-side code (High Priority).
- [ ] **Inventory Locking**: Ensure the `decrement_inventory` function is 100% robust against "Double Buys."
- [ ] **Order Auto-Cancel**: Logic to kill `PENDING` orders after 60 mins to free up stalled stock.

### 📈 Core Ops
- [ ] **Essential Analytics**: A single "Today's Volume" counter on the Vendor dashboard.
- [ ] **Logging**: Basic error trapping for payment failures so we can debug live issues.

---

## 🚀 PHASE 2: POST-LAUNCH (Scale & Polish)
*Add these once the first orders start flowing and the system is stable.*

### 💎 User Experience
- [ ] **Real-time Push**: Smooth "Pop" animations for new orders (no refresh needed).
- [ ] **Loading Skeletons**: Professional "flicker-free" transitions between pages.
- [ ] **Customer Profile**: Let users look up their previous Order history.

### 🛠️ Advanced Vendor Tools
- [ ] **Refund Interface**: Allow one-click Stripe refunds from the dashboard.
- [ ] **Detailed Analytics**: Charts for revenue trends, peak times, and top-selling items.
- [ ] **Admin Command Center**: A master dashboard for you to oversee all vendors.

### 🌟 Community & Trust
- [ ] **Store Reviews**: Let customers leave 5-star ratings after they pick up their order.
- [ ] **Partner Portal**: Professional onboarding/application page for new vendors.

---

> [!IMPORTANT]
> **Going Live Checklist**:
> 1. Swap `sk_test` and `pk_test` for **Live Keys**.
> 2. Re-create the **Webhook Endpoint** in Stripe Live Mode.
> 3. Run a real £1.00 payment to verify the entire loop.
