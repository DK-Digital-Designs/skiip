# Skiip MVP - Setup Guide

## 1. Prerequisites

- Node.js 18+ installed
- Supabase account
- Stripe account (for payments - Phase 2)

## 2. Supabase Setup

### Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. **Region**: Select **London (eu-west-2)** for minimal latency in the UK.
3. Wait for the project to be provisioned
4. Note down your **Project URL** and **Anon Key** from Settings → API

### Run Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `database/schema.sql`
3. Paste and run the SQL script
4. Verify tables were created in the Table Editor

### Enable Realtime

1. Go to Database → Replication
2. Ensure the `orders` table is enabled for realtime (should be automatic from schema)

## 3. Local Development Setup

### Clone and Install

```bash
cd skiip
npm install
```

### Configure Environment Variables

1. Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

2. Edit `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_SENTRY_DSN=your-sentry-dsn-here
```

### Configure Supabase Secrets (for Edge Functions)

Run these commands in your terminal (requires [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SENTRY_DSN=your-sentry-dsn-here
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set NOTIFICATION_FROM_EMAIL=orders@yourdomain.com
supabase secrets set TWILIO_ACCOUNT_SID=your_sid_here
supabase secrets set TWILIO_AUTH_TOKEN=your_token_here
supabase secrets set TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
supabase secrets set TWILIO_WEBHOOK_TOKEN=your_twilio_webhook_token
supabase secrets set WHATSAPP_DEFAULT_COUNTRY_CODE=44
supabase secrets set TWILIO_TEMPLATE_ORDER_PAID=HX...
supabase secrets set TWILIO_TEMPLATE_ORDER_PREPARING=HX...
supabase secrets set TWILIO_TEMPLATE_ORDER_READY=HX...
supabase secrets set TWILIO_TEMPLATE_ORDER_CANCELLED=HX...
supabase secrets set TWILIO_TEMPLATE_ORDER_REFUNDED=HX...
```

### Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 4. Testing the Application

### Attendee Flow

1. Visit `http://localhost:5173/order`
2. Select a vendor from the list
3. Add items to cart
4. Proceed to checkout
5. Enter phone number (e.g., +44 20 7946 0000)
6. Click "Pay" - this will redirect to Stripe Checkout (or simulate in Demo Mode)
7. You'll be redirected to the order tracker

### Vendor Portal

1. First, create a vendor user in Supabase Authentication:
   - Go to Authentication → Users → Add User
   - Email: `burgerbliss@example.com`
   - Password: `test123` (or your choice)
2. Visit `http://localhost:5173/vendor/login`
3. Login with vendor credentials
4. View incoming orders in realtime
5. Update order status (Preparing → Ready → Collected)

### Admin Dashboard

1. Create an admin user in Supabase Authentication
2. Visit `http://localhost:5173/admin/login`
3. Login and view statistics

## 5. QR Code Integration (For Events)

To link QR codes directly to vendors:

- Generate QR codes pointing to: `https://your-domain.com/order/vendor/{vendor-id}`
- Users scanning the code will go straight to that vendor's menu

## 6. Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## 6. Transactional Notifications (Twilio + Resend)

To enable customer notifications end to end:

1. Create a Resend API key and verify the sender used for `NOTIFICATION_FROM_EMAIL`.
2. Create or approve the Twilio WhatsApp sender you want to use.
3. Set the Twilio and Resend secrets in Supabase (see section 3).
4. Set the `TWILIO_TEMPLATE_*` values to the Twilio Content Template SIDs used for `order_paid`, `order_preparing`, `order_ready`, `order_cancelled`, and `order_refunded`.
5. Delivery status updates post back to:
   - `https://your-project.supabase.co/functions/v1/whatsapp-status-webhook`
6. If `TWILIO_WEBHOOK_TOKEN` is set, the callback URL will include it and the webhook will require it on receipt.
7. Keep the existing `whatsapp-notify` route deployed if your database trigger still calls it; it now acts as a bridge into the shared notification helper rather than being the primary delivery path.

### 7. Product Images (Supabase Storage)

To enable product image uploads:

1. Go to **Storage** in your Supabase Dashboard.
2. Create a new bucket named `product-images`.
3. Set the bucket to **Public**.
4. Add a bucket policy to allow authenticated users to upload files:
   - **Policy Name**: `Allow authenticated uploads`
   - **Allowed Operations**: `INSERT`, `UPDATE`
   - **Target Role**: `authenticated`

## 7. Next Steps (Post-MVP)

- [x] Localize to UK (GBP £)
- [x] Setup Frontend Error Tracking (Sentry)
- [x] Configure Backend Logging (logger.ts)
- [ ] Finalize Stripe Production Account (UK)
- [ ] Verify WhatsApp notifications via Twilio and email notifications via Resend
- [ ] Add vendor menu management UI
- [ ] Support London staging/production deployment

## Troubleshooting

**Orders not updating in realtime?**

- Check that Realtime is enabled for the `orders` table
- Verify WebSocket connection in browser DevTools

**Can't login as vendor?**

- Ensure the email in Supabase Auth matches the email in the `vendors` table

**Database connection errors?**

- Verify your `.env` file has the correct Supabase URL and Anon Key
- Check that RLS policies are properly configured
