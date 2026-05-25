import { assertEquals } from "jsr:@std/assert@1";
import {
  getStripeConnectAccountId,
  handleStripeDisputeCreated,
} from "../_shared/stripe-webhook-events.ts";

function createFakeSupabase(orderId: string | null) {
  const auditRows: Record<string, unknown>[] = [];

  return {
    auditRows,
    from(table: string) {
      if (table === "orders") {
        return {
          select() {
            return this;
          },
          eq() {
            return this;
          },
          async maybeSingle() {
            return { data: orderId ? { id: orderId } : null, error: null };
          },
        };
      }

      if (table === "audit_logs") {
        return {
          async insert(row: Record<string, unknown>) {
            auditRows.push(row);
            return { error: null };
          },
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

Deno.test("getStripeConnectAccountId prefers the Connect event account owner", () => {
  assertEquals(
    getStripeConnectAccountId({ account: "acct_connected" }, { id: "acct_object" }),
    "acct_connected",
  );

  assertEquals(
    getStripeConnectAccountId({}, { id: "acct_object" }),
    "acct_object",
  );
});

Deno.test("handleStripeDisputeCreated writes an audit row for the linked order", async () => {
  const supabase = createFakeSupabase("order_123");
  const warnings: Record<string, unknown>[] = [];

  const payload = await handleStripeDisputeCreated({
    supabase,
    dispute: {
      id: "dp_123",
      charge: "ch_123",
      amount: 1200,
      currency: "gbp",
      reason: "fraudulent",
      status: "needs_response",
    },
    eventId: "evt_123",
    log: {
      warn(_message, context) {
        warnings.push(context || {});
      },
    },
  });

  assertEquals(payload.order_id, "order_123");
  assertEquals(payload.amount, 12);
  assertEquals(warnings.length, 1);
  assertEquals(supabase.auditRows.length, 1);
  assertEquals(supabase.auditRows[0].event_type, "stripe_dispute_created");
  assertEquals(supabase.auditRows[0].entity_type, "order");
  assertEquals(supabase.auditRows[0].entity_id, "order_123");
});
