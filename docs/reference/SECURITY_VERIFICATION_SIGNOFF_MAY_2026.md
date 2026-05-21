# Security Verification Signoff - May 21, 2026

## Summary

This report implements the SKIIP security verification plan using repository review, local quality/security commands, and available environment checks.

Result: **not ready for unconditional security signoff**.

The product app and primary Supabase Edge Function boundaries are mostly well-structured: protected browser functions use `requireUser()`, sensitive payment/order mutations are server-authoritative, Stripe and Resend webhooks verify signatures, product image uploads have type/size/path controls, and local tests pass.

One concrete issue blocks full signoff:

- `whatsapp-notify` remains configured as a deployed, `verify_jwt = false` Edge Function and does not require user auth, a bearer secret, or a provider signature before creating a service-role client and queueing WhatsApp notifications for a supplied order id.

Several controls also remain **Partial** because staging/provider evidence was unavailable in this shell: no `PLAYWRIGHT_*` staging credentials are set, GitHub CLI auth is invalid, no staging database connection string is available for direct RLS probes, and hosted Vercel/Supabase/Stripe/Resend/Twilio dashboards were not accessible from this run.

## Commands Run

| Command | Result | Evidence |
| --- | --- | --- |
| `npm run lint` | Pass | ESLint completed successfully. |
| `npm run test` | Pass | 13 test files, 71 tests passed. Initial sandbox run hit `spawn EPERM`; escalated rerun passed. |
| `npm run build` | Pass | Vite built 481 modules. Initial sandbox run hit `spawn EPERM`; escalated rerun passed. |
| `deno test --allow-env --allow-read=supabase/functions supabase/functions/tests/*.ts` | Pass | 18 Edge Function tests passed. Initial sandbox run hit a Windows Deno pipe panic; escalated rerun passed. |
| `npm audit --audit-level=moderate` | Pass | 0 vulnerabilities found. |
| `npm outdated` | Partial | Registry check succeeded after escalation; multiple dependencies have newer versions. |
| `npm run test:e2e` | Partial | Local public smoke passed 3 tests; authenticated buyer/seller/admin smoke skipped because staging credentials are missing. |
| `gh auth status` | Fail | GitHub token in keyring is invalid, so workflow/security-alert status could not be verified. |
| `npx supabase --version` | Pass | Supabase CLI package version is `2.98.2`; global `supabase` command is not installed. |

## Control Matrix

| Control | Surface | Evidence | Result | Risk | Required Fix | Owner/Next Action |
| --- | --- | --- | --- | --- | --- | --- |
| Every endpoint checks authentication. | Supabase Edge Functions | Configured functions were inventoried from `supabase/config.toml`. Protected functions use `requireUser()` via `supabase/functions/_shared/auth.ts`. Webhook/dispatch functions use signature/secret patterns except `whatsapp-notify`. | **Fail** | P1 | Remove `whatsapp-notify` from deployment or require a strong bearer secret/signature before service-role work. | Backend |
| Every endpoint checks authorization for the specific object. | Orders, stores, Stripe, notifications | `stripe-checkout`, `order-transition`, `stripe-refund`, `stripe-reconcile-order`, onboarding/status functions load target objects and check owner/admin role. `whatsapp-notify` accepts caller-supplied `orderId` without caller authorization. | **Fail** | P1 | Close `whatsapp-notify`; add staging negative tests for cross-user order/store IDs. | Backend |
| Admin/vendor/customer roles are enforced server-side. | Edge Functions and RLS | `requireUser()` reads `user_profiles.role`; admin functions check `user.role === 'admin'`; seller store operations check ownership; RLS matrix and migrations support role boundaries. | **Partial** | P1 | Run direct staging RLS probes for buyer/seller/admin/service-role. | Backend/Ops |
| User input is validated server-side. | Edge Functions and direct browser writes | `order-create` validates item UUIDs/quantities, stock, totals, phone opt-in, scheduled collection; Stripe return URLs are origin-allowlisted; profile/image fields are constrained. `whatsapp-notify` accepts loosely shaped JSON. | **Partial** | P1 | Remove/protect `whatsapp-notify`; add malformed JSON/body tests for protected functions. | Backend |
| SQL queries are parameterized. | Supabase JS, RPC, migrations | Runtime code uses Supabase query builders and RPC parameters; no runtime raw SQL string concatenation found. Security-definer RPCs use parameters and fixed `search_path`. | **Pass** | Low | Keep reviewing new migrations for dynamic SQL. | Backend |
| Request bodies are allowlisted. | Edge Functions | Sensitive functions write explicit fields. `vendor-store-profile` and admin/store functions map explicit body fields. `whatsapp-notify` accepts arbitrary payload shape and derives `eventType/orderId`. | **Partial** | P1 | Protect/retire `whatsapp-notify`; add schema-style body parsing for all public functions. | Backend |
| Dangerous HTML is sanitized or not rendered. | React app | `rg` found no `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `DOMParser`, or `srcdoc` sinks in `app/src` or functions. | **Pass** | Low | Keep the no-HTML-sink rule in PR review. | Frontend |
| Rate limits exist on auth, checkout, upload, AI, and notification endpoints. | Supabase Auth, checkout, storage, notifications | Supabase Auth rate limits exist in `supabase/config.toml`; WhatsApp has daily/per-dispatch caps. No explicit app-level rate limiting was found for `order-create`, `stripe-checkout`, product image upload, or webhooks. No AI endpoints exist. | **Partial** | P1 | Add edge/WAF/application limits for checkout/order creation/upload/dispatch; document AI as not applicable. | Backend/Ops |
| Payment state comes from verified webhooks, not frontend redirects. | Stripe Checkout and orders | `stripe-checkout` only creates sessions and stores IDs; `stripe-webhook` verifies Stripe signature and marks payment success/failure; checkout return handling is UI only. | **Pass** | Low | Rehearse in Stripe test mode before launch. | Backend/Ops |
| Webhooks verify signatures and are idempotent. | Stripe, Resend, Twilio status | Stripe verifies `stripe-signature` and claims events through `claim_stripe_webhook_event`; Resend verifies Svix and stores unique deliveries; Twilio status stores unique `provider, delivery_id`, but auth is optional if `TWILIO_WEBHOOK_TOKEN` is unset. | **Partial** | P1 | Make Twilio webhook token fail-closed when unset; verify hosted secrets. | Backend/Ops |
| Secrets are not exposed in frontend bundles. | App source/build/env examples | `rg` found service-role and provider secrets only in docs/examples/scripts/functions, not `app/src` or built frontend. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optional public DSN are used by runtime app code. | **Pass** | Low | Retire legacy `VITE_SUPABASE_SERVICE_ROLE_KEY` support in local scripts when convenient. | Backend/Ops |
| CORS is restricted in production. | Edge Functions and Vercel | Browser-facing functions use `isAllowedOrigin()` and `buildCorsHeaders()`. Hosted `ALLOWED_ORIGINS` values could not be verified. Provider webhooks intentionally use permissive CORS because browser CORS is not the webhook control. | **Partial** | P1 | Confirm hosted `ALLOWED_ORIGINS` is explicit and excludes unapproved preview/local origins in production. | Ops |
| File uploads have type, size, path, and access controls. | Product images | Frontend enforces PNG/JPEG/WebP and 5 MiB; Supabase config sets bucket MIME and 5 MiB; storage policies constrain path to `products/<store_id>/...` and owner/admin access. Hosted bucket was not directly probed. | **Partial** | P1 | Run staging storage negative tests for wrong MIME, oversize, and cross-store path. | Backend/Ops |
| RLS/database policies are tested directly. | Public tables and storage | Migrations show RLS for critical tables and service-role-only policies for sensitive logs/events. Existing SQL tests cover webhook/inventory/order RPC behavior, not the full role matrix. No staging DB credentials were available for direct probes. | **Fail** | P1 | Add/run direct RLS probe SQL for buyer, seller, admin, service-role, and storage. | Backend/Ops |
| Sensitive actions are audit logged. | Orders, payments, refunds, admin store ops | Order creation, payment capture/failure, status transitions, refunds, reconciliation, and admin vendor/store operations write audit logs. Product CRUD/profile edits are not audit logged and may be acceptable only for closed pilot. | **Partial** | P2 | Decide whether vendor product/profile edits require audit logs before broader launch. | Product/Backend |
| Error messages do not leak internals. | Edge Functions and frontend mapping | Frontend has safe function-error mapping tests. Several Edge Functions still return raw `error.message` from database/provider failures, and `stripe-webhook` returns processing error text in the HTTP body. | **Partial** | P2 | Standardize external error bodies to stable codes; keep details in logs/Sentry. | Backend |
| Dependencies are reviewed and updated. | npm package set | `npm audit` reports 0 vulnerabilities. `npm outdated` shows multiple packages behind wanted/latest versions, including Sentry, Supabase JS, Stripe JS, React Router, Vitest, Playwright, and Vite major latest. | **Partial** | P2 | Do a controlled dependency update branch with tests and changelog review. | Engineering |
| Staging cannot affect production users, payments, or messages. | Vercel, Supabase, Stripe, Resend, Twilio | Repo docs require staging/prod separation and test-mode Stripe for staging. Live environment variables, hosted webhook endpoints, and provider accounts were not accessible from this run. | **Partial** | P1 | Verify Vercel vars, Supabase secrets, Stripe dashboard mode/webhooks, Resend/Twilio sender/callbacks. | Ops |
| Notification sends have caps, opt-in checks, and duplicate prevention. | Notification outbox and WhatsApp guard | WhatsApp guard enforces enabled event scope, opt-in, valid recipient, disabled/allowlist/live mode, daily cap, per-dispatch cap, and duplicate provider-attempt blocking. Email duplicate/cap behavior is less strict; `whatsapp-notify` can queue unauthenticated rows. | **Partial** | P1 | Remove/protect `whatsapp-notify`; add source-event idempotency for queued email/notification rows if duplicate sends matter. | Backend |
| AI outputs are reviewed before becoming trusted records. | Product app | No AI endpoints, model calls, vector workflows, or AI trusted-record paths were found. | **Not applicable** | None | Revisit if AI features are added. | Product |

## Finding: Unauthenticated Legacy WhatsApp Notification Function

Severity: **P1 / medium operational-security risk**.

Affected code:

- `supabase/config.toml` configures `whatsapp-notify` with `verify_jwt = false`.
- `supabase/functions/whatsapp-notify/index.ts` accepts `POST`, creates a service-role client, reads attacker-supplied `eventType` or trigger-shaped `record.status`, reads attacker-supplied `orderId` or `record.id`, and calls `sendTransactionalNotifications()`.

Attack path:

1. External caller sends `POST /functions/v1/whatsapp-notify` with a guessed or known order UUID and supported event type/status.
2. Function does not check a bearer token, user session, Supabase trigger secret, provider signature, or allowed origin.
3. Function uses service role and queues a WhatsApp notification for that order.
4. Downstream WhatsApp guard limits impact through event eligibility, opt-in, allowlist/live mode, caps, and duplicate provider-attempt checks, but those controls happen after the unauthenticated queue request and do not establish caller authorization.

Counterevidence and constraints:

- The old database trigger that called this function is removed in later migrations.
- Docs classify the function as legacy compatibility code.
- WhatsApp dispatch is guarded by opt-in, allowlist/live-mode controls, daily/per-dispatch caps, and duplicate provider-attempt blocking.

Why it still survives:

- The function is still configured and deployable.
- CORS is not an authentication control.
- If deployed with WhatsApp enabled, an unauthenticated network caller can create notification work through a service-role path.

Recommended fix:

- Preferred: remove `whatsapp-notify` from `supabase/config.toml` and stop deploying it after confirming no hosted database trigger still calls it.
- Acceptable interim: require a dedicated `WHATSAPP_NOTIFY_SECRET`, fail closed when missing, and verify `Authorization: Bearer <secret>` before creating the service-role client.

## Staging And External Checks Still Needed

These are required before launch signoff:

1. Run authenticated staging Playwright with `PLAYWRIGHT_REQUIRE_AUTH_CREDENTIALS=true` and buyer/seller/admin credentials.
2. Run direct staging RLS probes for buyer, seller, admin, service-role, and storage object paths.
3. Complete a Stripe test-mode payment rehearsal: order create, Checkout, webhook-paid transition, inventory finalization, vendor status changes, refund, reconciliation fields, and audit logs.
4. Verify hosted Supabase secrets: `ALLOWED_ORIGINS`, `STRIPE_*`, `RESEND_*`, `TWILIO_*`, `NOTIFICATION_DISPATCH_SECRET`, and `SKIIP_ENVIRONMENT`.
5. Verify Stripe dashboard webhook endpoint and signing secret match the staging Supabase function URL.
6. Verify Resend and Twilio callback endpoints and secrets/tokens in staging.
7. Restore GitHub CLI auth or inspect GitHub Actions/Dependabot/security alerts in the GitHub UI.

## Ranked Follow-Ups

| Priority | Follow-up | Acceptance Criteria |
| --- | --- | --- |
| P1 | Retire or protect `whatsapp-notify`. | Function is no longer deployed, or unauthenticated requests fail before service-role client creation. |
| P1 | Make Twilio status webhook fail closed when `TWILIO_WEBHOOK_TOKEN` is unset in hosted environments. | Missing token returns 503/401; valid token updates delivery state; invalid token is rejected. |
| P1 | Add direct RLS/storage verification. | Buyer/seller/admin/service-role probes are committed or runbooked, and staging evidence is attached to signoff. |
| P1 | Add rate limiting for checkout/order/upload/dispatch. | Auth, order creation, checkout, upload, notification dispatch, and provider webhooks have documented edge/platform limits. |
| P1 | Complete staging provider/payment rehearsal. | Test-mode Stripe order and notification rehearsal pass with audit/log evidence. |
| P2 | Sanitize Edge Function error responses. | External responses use stable error codes/messages; internal details remain in logs/Sentry. |
| P2 | Run dependency update branch. | `npm outdated` is reviewed, safe updates applied, and lint/test/build/e2e pass. |
| P2 | Decide `vendor-store-profile` deployment state. | Function is either added to `supabase/config.toml` if used by the app, or the UI route/call is retired. |

