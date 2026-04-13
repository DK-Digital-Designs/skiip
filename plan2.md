Using skill: supabase-postgres-best-practices (because this request is directly about DB/security/stability posture in a Supabase/Postgres app).

Security + Stability Analysis
1) Highest-risk security findings
Guest cart/order RLS is overly permissive: multiple policies allow access when session_id IS NOT NULL, which means any row with a non-null session id can potentially be read/modified by unrelated clients unless further constrained elsewhere. This is explicitly noted in-comment as a simplification and is a priority fix. 

Guest order visibility policy is weakly scoped: auth.uid() IS NULL AND customer_email IS NOT NULL effectively grants broad anonymous read eligibility for guest orders and even includes a comment that it “ideally needs more security.” 

Edge functions have open CORS (*) and no explicit caller authorization checks on sensitive flows (checkout, onboarding, WhatsApp notify). They use service-role keys server-side (good for privileged ops), but they should still enforce caller identity and ownership checks at function boundary to prevent abuse. 

Demo credentials are committed in README; even if test-only, this tends to leak into shared environments and encourages weak credential hygiene. 

2) Stability/reliability risks
Non-idempotent webhook side-effects: webhook processes payment completion and decrements inventory in-loop; duplicate event delivery risks repeated effects unless constrained by idempotency ledger/guards. 

Inventory decrement function is simple and non-guarded against race semantics beyond GREATEST; it prevents negatives but doesn’t enforce reservation or version checks for high-concurrency bursts. 

Auth hardening is light in local config (minimum_password_length = 6, empty password_requirements, email confirmations off, secure password change off). Production settings should be stricter. 

Connection pooler disabled in local config and architecture docs already call out pooling as mandatory for scale; production should explicitly validate this. 

Proposed Plan to Increase Security + Stability
Phase 0 (Immediate, 1–2 days): Block obvious abuse paths
Fix guest RLS policies

Replace session_id IS NOT NULL checks with a signed guest token/session binding model (e.g., HMAC token stored server-side; policies compare against verified claim via RPC/security definer helper).

Tighten guest order read policy to require a verifiable secret (one-time order access token), not just customer_email IS NOT NULL. 

Lock down Edge function access

Restrict CORS to known origins.

Require and verify bearer JWT on all externally invokable functions; enforce ownership (order_id belongs to caller, store_id belongs to vendor/admin).

Add rate-limits per IP/user key at gateway level. 

Remove hardcoded/demo credentials from repo docs

Replace with “seed script + local-only .env guidance”. 

Phase 1 (Short term, 3–7 days): Make payments + inventory robust
Webhook idempotency

Store processed Stripe event.id in a dedicated table with unique index.

Skip if already processed; wrap updates in transaction.

Record processing status + retry metadata for observability. 

Inventory consistency controls

Move decrement to conditional update (WHERE inventory_quantity >= qty) and fail order if insufficient.

Optionally introduce reservation window for checkout start vs payment completion.

Add alerting for oversell attempts. 

Harden create_order_v1 input validation

Validate item IDs exist and are active for target store.

Recalculate totals server-side from product prices (don’t trust client item price).

Constrain function EXECUTE privileges to intended roles only. 

Phase 2 (1–2 weeks): Platform hardening + operational resilience
Auth security baseline uplift

Increase minimum password rules; require stronger complexity.

Enable email confirmation and secure password change flows for production.

Add CAPTCHA/Turnstile on signup/login/reset paths. 

Operational guardrails

Enable/verify connection pooling in production deployment.

Add DB-level monitoring: slow query tracking, deadlock alerts, webhook failure dashboards.

Define SLOs (checkout success, webhook latency, order state convergence). 

Security regression checks

Add SQL policy tests (anon/authenticated/vendor/admin matrix).

Add function contract tests for unauthorized calls, malformed payloads, replayed events.

Suggested Success Metrics
Security: zero unauthorized cross-user/cart/order reads in policy test suite; zero edge-function calls without valid auth.

Stability: duplicate Stripe events produce zero duplicate inventory/order side-effects; checkout p95 latency and failure rate tracked and within SLO.

Operations: webhook retry/error dashboard with alerting; monthly RLS audit checklist completed.

Commands I used for this analysis
✅ rg --files | head -n 200

✅ cat /workspace/skiip/.agents/skills/supabase-postgres-best-practices/SKILL.md

✅ sed -n '1,220p' README.md

✅ sed -n '1,220p' supabase/config.toml

✅ sed -n '1,320p' supabase/functions/*/index.ts (run as targeted per file)

✅ sed -n '1,620p' supabase/migrations/*.sql (run as targeted per file ranges)

✅ nl -ba <file> | sed -n '<range>' for citation line mapping

✅ git status --short (confirmed no code changes made)

If you want, next I can turn this into a concrete execution backlog (tickets with priority, owner, estimated effort, and acceptance criteria).