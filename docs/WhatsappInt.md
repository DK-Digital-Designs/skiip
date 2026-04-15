# WhatsApp Business Integration Plan 📱

This document outlines the architecture and implementation steps for integrating **WhatsApp Order Notifications** into the SKIIP platform using the Meta WhatsApp Business Platform (via Twilio/Supabase).

## 1. Architecture Overview
The integration follows an event-driven pattern:
1.  **React Frontend**: Collects explicit WhatsApp opt-in and phone number at Checkout.
2.  **Stripe Webhook**: Confirms payment success and updates the order status to `paid`.
3.  **Supabase Trigger**: Detects the status change (e.g., `paid` or `ready`) and invokes the `whatsapp-notify` Edge Function.
4.  **Edge Function**: Fetches order details, selects the appropriate **Meta Utility Template**, and sends the message via the WhatsApp Business API.
5.  **Twilio Webhook**: Receives delivery status (Sent, Delivered, Read) and updates the `notification_logs` table.

---

## 2. Implementation Steps

### A. Database Layer (Supabase)
- **Modify `orders` table**: Add `whatsapp_opt_in` (boolean) to track customer consent.
- **New Table `notification_logs`**: 
    - `id` (uuid)
    - `order_id` (uuid)
    - `message_sid` (text) - Unique ID from the provider.
    - `status` (text) - queued, sent, delivered, read, failed.
    - `error_message` (text)
- **Status Change Trigger**: Create a PostgreSQL trigger on `public.orders` that calls the `whatsapp-notify` Edge Function whenever `status` is updated.

### B. Frontend Layer (React)
- **Checkout Page**: Add a mandatory "WhatsApp Updates" section.
    - Checkbox for "Opt-in to receiving order updates via WhatsApp."
    - Help text: "Purely transactional. No marketing. standard rates apply."
- **Order Tracker Page**: Add a badge indicating if WhatsApp notifications are active for the order.

### C. Backend Layer (Edge Functions)
- **`whatsapp-notify` Function**:
    - Update logic to use **Template Messages** (e.g., `order_confirmed`, `order_ready`).
    - Fetch store name and order total to inject into the template placeholders.
    - Save initial "queued" status into `notification_logs`.
- **`whatsapp-status-webhook` Function**:
    - New function to receive POST requests from the messaging provider (Twilio/Meta).
    - Update the `notification_logs` table with delivery confirmations.

---

## 3. Order Event Flow

| Order Event | Trigger | WhatsApp Template |
| :--- | :--- | :--- |
| **Payment Success** | Stripe Webhook -> Order Status `paid` | `order_confirmation` |
| **Kitchen/Bar Prep** | Vendor Dashboard -> Order Status `preparing` | (Optional) `order_preparing` |
| **Ready for Pickup** | Vendor Dashboard -> Order Status `ready` | `ready_for_collection` |
| **Cancellation** | Admin/Vendor -> Order Status `cancelled` | `order_cancelled` |

---

## 4. Compliance & High-Priority Requirements

> [!IMPORTANT]
> **Explicit Opt-in**: Meta requires businesses to obtain clear opt-in before sending messages. The checkout checkbox must not be pre-selected.

> [!WARNING]
> **Template Approval**: Meta Utility Templates (e.g., `order_ready_for_collection`) must be pre-approved in the Meta Business Manager before they can be used in the code.

> [!TIP]
> **Delivery Resilience**: By logging all notifications in `notification_logs`, we can build a dashboard for vendors to see if a customer actually received the "Ready" alert, reducing "Where is my order?" inquiries.
