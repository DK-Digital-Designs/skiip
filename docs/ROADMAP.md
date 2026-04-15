# Roadmap

## Immediate Priorities

### 1. Commit and protect the current baseline
- commit the two reconciliation migrations
- keep deployment flow documented and repeatable
- avoid manual production fixes without a follow-up migration

### 2. Documentation completion
- keep `docs/` as the only source of truth
- update docs when deployment or schema behavior changes

### 3. Auth posture review
- decide whether to keep manual edge-function auth long term
- if re-enabling `verify_jwt`, test it end to end in staging first

## Near-Term Product Work

- Google SSO
- Apple SSO
- final WhatsApp provider decision
- marketing site cleanup and link hygiene
- better staging/production parity

## Near-Term Engineering Work

- broader automated test coverage
- end-to-end smoke tests against deployed environments
- cleaner component boundaries in large page files
- reduction of inline-style-heavy UI surfaces

## Pilot-Readiness Follow-Ups

- staging database branches and backups once Supabase Pro is enabled
- clearer rollback and recovery procedures
- live-mode Stripe cutover checklist
- vendor onboarding checklist for real operators

## Deferred

These are intentionally not treated as current-scope requirements:
- full multi-event tenancy
- customer order history across venues
- advanced analytics beyond current admin metrics
- large-scale concurrency/load test tooling
