# SKIIP Internal Document Audit

Prepared on: 20 May 2026
Purpose: Internal working assessment of the three source documents before client/legal finalisation.

Scale: `0/10` means no meaningful work remains. `10/10` means a full rewrite is required.

## A. State Scores

| Document | Work Needed | State |
| --- | ---: | --- |
| Phase 5 Progress Billing Report | 3/10 | Strong client-facing billing draft. Needs evidence appendix, current verification facts, and sharper separation between completed Phase 5 value and future Phase 6 launch activation. |
| Client Launch Readiness Report | 5/10 | Good working report. Needs owner/status/date matrix, fuller pitfall register, scale-testing plan, data cleanup, rollback/cutover, support model, and legal/policy gates. |
| Agreement Cleanup V4 Draft | 7/10 | Useful structure, not signature-ready. Needs legal identities, placeholders resolved, annexures, platform fee wording, IP/source-code lawyer review, support pricing, and cross-border/governing-law review. |

## B. Key Improvements

### Phase 5 Billing

- Keep the R36,500.00 to R37,000.00 combined billing range visible.
- Add evidence against payment recovery, webhook hardening, refunds, reconciliation, notifications, admin/vendor controls, launch docs, and release hygiene.
- Update the current technical baseline to version `0.28.0`.
- Add 20 May 2026 verification: 67 unit tests passed, build passed, 3 public e2e smoke tests passed, 3 authenticated smoke tests skipped without credentials.
- State clearly that Phase 6 launch activation is separate unless agreed in writing.

### Launch Readiness

- Add status, owner, due date, required evidence, and fallback for every gate.
- Expand the testing plan to cover authenticated smoke, sandbox payment, live low-value payment, refund, reconciliation, vendor readiness, notification provider checks, and stress/scaling tests.
- Add event-day support ownership and escalation flow.
- Add production data cleanup.
- Add legal/customer policy approval.
- Keep ticketing, QR scanning, event management, and advanced analytics separate unless scoped.

### Contract

- Remove internal edit-log wording from any signature copy.
- Confirm legal names, addresses, emails, and signatories.
- Resolve platform fee wording.
- Attach completed baseline, exclusions, launch gates, and support annexures.
- Send source-code/handover, IP, governing law, cross-border enforcement, liability, late-payment, data protection, and electronic approval wording to lawyers.

## C. Work Plan

1. Freeze the factual baseline from repo docs and current verification.
2. Finalise Phase 5 billing with evidence and completed-work framing.
3. Expand launch readiness into a go/no-go control pack.
4. Clean the agreement into a lawyer-ready signature draft with annexures.
5. Run the pre-launch verification program before any live-money customer launch.
