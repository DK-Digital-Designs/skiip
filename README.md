# Skiip - Festival Ordering Platform MVP

Skip the queue. Order food and drinks from your phone at festivals.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup Supabase**
   - Create a project at [supabase.com](https://supabase.com)
   - Run `database/schema.sql` in SQL Editor
   - Copy `.env.example` to `.env` and add your credentials

3. **Run locally**
   ```bash
   npm run dev
   ```

For detailed setup instructions, see [SETUP.md](SETUP.md).

## 📱 Features

### Attendee App
- Browse vendors and menus
- Add items to cart
- Guest checkout (phone number only)
- Live order tracking with realtime updates

### Vendor Portal
- Login to manage orders
- Realtime order notifications
- One-tap status updates
- Audio alerts for new orders

### Admin Dashboard
- View sales analytics
- Monitor all orders
- Manage events and vendors

## 🛠️ Tech Stack

- **React 18** + Vite
- **Supabase** (PostgreSQL + Realtime + Auth)
- **React Router** for navigation
- **Stripe** (ready for integration)

## 📖 Documentation

- [Setup Guide](SETUP.md) - Complete setup instructions
- [Implementation Plan](C:\Users\deang\.gemini\antigravity\brain\17234a4b-5173-4fbe-9f3a-7ebddb8d27cf\implementation_plan.md) - MVP architecture and approach
- [Walkthrough](C:\Users\deang\.gemini\antigravity\brain\17234a4b-5173-4fbe-9f3a-7ebddb8d27cf\walkthrough.md) - Feature demonstration guide

## 🎯 MVP Status

✅ **Core Features Complete**
- Attendee ordering flow
- Vendor order management
- Admin analytics dashboard
- Database with sample data
- Realtime order updates

🔜 **Phase 2 (Next)**
- Stripe payment integration
- WhatsApp notifications (Twilio)
- Vendor menu management UI

## 📝 License

Private - Skiip Technologies © 2026