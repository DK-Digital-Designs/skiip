import {
  assertEquals,
  assertThrows,
  assertRejects,
} from "jsr:@std/assert@1";
import {
  assertStripeSecretKeyMatchesMode,
  assertStripeLivemode,
  constructWithWebhookSecrets,
  getStripeSecretKeyMode,
  getRequiredStripeMode,
  isPaymentsEnabled,
  parseStripeWebhookSecrets,
  StripeKeyModeMismatchError,
  StripeModeMismatchError,
} from "../_shared/stripe-config.ts";

function env(values: Record<string, string | undefined>) {
  return {
    get(key: string) {
      return values[key];
    },
  };
}

Deno.test("getRequiredStripeMode requires an explicit mode", () => {
  assertThrows(
    () => getRequiredStripeMode(env({})),
    Error,
    'STRIPE_MODE must be set to "test" or "live"',
  );

  assertThrows(
    () => getRequiredStripeMode(env({ STRIPE_MODE: "sandbox" })),
    Error,
    'STRIPE_MODE must be set to "test" or "live"',
  );
});

Deno.test("assertStripeLivemode rejects mismatched test and live events", () => {
  assertStripeLivemode({ livemode: false }, env({ STRIPE_MODE: "test" }));
  assertStripeLivemode({ livemode: true }, env({ STRIPE_MODE: "live" }));

  const testModeError = assertThrows(
    () => assertStripeLivemode({ livemode: true }, env({ STRIPE_MODE: "test" })),
    StripeModeMismatchError,
  );
  assertEquals(testModeError.expectedMode, "test");
  assertEquals(testModeError.actualMode, "live");

  const liveModeError = assertThrows(
    () => assertStripeLivemode({ livemode: false }, env({ STRIPE_MODE: "live" })),
    StripeModeMismatchError,
  );
  assertEquals(liveModeError.expectedMode, "live");
  assertEquals(liveModeError.actualMode, "test");
});

Deno.test("getStripeSecretKeyMode detects live and test secret key prefixes", () => {
  assertEquals(getStripeSecretKeyMode("sk_test_123"), "test");
  assertEquals(getStripeSecretKeyMode("rk_test_123"), "test");
  assertEquals(getStripeSecretKeyMode("sk_live_123"), "live");
  assertEquals(getStripeSecretKeyMode("rk_live_123"), "live");
  assertEquals(getStripeSecretKeyMode("pk_test_123"), null);
  assertEquals(getStripeSecretKeyMode("not-a-stripe-key"), null);
});

Deno.test("assertStripeSecretKeyMatchesMode rejects key prefix mismatches", () => {
  assertStripeSecretKeyMatchesMode("sk_test_123", env({ STRIPE_MODE: "test" }));
  assertStripeSecretKeyMatchesMode("rk_live_123", env({ STRIPE_MODE: "live" }));

  const testModeError = assertThrows(
    () => assertStripeSecretKeyMatchesMode("sk_live_123", env({ STRIPE_MODE: "test" })),
    StripeKeyModeMismatchError,
  );
  assertEquals(testModeError.expectedMode, "test");
  assertEquals(testModeError.actualMode, "live");

  const liveModeError = assertThrows(
    () => assertStripeSecretKeyMatchesMode("sk_test_123", env({ STRIPE_MODE: "live" })),
    StripeKeyModeMismatchError,
  );
  assertEquals(liveModeError.expectedMode, "live");
  assertEquals(liveModeError.actualMode, "test");
});

Deno.test("assertStripeSecretKeyMatchesMode rejects non-secret Stripe keys", () => {
  assertThrows(
    () => assertStripeSecretKeyMatchesMode("pk_test_123", env({ STRIPE_MODE: "test" })),
    Error,
    "STRIPE_SECRET_KEY must start with sk_test_ or rk_test_",
  );
});

Deno.test("isPaymentsEnabled only accepts exact true", () => {
  assertEquals(isPaymentsEnabled(env({ PAYMENTS_ENABLED: "true" })), true);
  assertEquals(isPaymentsEnabled(env({ PAYMENTS_ENABLED: "TRUE" })), true);
  assertEquals(isPaymentsEnabled(env({ PAYMENTS_ENABLED: "false" })), false);
  assertEquals(isPaymentsEnabled(env({ PAYMENTS_ENABLED: "yes" })), false);
  assertEquals(isPaymentsEnabled(env({})), false);
});

Deno.test("parseStripeWebhookSecrets supports comma-separated rotation secrets", () => {
  assertEquals(
    parseStripeWebhookSecrets(env({
      STRIPE_WEBHOOK_SECRET: " whsec_old ,whsec_new,, ",
    })),
    ["whsec_old", "whsec_new"],
  );
});

Deno.test("constructWithWebhookSecrets attempts rotated secrets until one verifies", async () => {
  const attempted: string[] = [];
  const event = await constructWithWebhookSecrets(
    ["whsec_old", "whsec_new"],
    async (secret) => {
      attempted.push(secret);
      if (secret === "whsec_new") {
        return { id: "evt_123" };
      }
      throw new Error("Invalid signature");
    },
  );

  assertEquals(attempted, ["whsec_old", "whsec_new"]);
  assertEquals(event, { id: "evt_123" });
});

Deno.test("constructWithWebhookSecrets reports the first verification failure", async () => {
  await assertRejects(
    () =>
      constructWithWebhookSecrets(
        ["whsec_old", "whsec_new"],
        async (secret) => {
          throw new Error(`${secret} failed`);
        },
      ),
    Error,
    "whsec_old failed",
  );
});
