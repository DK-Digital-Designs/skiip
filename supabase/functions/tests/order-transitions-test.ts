import { assertEquals } from "jsr:@std/assert@1";
import {
  getAllowedOrderTransitions,
  isBuyerOwnedUnpaidCancellation,
  isIdempotentUnpaidCancellation,
  isPendingUnpaidCancellation,
} from "../_shared/order-transitions.ts";

Deno.test("pending unpaid orders can move to cancelled", () => {
  assertEquals(
    isPendingUnpaidCancellation(
      { status: "pending", payment_status: "pending" },
      "cancelled",
    ),
    true,
  );
  assertEquals(
    isPendingUnpaidCancellation(
      { status: "pending", payment_status: "failed" },
      "cancelled",
    ),
    true,
  );
});

Deno.test("paid pending orders are excluded from unpaid cancellation", () => {
  assertEquals(
    isPendingUnpaidCancellation(
      { status: "pending", payment_status: "succeeded" },
      "cancelled",
    ),
    false,
  );
  assertEquals(
    isPendingUnpaidCancellation(
      { status: "paid", payment_status: "succeeded" },
      "cancelled",
    ),
    false,
  );
});

Deno.test("already cancelled unpaid orders accept repeated cancellation requests", () => {
  assertEquals(
    isIdempotentUnpaidCancellation(
      { status: "cancelled", payment_status: "pending" },
      "cancelled",
    ),
    true,
  );
  assertEquals(
    isIdempotentUnpaidCancellation(
      { status: "cancelled", payment_status: "succeeded" },
      "cancelled",
    ),
    false,
  );
});

Deno.test("buyers can only repeat unpaid cancellation for their own orders", () => {
  assertEquals(
    isBuyerOwnedUnpaidCancellation(
      { status: "cancelled", payment_status: "pending", user_id: "buyer-1" },
      "cancelled",
      "buyer-1",
    ),
    true,
  );
  assertEquals(
    isBuyerOwnedUnpaidCancellation(
      { status: "cancelled", payment_status: "pending", user_id: "buyer-1" },
      "cancelled",
      "buyer-2",
    ),
    false,
  );
});

Deno.test("vendor transitions close cancellation once preparation starts", () => {
  assertEquals(getAllowedOrderTransitions("paid"), ["preparing", "cancelled"]);
  assertEquals(getAllowedOrderTransitions("preparing"), ["ready"]);
  assertEquals(getAllowedOrderTransitions("ready"), ["collected"]);
  assertEquals(getAllowedOrderTransitions("cancelled"), []);
});
