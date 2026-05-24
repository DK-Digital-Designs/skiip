# WhatsApp Cost Gate

Read this when you need the whatsapp cost gate details from [Notifications](../NOTIFICATIONS.md).

WhatsApp has one authoritative guard before Twilio can be called.

Guard stages:

1. Eligibility: event must be enabled, event must be `order_ready`, buyer must have opted in, and the recipient phone must normalize to E.164.
2. Mode: `disabled` blocks all sends, `allowlist` permits only configured test numbers, and `live` permits opted-in traffic.
3. Limits: non-production live mode, daily cap, per-dispatch cap, and duplicate logical sends are checked before provider dispatch.

Required safety defaults:

- `WHATSAPP_SEND_MODE=disabled` until testing starts
- staging smoke tests use `WHATSAPP_SEND_MODE=allowlist`
- `WHATSAPP_ALLOWED_RECIPIENTS` must contain normalized E.164 numbers only, for example `+447123456789`
- `WHATSAPP_DAILY_SEND_LIMIT` defaults to `10`
- `WHATSAPP_PER_DISPATCH_LIMIT` defaults to `2`
- `WHATSAPP_ALLOW_LIVE_NON_PROD=false`

`live` mode is treated as production-only. In staging, preview, local, or any environment without `SKIIP_ENVIRONMENT=production` or `prod`, `live` is blocked unless `WHATSAPP_ALLOW_LIVE_NON_PROD=true`.

Guard blocks are terminal local failures. They do not call Twilio, do not record a message SID, and do not schedule another retry. Operators should inspect `notification_logs.metadata.whatsapp_guard_block_reason`.

Guard reason codes:

- `guard_disabled`
- `guard_not_allowlisted`
- `guard_daily_cap_reached`
- `guard_dispatch_cap_reached`
- `guard_duplicate_logical_event`
- `guard_ineligible_event`
- `guard_missing_opt_in`
- `guard_invalid_recipient`
- `guard_live_blocked_non_prod`

Provider attempt counting:

- `whatsapp_provider_attempted_at` is written immediately before Twilio is called
- daily caps count attempted WhatsApp provider rows for the current UTC day
- per-dispatch caps count attempted WhatsApp provider rows in one dispatch sweep
- duplicate protection blocks a later provider attempt for the same `(order_id, event_type, recipient)`

Operator requeue:

- do not manually requeue WhatsApp rows unless the Twilio dashboard and `notification_logs` show that no chargeable provider attempt should be retried
- if a deliberate reattempt is approved, record operator evidence in metadata using `whatsapp_operator_requeue_approved=true` or `whatsapp_operator_requeue_approved_at`
- keep the daily cap low while requeueing so a bad retry cannot drain credit
