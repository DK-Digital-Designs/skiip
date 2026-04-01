# Skiip — Known Issues & To-Do List

---

## ✅ Resolved

- **`ReferenceError: StripeService is not defined`** in `Dashboard.jsx` — Fixed by adding missing import.
- **Product image uploads failing** — Created `product-images` Supabase Storage bucket via script.
- **No way to leave vendor portal without logging out** — Resolved by the GlobalHeader.
- **Vendor portal & admin login exposed on the public landing page** — Removed; unified login handles routing.

---

## 🐛 Known Bug: Supabase Navigator Lock Timeout

**Symptom:**
```
NavigatorLockAcquireTimeoutError: Acquiring an exclusive Navigator LockManager lock
"lock:sb-jmqjuvfjthwbsbelgccs-auth-token" timed out waiting 10000ms
```
This manifests as:
- Vendors list shows "No vendors available" on first page load
- GlobalHeader shows "Sign In / Sign Up" even when the user is authenticated
- Requires hard refresh (`Ctrl+Shift+R`) to fix

**Root Cause:**  
`supabase-js v2` uses the browser's `navigator.locks` API to serialize auth token operations.  
The old `AuthContext` was calling `AuthService.getSession()` manually **at the same time** that `supabase.auth.onAuthStateChange` was internally requesting the same lock to broadcast its `INITIAL_SESSION` event.  
These two concurrent lock requests deadlocked each other.

**Fix Applied:**  
Removed the manual `initSession()` call from `AuthContext.jsx`.  
The context now relies purely on `onAuthStateChange`, which already fires an `INITIAL_SESSION` event on startup — no separate fetch is needed.

**Status:** Fixed in `AuthContext.jsx`. Monitor for recurrence.

---

## 🔧 In Progress / Remaining

- [ ] Test Stripe onboarding end-to-end (requires Stripe Secret Key set in Supabase Edge Function secrets)
- [ ] Vendors sometimes still don't load on first visit — investigate `useStores` React Query caching + staleTime
- [ ] Loading skeletons for vendor list (slow perceived performance)
- [ ] Remove `VITE_SUPABASE_SERVICE_ROLE_KEY` from `.env` — it should never be in a frontend bundle

---

## 💡 Feature Ideas / Future Polish

- Add a "Become a Vendor" CTA on the landing page that routes to the vendor signup/apply form
- Add email confirmations to the vendor signup flow
- Allow admins to toggle vendor `is_active` status from the admin dashboard
- Add a "Forgot Password" link on the unified login page