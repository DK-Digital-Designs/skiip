# Testing Data

This document tracks the shared test accounts currently used to validate SKIIP flows.

Keep this file current when:
- new seeded accounts are added
- old credentials are retired
- store setup or role assignments change

## Test Accounts

### Legacy Accounts

| Role | Email | Password |
| :--- | :--- | :--- |
| Super Admin | `admin@example.com` | `password123` |
| Vendor (Burger Bliss) | `vendor@example.com` | `password123` |
| Standard Buyer | `buyer@example.com` | `password123` |

### 2026 Test Accounts

| Role | Email | Password | Setup Status |
| :--- | :--- | :--- | :--- |
| Super Admin | `admin2026@example.com` | `password2026` | Confirmed |
| Vendor (Skiip Test Kitchen) | `vendor2026@example.com` | `password2026` | Confirmed, store created |
| Standard Buyer | `buyer2026@example.com` | `password2026` | Confirmed |

## Usage Notes

- Use buyer accounts to test signup/login, ordering, Stripe checkout, and order tracking.
- Use vendor accounts to test product management, paid-order handling, and order-status transitions.
- Use admin accounts to test vendor management, dashboard metrics, and refunds.

## Maintenance Notes

- Do not treat these as production credentials.
- Rotate or remove entries if they become stale.
- If seeded data changes in Supabase, update this file in the same change.
