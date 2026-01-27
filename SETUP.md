# Skiip MVP - Setup Guide

## 1. Prerequisites
- Node.js 18+ installed
- Supabase account
- Stripe account (for payments - Phase 2)

## 2. Supabase Setup

### Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Note down your **Project URL** and **Anon Key** from Settings → API

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
VITE_STRIPE_PUBLIC_KEY=pk_test_... (optional for MVP)
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
5. Enter phone number (e.g., +27 12 345 6789)
6. Click "Pay" - this will simulate payment
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

## 7. Next Steps (Post-MVP)

- [ ] Integrate real Stripe payments
- [ ] Set up WhatsApp notifications via Twilio
- [ ] Add vendor menu management UI
- [ ] Implement admin vendor/event CRUD
- [ ] Add analytics dashboards
- [ ] Setup production environment variables

## Troubleshooting

**Orders not updating in realtime?**
- Check that Realtime is enabled for the `orders` table
- Verify WebSocket connection in browser DevTools

**Can't login as vendor?**
- Ensure the email in Supabase Auth matches the email in the `vendors` table

**Database connection errors?**
- Verify your `.env` file has the correct Supabase URL and Anon Key
- Check that RLS policies are properly configured
