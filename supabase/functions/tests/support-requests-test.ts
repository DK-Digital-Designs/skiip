import { assert, assertEquals } from "jsr:@std/assert@1"
import {
  BUYER_ISSUE_TYPES,
  BUYER_ORDER_REQUIRED_ISSUE_TYPES,
  createSupportReferenceCode,
  VENDOR_ISSUE_TYPES,
} from "../_shared/support-requests.ts"

Deno.test("support issue categories remain separated by reporter role", () => {
  assert(BUYER_ISSUE_TYPES.has("refund_request"))
  assert(BUYER_ORDER_REQUIRED_ISSUE_TYPES.has("cold_food"))
  assert(!VENDOR_ISSUE_TYPES.has("cold_food"))
  assert(VENDOR_ISSUE_TYPES.has("payment_payout_concern"))
})

Deno.test("support references are recognizable and date based", () => {
  const reference = createSupportReferenceCode(new Date("2026-05-27T12:00:00.000Z"))
  assertEquals(reference.startsWith("SUP-20260527-"), true)
  assertEquals(reference.length, "SUP-20260527-".length + 8)
})
