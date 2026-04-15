# Documentation Index

This directory is the source of truth for SKIIP project documentation.

If a statement in an old note, thread, or handover file conflicts with these documents, trust the documents in this folder.

## Start Here

- [Architecture](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/ARCHITECTURE.md)
  Explains the repo structure, runtime architecture, data model, auth model, and integration boundaries.
- [Current State](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/CURRENT_STATE.md)
  Describes what is implemented now, what is working, and what is intentionally deferred.
- [Deployment](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/DEPLOYMENT.md)
  Covers environments, secrets, migrations, edge-function deploys, webhooks, and release verification.
- [Operations](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/OPERATIONS.md)
  Covers launch rehearsal, order lifecycle, refunds, incident handling, and troubleshooting.
- [Testing Data](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/TESTING_DATA.md)
  Lists the shared test accounts and login details currently used for local and pilot verification.
- [Roadmap](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/ROADMAP.md)
  Lists the next engineering priorities after the current stable baseline.

## Current Project Shape

SKIIP currently consists of:
- a React 19 + Vite application in [`app`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app)
- a Supabase backend in [`supabase`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase)
- a separate static marketing site in [`site`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/site)

The current product scope is a closed-pilot ordering system for a single live-event model with buyer, vendor, and admin roles.
