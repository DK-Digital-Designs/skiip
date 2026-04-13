# Skiip — To-Do & Bug Tracker

## 🐛 Glitches, Bugs & Inconsistencies
*Use this section to track and resolve bugs as they are found.*
- [ ] Blank screen error (Needs investigation / tracking)
- [ ] Double buys (Inventory locking issues edge cases)
- [ ] Real-time push logic on vendor dashboard dropping sometimes

## 🚀 Priority: Local Testing & Purchase Flow Validation
- [ ] Prove Stripe webhook updates Order to "PAID" successfully without errors
- [ ] Implement Purchase Success Screen for users returning from Stripe checkout
- [ ] Ensure Vendor Dashboard sees the new order and updates to Paid status automatically

## 📋 Direct To-Do List
- [ ] **WhatsApp Alerts**: Real-time notifications for vendors for "PAID" orders. Notify customers when their order is ready for pickup.
- [ ] **Basic Email Receipts**: Send "Order Confirmed" receipt to the customer.
- [ ] **Frontend Security Sweep**: Remove all `SERVICE_ROLE` keys from the client-side code (High Priority).
- [ ] **Inventory Locking**: Ensure the `decrement_inventory` function is 100% robust.
- [ ] **Order Auto-Cancel**: Logic to kill PENDING orders after 60 mins to free up stock.
- [ ] **Essential Analytics**: Add "Today's Volume" counter on Vendor dashboard.
- [ ] **Error Logging**: Basic logging for payment failures locally and live.
- [ ] **Real-time Push**: Smooth "Pop" animations for new orders (no refresh needed).
- [ ] **Loading Skeletons**: Professional "flicker-free" transitions between pages.
- [ ] **Customer Profile**: Let users look up their previous Order history.
- [ ] **Refund Interface**: Allow one-click Stripe refunds from dashboard.
- [ ] **Detailed Analytics**: Charts for revenue trends, peak times, and top-selling items.
- [ ] **Admin Command Center**: A master dashboard to oversee all vendors.
- [ ] **Store Reviews**: Let customers leave 5-star ratings after pickup.
- [ ] **Partner Portal**: Onboarding/application page for new vendors.

## 🏁 Live Deployment Checklist (When ready)
- [ ] Swap `sk_test` and `pk_test` for Live Keys.
- [ ] Re-create the Webhook Endpoint in Stripe Live Mode.
- [ ] Run a real £1.00 payment to verify loop.
