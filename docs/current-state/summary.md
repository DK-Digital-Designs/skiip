# Summary

Read this when you need the summary details from [Current State](../CURRENT_STATE.md).

SKIIP is currently in a workable closed-pilot state for the core buyer -> payment -> vendor -> admin loop.

The production-critical path that exists in code today is:

- buyer signs in
- buyer creates an order through a server-authoritative edge function
- buyer is redirected to Stripe Checkout
- Stripe webhook marks the order as paid and finalizes inventory
- vendor sees the paid order and moves it through the active lifecycle
- admin can view operational metrics and issue refunds
