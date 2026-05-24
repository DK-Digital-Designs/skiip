# Legacy Accounts

Read this when you need the legacy accounts details from [Testing Data](../TESTING_DATA.md).

Legacy credentials still appear in older reset/schema files and may still exist in some environments, but they are no longer the preferred baseline.

| Role | Email | Password |
| :--- | :--- | :--- |
| Super Admin | `admin@example.com` | `password123` |
| Vendor (Burger Bliss) | `vendor@example.com` | `password123` |
| Standard Buyer | `buyer@example.com` | `password123` |

Use these only when you know the target environment still contains them.

As of 2026-05-04, the legacy seeded stores owned by `vendor@example.com` (`Burger Bliss` and `Pizza Paradise`) have been archived in the shared SKIIP Supabase project. They are preserved for historical order/product references but should not be treated as active smoke or admin archive fixtures.
