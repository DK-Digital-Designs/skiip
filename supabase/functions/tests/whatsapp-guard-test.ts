import { assertEquals } from "jsr:@std/assert@1";
import {
  checkWhatsAppDispatchGuard,
  normalizeWhatsAppPhone,
  type SupabaseNotificationLogClient,
  type WhatsAppDispatchRunState,
} from "../_shared/whatsapp-guard.ts";
import type {
  NotificationLogRecord,
  NotificationPayloadSnapshot,
} from "../_shared/notification-types.ts";

const ENV_KEYS = [
  "WHATSAPP_SEND_MODE",
  "WHATSAPP_ALLOWED_RECIPIENTS",
  "WHATSAPP_DAILY_SEND_LIMIT",
  "WHATSAPP_PER_DISPATCH_LIMIT",
  "WHATSAPP_ALLOW_LIVE_NON_PROD",
  "WHATSAPP_DEFAULT_COUNTRY_CODE",
  "SKIIP_ENVIRONMENT",
  "APP_ENV",
  "ENVIRONMENT",
  "VERCEL_ENV",
  "SUPABASE_ENV",
];

type FakeRow = Record<string, unknown>;

type FakeQueryResult = {
  data: NotificationLogRecord[] | null;
  error: { message: string; code?: string } | null;
};

class FakeQuery implements PromiseLike<FakeQueryResult> {
  private filters: Array<(row: FakeRow) => boolean> = [];

  constructor(
    private rows: FakeRow[],
    private error: { message: string; code?: string } | null = null,
  ) {}

  select() {
    return this;
  }

  eq(field: string, value: unknown) {
    this.filters.push((row) => row[field] === value);
    return this;
  }

  neq(field: string, value: unknown) {
    this.filters.push((row) => row[field] !== value);
    return this;
  }

  gte(field: string, value: string) {
    this.filters.push((row) => String(row[field] || "") >= value);
    return this;
  }

  then<TResult1 = FakeQueryResult, TResult2 = never>(
    onfulfilled?:
      | ((value: FakeQueryResult) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    const result = this.error ? { data: [], error: this.error } : {
      data: this.rows.filter((row) =>
        this.filters.every((filter) => filter(row))
      ) as unknown as NotificationLogRecord[],
      error: null,
    };

    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

function createSupabase(rows: FakeRow[] = []): SupabaseNotificationLogClient {
  return {
    from(table: "notification_logs") {
      if (table !== "notification_logs") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return new FakeQuery(rows);
    },
  };
}

function resetEnv() {
  for (const key of ENV_KEYS) {
    Deno.env.delete(key);
  }
}

function withEnv(
  env: Record<string, string>,
  callback: () => Promise<void> | void,
) {
  return async () => {
    resetEnv();
    for (const [key, value] of Object.entries(env)) {
      Deno.env.set(key, value);
    }

    try {
      await callback();
    } finally {
      resetEnv();
    }
  };
}

function createNotification(
  overrides: Partial<NotificationLogRecord> = {},
): NotificationLogRecord {
  return {
    id: "notification-1",
    order_id: "order-1",
    store_id: "store-1",
    channel: "whatsapp",
    event_type: "order_ready",
    provider: "twilio",
    recipient: "07123 456789",
    status: "processing",
    message_sid: null,
    error_message: null,
    metadata: {},
    payload_snapshot: null,
    dispatch_attempts: 1,
    correlation_id: null,
    source_event_id: null,
    sent_at: null,
    delivered_at: null,
    failed_at: null,
    ...overrides,
  };
}

function createPayload(
  overrides: Partial<NotificationPayloadSnapshot> = {},
): NotificationPayloadSnapshot {
  return {
    orderId: "order-1",
    storeId: "store-1",
    orderNumber: "SK-1001",
    customerEmail: "buyer@example.com",
    customerPhone: "07123 456789",
    total: "12.00",
    refundAmount: null,
    scheduledCollectionAt: null,
    scheduledCollectionTimezone: null,
    scheduledCollectionLabel: null,
    status: "ready",
    whatsappOptIn: true,
    storeName: "Test Vendor",
    pickupLocation: "Gate A",
    ...overrides,
  };
}

function createRunState(
  whatsappProviderAttempts = 0,
): WhatsAppDispatchRunState {
  return { whatsappProviderAttempts };
}

Deno.test(
  "normalizeWhatsAppPhone converts UK local numbers to E.164",
  withEnv(
    {},
    () => {
      assertEquals(normalizeWhatsAppPhone("07123 456789"), "+447123456789");
      assertEquals(normalizeWhatsAppPhone("+44 7123 456789"), "+447123456789");
      assertEquals(normalizeWhatsAppPhone("0044 7123 456789"), "+447123456789");
    },
  ),
);

Deno.test(
  "WhatsApp guard blocks disabled mode before provider dispatch",
  withEnv(
    { WHATSAPP_SEND_MODE: "disabled" },
    async () => {
      const result = await checkWhatsAppDispatchGuard({
        supabase: createSupabase(),
        notification: createNotification(),
        payload: createPayload(),
        eventType: "order_ready",
        runState: createRunState(),
      });

      assertEquals(result.allowed, false);
      if (!result.allowed) {
        assertEquals(result.reason, "guard_disabled");
        assertEquals(
          result.metadata.whatsapp_guard_block_reason,
          "guard_disabled",
        );
      }
    },
  ),
);

Deno.test(
  "WhatsApp guard permits normalized allow-listed recipients",
  withEnv(
    {
      WHATSAPP_SEND_MODE: "allowlist",
      WHATSAPP_ALLOWED_RECIPIENTS: "+447123456789",
    },
    async () => {
      const result = await checkWhatsAppDispatchGuard({
        supabase: createSupabase(),
        notification: createNotification(),
        payload: createPayload(),
        eventType: "order_ready",
        runState: createRunState(),
      });

      assertEquals(result.allowed, true);
      if (result.allowed) {
        assertEquals(result.normalizedRecipient, "+447123456789");
      }
    },
  ),
);

Deno.test(
  "WhatsApp guard blocks non-allow-listed recipients",
  withEnv(
    {
      WHATSAPP_SEND_MODE: "allowlist",
      WHATSAPP_ALLOWED_RECIPIENTS: "+447000000000",
    },
    async () => {
      const result = await checkWhatsAppDispatchGuard({
        supabase: createSupabase(),
        notification: createNotification(),
        payload: createPayload(),
        eventType: "order_ready",
        runState: createRunState(),
      });

      assertEquals(result.allowed, false);
      if (!result.allowed) {
        assertEquals(result.reason, "guard_not_allowlisted");
      }
    },
  ),
);

Deno.test(
  "WhatsApp guard blocks live mode in non-production without override",
  withEnv(
    {
      WHATSAPP_SEND_MODE: "live",
      SKIIP_ENVIRONMENT: "staging",
    },
    async () => {
      const result = await checkWhatsAppDispatchGuard({
        supabase: createSupabase(),
        notification: createNotification(),
        payload: createPayload(),
        eventType: "order_ready",
        runState: createRunState(),
      });

      assertEquals(result.allowed, false);
      if (!result.allowed) {
        assertEquals(result.reason, "guard_live_blocked_non_prod");
      }
    },
  ),
);

Deno.test(
  "WhatsApp guard blocks invalid recipients before provider dispatch",
  withEnv(
    {
      WHATSAPP_SEND_MODE: "allowlist",
      WHATSAPP_ALLOWED_RECIPIENTS: "+447123456789",
    },
    async () => {
      const result = await checkWhatsAppDispatchGuard({
        supabase: createSupabase(),
        notification: createNotification({ recipient: "not-a-phone" }),
        payload: createPayload({ customerPhone: "not-a-phone" }),
        eventType: "order_ready",
        runState: createRunState(),
      });

      assertEquals(result.allowed, false);
      if (!result.allowed) {
        assertEquals(result.reason, "guard_invalid_recipient");
      }
    },
  ),
);

Deno.test(
  "WhatsApp guard blocks once the daily cap is reached",
  withEnv(
    {
      WHATSAPP_SEND_MODE: "allowlist",
      WHATSAPP_ALLOWED_RECIPIENTS: "+447123456789",
      WHATSAPP_DAILY_SEND_LIMIT: "1",
    },
    async () => {
      const result = await checkWhatsAppDispatchGuard({
        supabase: createSupabase([
          {
            id: "notification-previous",
            channel: "whatsapp",
            status: "failed",
            message_sid: null,
            metadata: {
              whatsapp_provider_attempted_at: new Date().toISOString(),
            },
            created_at: new Date().toISOString(),
          },
        ]),
        notification: createNotification(),
        payload: createPayload(),
        eventType: "order_ready",
        runState: createRunState(),
      });

      assertEquals(result.allowed, false);
      if (!result.allowed) {
        assertEquals(result.reason, "guard_daily_cap_reached");
      }
    },
  ),
);

Deno.test(
  "WhatsApp guard blocks once the per-dispatch cap is reached",
  withEnv(
    {
      WHATSAPP_SEND_MODE: "allowlist",
      WHATSAPP_ALLOWED_RECIPIENTS: "+447123456789",
      WHATSAPP_PER_DISPATCH_LIMIT: "1",
    },
    async () => {
      const result = await checkWhatsAppDispatchGuard({
        supabase: createSupabase(),
        notification: createNotification(),
        payload: createPayload(),
        eventType: "order_ready",
        runState: createRunState(1),
      });

      assertEquals(result.allowed, false);
      if (!result.allowed) {
        assertEquals(result.reason, "guard_dispatch_cap_reached");
      }
    },
  ),
);

Deno.test(
  "WhatsApp guard blocks duplicate logical provider attempts",
  withEnv(
    {
      WHATSAPP_SEND_MODE: "allowlist",
      WHATSAPP_ALLOWED_RECIPIENTS: "+447123456789",
    },
    async () => {
      const result = await checkWhatsAppDispatchGuard({
        supabase: createSupabase([
          {
            id: "notification-previous",
            channel: "whatsapp",
            order_id: "order-1",
            event_type: "order_ready",
            recipient: "+447123456789",
            status: "failed",
            message_sid: null,
            metadata: {
              whatsapp_provider_attempted_at: new Date().toISOString(),
            },
            created_at: new Date().toISOString(),
          },
        ]),
        notification: createNotification(),
        payload: createPayload(),
        eventType: "order_ready",
        runState: createRunState(),
      });

      assertEquals(result.allowed, false);
      if (!result.allowed) {
        assertEquals(result.reason, "guard_duplicate_logical_event");
      }
    },
  ),
);
