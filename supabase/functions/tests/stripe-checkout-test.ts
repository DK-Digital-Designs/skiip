import { assertEquals } from "jsr:@std/assert@1";
import {
  buildCheckoutSessionIdempotencyKey,
  calculateApplicationFeeAmount,
  getReusableCheckoutSession,
} from "../_shared/stripe-checkout.ts";

Deno.test("calculateApplicationFeeAmount retains ten percent of subtotal plus the GBP 1.50 service fee", () => {
  assertEquals(calculateApplicationFeeAmount(20, 1.5, 0.10), 350);
  assertEquals(calculateApplicationFeeAmount(20, 1.5, 0.05), 250);
});

Deno.test("buildCheckoutSessionIdempotencyKey is stable for a pending order", () => {
  assertEquals(
    buildCheckoutSessionIdempotencyKey({
      id: "order_123",
      payment_status: "pending",
      checkout_session_id: null,
      payment_failed_at: null,
    }),
    "skiip-checkout:order_123:initial:pending",
  );
});

Deno.test("buildCheckoutSessionIdempotencyKey changes after a failed payment attempt", () => {
  assertEquals(
    buildCheckoutSessionIdempotencyKey({
      id: "order_123",
      checkout_session_id: "cs_test_123",
      payment_failed_at: "2026-05-25T13:00:00.000Z",
    }),
    "skiip-checkout:order_123:cs_test_123:2026-05-25T13:00:00.000Z",
  );
});

Deno.test("getReusableCheckoutSession only reuses open sessions with URLs", () => {
  assertEquals(
    getReusableCheckoutSession({
      id: "cs_test_open",
      status: "open",
      url: "https://checkout.stripe.com/c/pay/cs_test_open",
    }),
    {
      sessionId: "cs_test_open",
      url: "https://checkout.stripe.com/c/pay/cs_test_open",
    },
  );

  assertEquals(
    getReusableCheckoutSession({
      id: "cs_test_complete",
      status: "complete",
      url: "https://checkout.stripe.com/c/pay/cs_test_complete",
    }),
    null,
  );

  assertEquals(
    getReusableCheckoutSession({
      id: "cs_test_open",
      status: "open",
      url: null,
    }),
    null,
  );
});
