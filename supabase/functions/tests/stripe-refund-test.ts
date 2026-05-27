import { assertEquals } from "jsr:@std/assert@1"
import { buildFullDestinationChargeRefundParameters } from "../_shared/stripe-refund.ts"

Deno.test("full destination-charge refunds reverse transfer and application fee allocation", () => {
  assertEquals(buildFullDestinationChargeRefundParameters({
    id: "order_123",
    payment_intent_id: "pi_123",
  }), {
    payment_intent: "pi_123",
    reason: "requested_by_customer",
    reverse_transfer: true,
    refund_application_fee: true,
    metadata: { order_id: "order_123" },
  })
})
