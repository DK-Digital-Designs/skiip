# Schema Verification Rule

Read this when you need the schema verification rule details from [Launch Checklist](../LAUNCH_CHECKLIST.md).

Before release:

- compare the intended live schema against committed migrations
- ensure no production-only drift is being relied on
- ensure operators are not following legacy schema snapshot files as if they were authoritative
- if an emergency manual fix was applied, capture it as a migration in the same change window
