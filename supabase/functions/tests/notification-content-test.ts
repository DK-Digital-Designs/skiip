import { assert, assertEquals, assertStringIncludes } from "jsr:@std/assert@1";
import { buildEmailContent } from "../_shared/notification-content.ts";
import type { NotificationPayloadSnapshot } from "../_shared/notification-types.ts";

const basePayload: NotificationPayloadSnapshot = {
  orderId: "order-123",
  storeId: "store-123",
  orderNumber: "ORD-20260523-ABC123",
  customerEmail: "buyer@example.com",
  customerPhone: null,
  total: "42.00",
  refundAmount: null,
  scheduledCollectionAt: null,
  scheduledCollectionTimezone: null,
  scheduledCollectionLabel: null,
  status: "paid",
  whatsappOptIn: false,
  storeName: "Meat Kings",
  pickupLocation: null,
};

Deno.test("order paid email renders branded HTML and text fallback", () => {
  const content = buildEmailContent(basePayload, "order_paid");

  assertEquals(content.subject, "Your SKIIP order is confirmed");
  assertStringIncludes(content.html, "SKIIP");
  assertStringIncludes(content.html, "Track your order");
  assertStringIncludes(content.html, "Total paid");
  assertStringIncludes(content.html, "GBP 42.00");
  assertStringIncludes(content.html, "Orders cannot be cancelled once the vendor has started preparing the food.");
  assertStringIncludes(content.text, "SKIIP");
  assertStringIncludes(content.text, "Orders cannot be cancelled once the vendor has started preparing the food.");
  assertStringIncludes(content.text, "Track your order: https://www.skiip.co.uk/#/order/profile");
});

Deno.test("ready email includes pickup location and escapes dynamic values", () => {
  const content = buildEmailContent(
    {
      ...basePayload,
      storeName: "Vendor <script>",
      pickupLocation: "Gate A <North>",
    },
    "order_ready",
  );

  assertStringIncludes(content.html, "Ready for pickup");
  assertStringIncludes(content.html, "To enjoy your food at its best");
  assertStringIncludes(content.html, "refund requests related to delayed collection cannot be accommodated");
  assertStringIncludes(content.html, "Vendor &lt;script&gt;");
  assertStringIncludes(content.html, "Gate A &lt;North&gt;");
  assert(!content.html.includes("Vendor <script>"));
  assert(!content.html.includes("Gate A <North>"));
  assertStringIncludes(content.text, "Thank you for your understanding and cooperation");
});

Deno.test("cancelled email directs paid customers to the return form", () => {
  const content = buildEmailContent(basePayload, "order_cancelled");

  assertEquals(content.subject, "Your SKIIP order was cancelled");
  assertStringIncludes(content.html, "submit the return form");
  assertStringIncludes(content.html, "The SKIIP team will confirm your refund.");
  assertStringIncludes(content.html, "Use the Track your order link to open this order in SKIIP.");
  assertStringIncludes(content.text, "submit the return form");
  assert(!content.html.includes("support will advise"));
  assert(!content.html.includes("No further action is needed"));
  assert(!content.text.includes("support will advise"));
  assert(!content.text.includes("No further action is needed"));
});
