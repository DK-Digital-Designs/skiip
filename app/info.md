# 🚀 SKIIP: UK Pilot Readiness & Critical Actions

**Pilot Date**: April 11, 2026 (England)
**Objective**: Transition from functional MVP to high-concurrency production system for remote coordination.

---

## ⚡ Critical Decisions Needed (Blocked)

### 🌍 1. Domain & Branding

- **Options**: `skiip.co.uk` (Recommended for UK trust) vs `skiip.com` (Global).
- **Action**: Choose, register, and link to **Vercel/London (LHR)** hosting.

### 💰 2. Infrastructure Pricing Strategy

- **Database (Supabase)**:
  - **Free Tier**: 500MB storage, 50k monthly active users. (Risk: Limited concurrency).
  - **Pro Tier ($25/mo)**: Required for the pilot to ensure **London region deployment** and higher connection limits.
- **WhatsApp (Twilio)**:
  - **Plan**: Use Twilio WhatsApp templates for paid, preparing, ready, cancelled, and refunded order updates.
  - **Action**: Finalize the sender and template SIDs, then run end-to-end delivery verification before pilot day.

### ⚖️ 3. Legal & Compliance

- **GDPR**: Basic Privacy Policy and data usage consent for UK attendees.
- **Terms**: Vendor vs. Attendee terms of service.

---

## �️ Immediate Technical Next Steps

### **Phase 3: Operational Failsafes (Starting Soon)**

1.  **[ ] Dynamic QR Toolkit**:
    - Create a dashboard tool to generate high-res QR codes for each vendor stall.
    - Must support "Table/Stall Number" parameters for targeted delivery later.
2.  **[ ] The "Big Red Button" (Emergency Controls)**:
    - **Global Pause**: Ability for admins to stop all incoming orders if the event infrastructure (WiFi/Kitchen) fails.
    - **Vendor Override**: Admins can toggle a vendor's "Open/Closed" status remotely.
3.  **[ ] Load Testing (50+ RPS)**:
    - Run a simulation to ensure the order creation RPC and stock decrement logic don't lock up under high volume.
4.  **[ ] Production Stripe Handover**:
    - Connect the production UK Stripe business account.
    - Verify 3D Secure 2 (3DS2) flow for UK cards.

---

## 📍 Current Tech Health

- ✅ **Comms**: Twilio WhatsApp and Resend notification engine wired server-side.
- ✅ **Inventory**: Atomic stock decrementing live.
- ✅ **Monitoring**: Sentry error tracking configured.
- ✅ **Admin**: Real-time "Live Health" dashboard active.

_Last updated: Feb 26, 2026_
