# Skiip - Hybrid Setup Guide

## Overview
This project now serves **both** the static marketing website AND the React ordering app from the same repository.

## How It Works

### Marketing Website (Static)
- **Home**: `index.html` - Main landing page with hero, features, and CTAs
- **How It Works**: `how-it-works.html`
- **For Vendors**: `for-vendors.html`
- **For Organisers**: `for-organisers.html`  
- **Pricing**: `pricing.html`
- **Contact**: `contact.html`

All static pages use:
- `assets/css/style.css` for styling
- `assets/js/main.js` for interactions
- Link to the React app via **"App Demo"** or **"Start Ordering"** buttons

### React Ordering App
- **Entry Point**: `app.html` - Mounts the React application
- **Code**: All React code lives in `src/`
- **Routes**: Handled by React Router
  - `/` - App landing page
  - `/order` - Vendor list (attendee flow)
  - `/order/vendor/:id` - Menu page
  - `/order/checkout` - Checkout
  - `/order/track/:id` - Order tracker
  - `/vendor/login` - Vendor portal login
  - `/vendor/dashboard` - Vendor dashboard
  - `/admin/login` - Admin login
  - `/admin/dashboard` - Admin dashboard

## Development

### Running Locally
```bash
npm run dev
```

This starts Vite dev server which serves BOTH:
- Static marketing pages at root URLs
- React app at `/app.html`

Example URLs:
- `http://localhost:5176/` - Marketing homepage
- `http://localhost:5176/app.html` - React app landing
- `http://localhost:5176/app.html#/order` - Start ordering (demo mode)
- `http://localhost:5176/how-it-works.html` - Static page

### Navigation Flow
```
Marketing Site (index.html)
    ↓ "Start Ordering" CTA
React App (app.html#/order)
    ↓ Browse vendors, order, track
    
Marketing Site (any page)
    ↓ "App Demo" button
React App (app.html)
```

## Deployment

### Build for Production
```bash
npm run build
```

This creates a `dist/` folder with:
- All static HTML pages
- Bundled React app (app.html + JS bundles)
- All assets optimized

### Deploy to Vercel/Netlify
Just connect your repo - both platforms will:
1. Detect the Vite project
2. Run `npm run build`
3. Serve the `dist/` folder

### URL Structure in Production
- `your-domain.com/` - Marketing homepage
- `your-domain.com/app.html` - React app
- Or use a **subdomain**: `app.your-domain.com` → points to app.html
- Or use **path rewrite**: `/order` → redirects to `/app.html#/order`

## Environment Variables

Create a `.env` file for the React app:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLIC_KEY=pk_test_...
```

**Note**: Static pages don't use environment variables, only the React app does.

## Why This Structure?

### Benefits
- ✅ **Single repository** - Easy to manage
- ✅ **Shared hosting** - One domain, one deployment
- ✅ **SEO friendly** - Static pages for marketing
- ✅ **Fast app** - React only loads when needed
- ✅ **Easy transitions** - Seamless CTA → app flow

### Alternatives Considered
- **Separate repos**: More complex deployment
- **Full SPA**: Worse SEO for marketing content
- **Server-side rendering**: Overkill for this use case

## Common Tasks

### Add a new marketing page
1. Create `new-page.html` in root
2. Copy structure from existing page
3. Add to `vite.config.js` build inputs
4. Link from other pages

### Update React app
- Edit files in `src/`
- Changes hot-reload automatically
- No need to restart dev server

### Update marketing styling
- Edit `assets/css/style.css`
- Changes apply to all static pages
- React app has its own styles in `src/index.css`

## Troubleshooting

**Marketing pages not styled?**
- Check `assets/css/style.css` exists
- Verify link tag in HTML points to correct path

**React app blank screen?**
- Open browser console for errors
- Check if demo mode warning appears
- Verify `app.html` loads with `#/order` hash

**Links between pages broken?**
- In dev: Use relative paths (`./page.html`)
- In production: Paths are flattened to root
