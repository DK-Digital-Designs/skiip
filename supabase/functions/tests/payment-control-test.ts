import {
  assertEquals,
  assertRejects,
} from "jsr:@std/assert@1";
import {
  buildPaymentControlsUpdate,
  getPaymentControls,
  normalizePaymentControls,
  PAYMENT_CONTROLS_KEY,
} from "../_shared/payment-control.ts";

function fakeSettingsClient(result: {
  data?: { value?: unknown } | null;
  error?: Error | null;
}) {
  const calls: Array<{ table: string; key: string; value: string }> = [];

  return {
    calls,
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq(key: string, value: string) {
          calls.push({ table, key, value });
          return this;
        },
        async maybeSingle() {
          return {
            data: result.data ?? null,
            error: result.error ?? null,
          };
        },
      };
    },
  };
}

Deno.test("normalizePaymentControls defaults checkout to enabled", () => {
  assertEquals(normalizePaymentControls(null), {
    enabled: true,
    reason: null,
    updatedAt: null,
    updatedBy: null,
  });

  assertEquals(normalizePaymentControls({ enabled: "false" }), {
    enabled: true,
    reason: null,
    updatedAt: null,
    updatedBy: null,
  });
});

Deno.test("normalizePaymentControls preserves an explicit admin pause", () => {
  assertEquals(
    normalizePaymentControls({
      enabled: false,
      reason: " Curfew ",
      updatedAt: "2026-05-25T14:00:00.000Z",
      updatedBy: "admin-user",
    }),
    {
      enabled: false,
      reason: "Curfew",
      updatedAt: "2026-05-25T14:00:00.000Z",
      updatedBy: "admin-user",
    },
  );
});

Deno.test("buildPaymentControlsUpdate records the operator and timestamp", () => {
  assertEquals(
    buildPaymentControlsUpdate({
      enabled: false,
      reason: " Incident stop-sale ",
      updatedBy: "admin-user",
      updatedAt: "2026-05-25T14:05:00.000Z",
    }),
    {
      enabled: false,
      reason: "Incident stop-sale",
      updatedAt: "2026-05-25T14:05:00.000Z",
      updatedBy: "admin-user",
    },
  );
});

Deno.test("getPaymentControls reads the payment_controls app setting", async () => {
  const supabase = fakeSettingsClient({
    data: {
      value: {
        enabled: false,
        reason: "Curfew",
      },
    },
  });

  assertEquals(await getPaymentControls(supabase), {
    enabled: false,
    reason: "Curfew",
    updatedAt: null,
    updatedBy: null,
  });
  assertEquals(supabase.calls, [{
    table: "app_settings",
    key: "key",
    value: PAYMENT_CONTROLS_KEY,
  }]);
});

Deno.test("getPaymentControls surfaces database errors", async () => {
  await assertRejects(
    () => getPaymentControls(fakeSettingsClient({ error: new Error("db unavailable") })),
    Error,
    "db unavailable",
  );
});
