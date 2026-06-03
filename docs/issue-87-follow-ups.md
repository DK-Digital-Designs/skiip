# Issue 87 Follow-ups

Deferred work from the product-modifiers (combo-able products) build. Captured at the point the feature went live behind flags on `feature/issue-87-modifier-ui-first`. Ordered roughly by priority.

## Operational

1. **Confirm hosted secrets and run a real configured order.** Verify the Supabase function secret `PRODUCT_MODIFIER_BACKEND_ENABLED=true` and the appended `ALLOWED_ORIGINS` are set, then place one configured order all the way through Stripe Checkout. The UI rendering does not prove the server path; `order-create` only rejects/accepts configured lines when the click reaches it.

2. **Remove the preview origin from `ALLOWED_ORIGINS` after merge.** The Vercel preview URL `https://skiip-git-feature-issue-87-modifier-ui-first-dkdigital.vercel.app` was added to the shared (production) functions' allow-list for branch testing. Drop it once this branch merges. See [Function Auth Posture](./architecture/function-auth-posture.md) and the `ALLOWED_ORIGINS` weak spot in [Known Weak Spots](./current-state/known-weak-spots.md) / [Priority 1](./roadmap/priority-1-current-gaps.md).

## Correctness / robustness

3. **Vendor modifier save has no error feedback.** In [`Products.jsx` `handleSubmit`](../app/src/pages/vendor/Products.jsx), if `ProductService.saveProductModifiers` throws *after* the product itself saves, the failure is only `console.error`'d. The vendor sees no toast and ends up with a product whose modifiers did not persist. Add user-facing error handling and surface the partial-save.

4. **No unit test for server-side modifier validation.** `validateAndBuildSelectedModifiers` in [`order-create/index.ts`](../supabase/functions/order-create/index.ts) enforces `required`/`max_select` and rejects unknown/cross-product options, but only the `replace_product_modifiers_v1` RPC has a SQL test. Add coverage for the edge-function validation/re-pricing on this money path.

5. **`maxSelect` fallback divergence in the menu config dialog.** [`Menu.jsx`](../app/src/pages/attendee/Menu.jsx) computes the cap as `Number(group.maxSelect || group.options?.length || 0)` in `getSelectionValidity` but `... || 1` in `toggleOption`. Not reachable with the current fixtures (groups always carry `maxSelect`), but tidy it so the two agree if a group ever has a falsy `maxSelect`.

## Docs / hygiene

6. **Resolve the `ALLOWED_ORIGINS` documented gap.** Setting it explicitly in hosted environments closes a standing P1 weak spot. Once confirmed set, update [Known Weak Spots](./current-state/known-weak-spots.md) and [Priority 1: Current Gaps](./roadmap/priority-1-current-gaps.md) and make the in-code fallback localhost-only.

7. **Architecture/current-state docs for modifiers.** Done in this branch (core data model, order/payment flow, frontend, current-state). Revisit if the editor gains persistence-state UI or the flags are retired after full rollout.
