import { logger } from "./logger.ts";
import {
  getConfiguredProvider,
  getRetryDelaySeconds,
  isEventEnabledForChannel,
  NOTIFICATION_DISPATCH_BATCH_SIZE,
  NOTIFICATION_DISPATCH_MAX_ATTEMPTS,
  NOTIFICATION_DISPATCH_MAX_BATCHES_PER_RUN,
  NOTIFICATION_PROCESSING_TIMEOUT_SECONDS,
} from "./notification-config.ts";
import { createNotificationPayloadSnapshot } from "./notification-content.ts";
import { sendResendEmailMessage } from "./providers/resend-email.ts";
import { sendTwilioWhatsAppMessage } from "./providers/twilio-whatsapp.ts";
import {
  checkWhatsAppDispatchGuard,
  type WhatsAppDispatchRunState,
} from "./whatsapp-guard.ts";
import {
  type NotificationChannel,
  type NotificationContext,
  type NotificationLogRecord,
  type NotificationPayloadSnapshot,
  type OrderNotificationRecord,
  ProviderDispatchError,
  type ProviderDispatchInput,
  type ProviderDispatchResult,
} from "./notification-types.ts";

const log = logger("notifications");

type DeliveryStatus =
  | "queued"
  | "processing"
  | "sent"
  | "delivered"
  | "read"
  | "failed";

type ProviderSender = (
  input: ProviderDispatchInput,
) => Promise<ProviderDispatchResult>;

type DispatchRunState = {
  whatsapp: WhatsAppDispatchRunState;
};

export type BestEffortNotificationContext = NotificationContext & {
  functionName: string;
  operation: string;
  metadata?: Record<string, unknown>;
};

type BestEffortNotificationOptions = {
  logger?: {
    error: (message: string, context?: Record<string, unknown>) => void;
  };
  queueNotifications?: (context: NotificationContext) => Promise<unknown>;
};

export type BestEffortNotificationResult =
  | { queued: true }
  | { queued: false; error: string };

const PROVIDER_SENDERS: Partial<
  Record<NotificationChannel, Record<string, ProviderSender>>
> = {
  email: {
    resend: sendResendEmailMessage,
  },
  whatsapp: {
    twilio: sendTwilioWhatsAppMessage,
  },
};

function mergeMetadata(
  ...parts: Array<Record<string, unknown> | null | undefined>
) {
  return parts.reduce<Record<string, unknown>>((merged, part) => {
    if (!part) {
      return merged;
    }

    return { ...merged, ...part };
  }, {});
}

function statusRank(status: string | null | undefined) {
  switch (status) {
    case "queued":
      return 0;
    case "processing":
      return 1;
    case "sent":
      return 2;
    case "delivered":
      return 3;
    case "read":
      return 4;
    case "failed":
      return 5;
    default:
      return -1;
  }
}

export function normalizeNotificationQueueError(error: unknown) {
  if (error instanceof Error) {
    return error.message || error.name;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    const json = JSON.stringify(error);
    if (json) {
      return json;
    }
  } catch {
    // Fall through to String() for values that cannot be serialized.
  }

  return String(error);
}

function getProviderSender(notification: NotificationLogRecord) {
  const configuredProvider = notification.provider ||
    getConfiguredProvider(notification.channel);
  const channelProviders = PROVIDER_SENDERS[notification.channel];

  if (!configuredProvider || !channelProviders) {
    return null;
  }

  return channelProviders[configuredProvider] || null;
}

function getRecipientForChannel(
  channel: NotificationChannel,
  payload: NotificationPayloadSnapshot,
) {
  if (channel === "email") {
    return payload.customerEmail;
  }

  if (channel === "whatsapp") {
    return payload.customerPhone;
  }

  return null;
}

function coercePayloadSnapshot(
  value: unknown,
): NotificationPayloadSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const snapshot = value as Record<string, unknown>;
  const orderId = String(snapshot.orderId || "");
  const orderNumber = String(snapshot.orderNumber || "");
  if (!orderId || !orderNumber) {
    return null;
  }

  return {
    orderId,
    storeId: snapshot.storeId === null || snapshot.storeId === undefined
      ? null
      : String(snapshot.storeId),
    orderNumber,
    customerEmail:
      snapshot.customerEmail === null || snapshot.customerEmail === undefined
        ? null
        : String(snapshot.customerEmail),
    customerPhone:
      snapshot.customerPhone === null || snapshot.customerPhone === undefined
        ? null
        : String(snapshot.customerPhone),
    total: String(snapshot.total || "0.00"),
    refundAmount:
      snapshot.refundAmount === null || snapshot.refundAmount === undefined
        ? null
        : String(snapshot.refundAmount),
    scheduledCollectionAt: snapshot.scheduledCollectionAt === null ||
        snapshot.scheduledCollectionAt === undefined
      ? null
      : String(snapshot.scheduledCollectionAt),
    scheduledCollectionTimezone:
      snapshot.scheduledCollectionTimezone === null ||
        snapshot.scheduledCollectionTimezone === undefined
        ? null
        : String(snapshot.scheduledCollectionTimezone),
    scheduledCollectionLabel: snapshot.scheduledCollectionLabel === null ||
        snapshot.scheduledCollectionLabel === undefined
      ? null
      : String(snapshot.scheduledCollectionLabel),
    status: String(snapshot.status || ""),
    whatsappOptIn: snapshot.whatsappOptIn === true,
    storeName: snapshot.storeName === null || snapshot.storeName === undefined
      ? null
      : String(snapshot.storeName),
    pickupLocation:
      snapshot.pickupLocation === null || snapshot.pickupLocation === undefined
        ? null
        : String(snapshot.pickupLocation),
  };
}

async function fetchOrderForNotifications(supabase: any, orderId: string) {
  const { data: order, error } = await supabase
    .from("orders")
    .select(
      "id, store_id, order_number, customer_email, customer_phone, total, refund_amount, scheduled_collection_at, scheduled_collection_timezone, status, whatsapp_opt_in, stores(name, pickup_location)",
    )
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error(
      `Order lookup failed for notifications: ${
        error?.message || "missing order"
      }`,
    );
  }

  return order as OrderNotificationRecord;
}

function buildQueuedNotificationRows(
  order: OrderNotificationRecord,
  eventType: NotificationContext["eventType"],
  channels: NotificationChannel[] | undefined,
  correlationId: string,
  sourceEventId: string | null | undefined,
) {
  const payloadSnapshot = createNotificationPayloadSnapshot(order);
  const requestedChannels: NotificationChannel[] = channels?.length
    ? Array.from(new Set(channels))
    : ["email", "whatsapp"];
  const queuedAt = new Date().toISOString();

  return requestedChannels.flatMap((channel) => {
    const provider = getConfiguredProvider(channel);
    if (!provider) {
      return [];
    }

    if (!isEventEnabledForChannel(channel, eventType)) {
      return [];
    }

    const recipient = getRecipientForChannel(channel, payloadSnapshot);
    if (!recipient) {
      return [];
    }

    if (channel === "whatsapp" && !payloadSnapshot.whatsappOptIn) {
      return [];
    }

    return [{
      order_id: order.id,
      store_id: order.store_id,
      channel,
      event_type: eventType,
      provider,
      recipient,
      status: "queued",
      correlation_id: correlationId,
      source_event_id: sourceEventId || null,
      payload_snapshot: payloadSnapshot,
      metadata: {
        queued_at: queuedAt,
        scope: "transactional",
      },
    }];
  });
}

function getBackgroundRuntime() {
  const runtime = (
    globalThis as typeof globalThis & {
      EdgeRuntime?: { waitUntil?: (promise: Promise<unknown>) => void };
    }
  ).EdgeRuntime;

  if (typeof runtime?.waitUntil !== "function") {
    return null;
  }

  return {
    waitUntil: runtime.waitUntil.bind(runtime),
  };
}

function scheduleNotificationDispatch(
  supabase: any,
  reason: string,
) {
  const runtime = getBackgroundRuntime();
  if (!runtime) {
    log.warn("Background notification dispatch is unavailable", { reason });
    return false;
  }

  runtime.waitUntil(
    dispatchPendingNotifications({
      supabase,
      reason,
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      log.error("Background notification dispatch failed", {
        reason,
        error: message,
      });
    }),
  );

  return true;
}

async function markNotificationSent(
  supabase: any,
  notification: NotificationLogRecord,
  result: ProviderDispatchResult,
) {
  const metadata = mergeMetadata(notification.metadata, {
    last_provider_response: result.metadata || {},
    last_dispatched_at: result.sentAt || new Date().toISOString(),
  });

  const { error } = await supabase
    .from("notification_logs")
    .update({
      status: "sent",
      message_sid: result.messageSid || notification.message_sid,
      metadata,
      error_message: null,
      sent_at: notification.sent_at || result.sentAt ||
        new Date().toISOString(),
      processing_started_at: null,
      next_attempt_at: null,
    })
    .eq("id", notification.id);

  if (error) {
    throw new Error(`Failed to mark notification as sent: ${error.message}`);
  }
}

async function markWhatsAppProviderAttempt(
  supabase: any,
  notification: NotificationLogRecord,
  {
    normalizedRecipient,
    metadata: guardMetadata,
  }: {
    normalizedRecipient: string;
    metadata: Record<string, unknown>;
  },
) {
  const attemptedAt = new Date().toISOString();
  const metadata = mergeMetadata(notification.metadata, guardMetadata, {
    whatsapp_provider_attempted_at: attemptedAt,
  });

  const { error } = await supabase
    .from("notification_logs")
    .update({
      recipient: normalizedRecipient,
      metadata,
    })
    .eq("id", notification.id);

  if (error) {
    throw new Error(
      `Failed to record WhatsApp provider attempt: ${error.message}`,
    );
  }

  return {
    ...notification,
    recipient: normalizedRecipient,
    metadata,
  };
}

function toDispatchError(error: unknown) {
  if (error instanceof ProviderDispatchError) {
    return error;
  }

  return new ProviderDispatchError(
    error instanceof Error ? error.message : String(error),
    { retryable: true },
  );
}

async function markNotificationFailed(
  supabase: any,
  notification: NotificationLogRecord,
  error: unknown,
) {
  const dispatchError = toDispatchError(error);
  const attemptNumber = notification.dispatch_attempts || 1;
  const shouldRetry = dispatchError.retryable &&
    attemptNumber < NOTIFICATION_DISPATCH_MAX_ATTEMPTS;
  const nextAttemptAt = shouldRetry
    ? new Date(
      Date.now() + (getRetryDelaySeconds(attemptNumber) * 1000),
    ).toISOString()
    : null;
  const guardBlockReason =
    typeof dispatchError.metadata?.whatsapp_guard_block_reason === "string"
      ? dispatchError.metadata.whatsapp_guard_block_reason
      : null;

  const metadata = mergeMetadata(
    notification.metadata,
    guardBlockReason
      ? {
        whatsapp_guard_block_reason: guardBlockReason,
        whatsapp_guard_blocked_at:
          dispatchError.metadata?.whatsapp_guard_blocked_at ||
          new Date().toISOString(),
        whatsapp_guard_block_metadata: dispatchError.metadata || {},
      }
      : null,
    {
      last_dispatch_error: dispatchError.message,
      last_dispatch_error_at: new Date().toISOString(),
      last_dispatch_error_metadata: dispatchError.metadata || {},
    },
  );

  const { error: updateError } = await supabase
    .from("notification_logs")
    .update({
      status: "failed",
      error_message: dispatchError.message,
      metadata,
      failed_at: new Date().toISOString(),
      processing_started_at: null,
      next_attempt_at: nextAttemptAt,
    })
    .eq("id", notification.id);

  if (updateError) {
    throw new Error(
      `Failed to mark notification as failed: ${updateError.message}`,
    );
  }

  log.error("Notification dispatch failed", {
    notificationId: notification.id,
    orderId: notification.order_id,
    eventType: notification.event_type,
    channel: notification.channel,
    retryable: dispatchError.retryable,
    nextAttemptAt,
    error: dispatchError.message,
  });
}

async function dispatchNotificationLog(
  supabase: any,
  notification: NotificationLogRecord,
  runState: DispatchRunState,
) {
  const payload = coercePayloadSnapshot(notification.payload_snapshot);
  if (!payload) {
    await markNotificationFailed(
      supabase,
      notification,
      new ProviderDispatchError("Notification payload snapshot is missing", {
        retryable: false,
      }),
    );
    return;
  }

  let dispatchNotification = notification;

  if (notification.channel === "whatsapp") {
    const guardResult = await checkWhatsAppDispatchGuard({
      supabase,
      notification,
      payload,
      eventType: notification.event_type,
      runState: runState.whatsapp,
    });

    if (!guardResult.allowed) {
      await markNotificationFailed(
        supabase,
        notification,
        new ProviderDispatchError(
          `WhatsApp dispatch blocked: ${guardResult.reason}`,
          {
            retryable: false,
            metadata: guardResult.metadata,
          },
        ),
      );
      return;
    }

    dispatchNotification = await markWhatsAppProviderAttempt(
      supabase,
      notification,
      guardResult,
    );
    runState.whatsapp.whatsappProviderAttempts += 1;
  }

  const sender = getProviderSender(dispatchNotification);
  if (!sender) {
    await markNotificationFailed(
      supabase,
      dispatchNotification,
      new ProviderDispatchError("Notification provider is unavailable", {
        retryable: false,
      }),
    );
    return;
  }

  try {
    const result = await sender({
      notification: dispatchNotification,
      payload,
      eventType: dispatchNotification.event_type,
    });

    await markNotificationSent(supabase, dispatchNotification, result);
  } catch (error: unknown) {
    await markNotificationFailed(supabase, dispatchNotification, error);
  }
}

export async function dispatchPendingNotifications(
  {
    supabase,
    reason = "manual",
    batchSize = NOTIFICATION_DISPATCH_BATCH_SIZE,
    maxBatches = NOTIFICATION_DISPATCH_MAX_BATCHES_PER_RUN,
  }: {
    supabase: any;
    reason?: string;
    batchSize?: number;
    maxBatches?: number;
  },
) {
  let processed = 0;
  const runState: DispatchRunState = {
    whatsapp: {
      whatsappProviderAttempts: 0,
    },
  };

  for (let batchIndex = 0; batchIndex < maxBatches; batchIndex += 1) {
    const { data, error } = await supabase.rpc("claim_notification_logs", {
      p_limit: batchSize,
      p_processing_timeout_seconds: NOTIFICATION_PROCESSING_TIMEOUT_SECONDS,
    });

    if (error) {
      throw new Error(`Failed to claim notification logs: ${error.message}`);
    }

    const notifications = (data || []) as NotificationLogRecord[];
    if (!notifications.length) {
      break;
    }

    for (const notification of notifications) {
      await dispatchNotificationLog(supabase, notification, runState);
      processed += 1;
    }

    if (notifications.length < batchSize) {
      break;
    }
  }

  log.info("Notification dispatch sweep completed", {
    reason,
    processed,
  });

  return { processed };
}

export async function sendTransactionalNotifications({
  supabase,
  orderId,
  eventType,
  channels,
  correlationId,
  sourceEventId,
}: NotificationContext) {
  const order = await fetchOrderForNotifications(supabase, orderId);
  const resolvedCorrelationId = correlationId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(correlationId)
    ? correlationId
    : crypto.randomUUID();
  const queuedRows = buildQueuedNotificationRows(
    order,
    eventType,
    channels,
    resolvedCorrelationId,
    sourceEventId,
  );

  if (!queuedRows.length) {
    log.info("No transactional notifications queued for event", {
      orderId,
      eventType,
      channels,
    });
    return { queued: 0 };
  }

  const { error } = await supabase
    .from("notification_logs")
    .insert(queuedRows);

  if (error) {
    throw new Error(`Failed to queue notifications: ${error.message}`);
  }

  scheduleNotificationDispatch(supabase, `event:${eventType}`);

  return { queued: queuedRows.length };
}

export async function sendTransactionalNotificationsBestEffort(
  {
    functionName,
    operation,
    metadata,
    ...notificationContext
  }: BestEffortNotificationContext,
  {
    logger: bestEffortLogger = log,
    queueNotifications = sendTransactionalNotifications,
  }: BestEffortNotificationOptions = {},
): Promise<BestEffortNotificationResult> {
  try {
    await queueNotifications(notificationContext);
    return { queued: true };
  } catch (error: unknown) {
    const errorMessage = normalizeNotificationQueueError(error);
    bestEffortLogger.error("Transactional notification queueing failed", {
      functionName,
      operation,
      orderId: notificationContext.orderId,
      eventType: notificationContext.eventType,
      correlationId: notificationContext.correlationId || null,
      sourceEventId: notificationContext.sourceEventId || null,
      error: errorMessage,
      metadata: metadata || {},
    });

    return { queued: false, error: errorMessage };
  }
}

export async function applyWebhookStatusToNotification(
  {
    supabase,
    channel,
    messageSid,
    status,
    provider,
    occurredAt,
    errorMessage,
    metadata,
  }: {
    supabase: any;
    channel: "email" | "whatsapp";
    messageSid: string;
    status: DeliveryStatus;
    provider: string;
    occurredAt?: string | null;
    errorMessage?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const { data: notification, error } = await supabase
    .from("notification_logs")
    .select(
      "id, order_id, store_id, channel, event_type, provider, recipient, status, message_sid, error_message, metadata, payload_snapshot, dispatch_attempts, correlation_id, source_event_id, sent_at, delivered_at, failed_at",
    )
    .eq("message_sid", messageSid)
    .eq("channel", channel)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load notification log: ${error.message}`);
  }

  if (!notification) {
    return { matched: false };
  }

  const existingNotification = notification as NotificationLogRecord;
  const currentRank = statusRank(existingNotification.status);
  const incomingRank = statusRank(status);

  if (incomingRank < currentRank && status !== "failed") {
    return { matched: true, skipped: true };
  }

  const timestamp = occurredAt || new Date().toISOString();
  const mergedMetadata = mergeMetadata(existingNotification.metadata, {
    last_provider_webhook_at: timestamp,
    last_provider_webhook_status: status,
    last_provider_webhook_payload: metadata || {},
    provider,
  });

  const updates: Record<string, unknown> = {
    status,
    provider,
    error_message: status === "failed"
      ? errorMessage || "Delivery failed"
      : null,
    metadata: mergedMetadata,
  };

  if (status === "sent") {
    updates.sent_at = existingNotification.sent_at || timestamp;
  }

  if (status === "delivered" || status === "read") {
    updates.sent_at = existingNotification.sent_at || timestamp;
    updates.delivered_at = existingNotification.delivered_at || timestamp;
  }

  if (status === "failed") {
    updates.failed_at = existingNotification.failed_at || timestamp;
  }

  const { error: updateError } = await supabase
    .from("notification_logs")
    .update(updates)
    .eq("id", existingNotification.id);

  if (updateError) {
    throw new Error(
      `Failed to update notification delivery status: ${updateError.message}`,
    );
  }

  return { matched: true, notificationId: existingNotification.id };
}
