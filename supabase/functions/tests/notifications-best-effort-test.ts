import { assertEquals, assertObjectMatch } from "jsr:@std/assert@1";
import {
  normalizeNotificationQueueError,
  sendTransactionalNotificationsBestEffort,
} from "../_shared/notifications.ts";
import type { NotificationContext } from "../_shared/notification-types.ts";

type LogEntry = {
  message: string;
  context?: Record<string, unknown>;
};

function createLogger() {
  const entries: LogEntry[] = [];

  return {
    entries,
    logger: {
      error(message: string, context?: Record<string, unknown>) {
        entries.push({ message, context });
      },
    },
  };
}

function createBaseContext() {
  return {
    supabase: {},
    orderId: "order-123",
    eventType: "order_ready",
    correlationId: "11111111-1111-4111-8111-111111111111",
    functionName: "order-transition",
    operation: "order_status_transition",
    metadata: {
      actorUserId: "user-123",
      previousStatus: "preparing",
      nextStatus: "ready",
    },
  } as const;
}

Deno.test("sendTransactionalNotificationsBestEffort returns queued true without logging on success", async () => {
  const { entries, logger } = createLogger();
  let queuedContext: NotificationContext | null = null;

  const result = await sendTransactionalNotificationsBestEffort(
    createBaseContext(),
    {
      logger,
      queueNotifications: async (context) => {
        queuedContext = context;
        return { queued: 1 };
      },
    },
  );

  assertEquals(result, { queued: true });
  assertEquals(entries, []);
  assertObjectMatch(queuedContext as unknown as Record<string, unknown>, {
    orderId: "order-123",
    eventType: "order_ready",
    correlationId: "11111111-1111-4111-8111-111111111111",
  });
});

Deno.test("sendTransactionalNotificationsBestEffort logs Error failures with operational context", async () => {
  const { entries, logger } = createLogger();

  const result = await sendTransactionalNotificationsBestEffort(
    createBaseContext(),
    {
      logger,
      queueNotifications: async () => {
        throw new Error("Failed to queue notifications: insert failed");
      },
    },
  );

  assertEquals(result, {
    queued: false,
    error: "Failed to queue notifications: insert failed",
  });
  assertEquals(entries.length, 1);
  assertEquals(
    entries[0].message,
    "Transactional notification queueing failed",
  );
  assertObjectMatch(entries[0].context || {}, {
    functionName: "order-transition",
    operation: "order_status_transition",
    orderId: "order-123",
    eventType: "order_ready",
    correlationId: "11111111-1111-4111-8111-111111111111",
    sourceEventId: null,
    error: "Failed to queue notifications: insert failed",
    metadata: {
      actorUserId: "user-123",
      previousStatus: "preparing",
      nextStatus: "ready",
    },
  });
});

Deno.test("sendTransactionalNotificationsBestEffort normalizes non-Error thrown values", async () => {
  const { entries, logger } = createLogger();

  const result = await sendTransactionalNotificationsBestEffort(
    createBaseContext(),
    {
      logger,
      queueNotifications: async () => {
        throw { code: "PGRST", message: "insert failed" };
      },
    },
  );

  assertEquals(result, {
    queued: false,
    error: '{"code":"PGRST","message":"insert failed"}',
  });
  assertEquals(
    entries[0].context?.error,
    '{"code":"PGRST","message":"insert failed"}',
  );
  assertEquals(
    normalizeNotificationQueueError(Symbol.for("queue-failed")),
    "Symbol(queue-failed)",
  );
});

Deno.test("successful mutation responses stay successful when notification queueing fails", async () => {
  const { entries, logger } = createLogger();

  async function completeMutation(
    responseBody: Record<string, unknown>,
    operation: string,
  ) {
    await sendTransactionalNotificationsBestEffort(
      {
        ...createBaseContext(),
        operation,
      },
      {
        logger,
        queueNotifications: async () => {
          throw new Error("simulated notification queue failure");
        },
      },
    );

    return {
      status: 200,
      body: responseBody,
    };
  }

  const transitionResponse = await completeMutation(
    { order: { id: "order-123", status: "ready" } },
    "order_status_transition",
  );
  const refundResponse = await completeMutation(
    { refundId: "re_123" },
    "admin_refund",
  );

  assertEquals(transitionResponse, {
    status: 200,
    body: { order: { id: "order-123", status: "ready" } },
  });
  assertEquals(refundResponse, {
    status: 200,
    body: { refundId: "re_123" },
  });
  assertEquals(entries.length, 2);
  assertEquals(entries[0].context?.operation, "order_status_transition");
  assertEquals(entries[1].context?.operation, "admin_refund");
});
