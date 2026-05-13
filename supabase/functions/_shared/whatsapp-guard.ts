import {
  getConfiguredEnv,
  getRuntimeEnvironment,
  getWhatsAppAllowLiveNonProd,
  getWhatsAppDailySendLimit,
  getWhatsAppPerDispatchLimit,
  getWhatsAppSendMode,
  isEventEnabledForChannel,
} from "./notification-config.ts";
import type {
  NotificationEvent,
  NotificationLogRecord,
  NotificationPayloadSnapshot,
} from "./notification-types.ts";

export type WhatsAppGuardBlockReason =
  | "guard_disabled"
  | "guard_not_allowlisted"
  | "guard_daily_cap_reached"
  | "guard_dispatch_cap_reached"
  | "guard_duplicate_logical_event"
  | "guard_ineligible_event"
  | "guard_missing_opt_in"
  | "guard_invalid_recipient"
  | "guard_live_blocked_non_prod";

export type WhatsAppDispatchRunState = {
  whatsappProviderAttempts: number;
};

export type WhatsAppDispatchGuardResult =
  | {
    allowed: true;
    normalizedRecipient: string;
    metadata: Record<string, unknown>;
  }
  | {
    allowed: false;
    reason: WhatsAppGuardBlockReason;
    metadata: Record<string, unknown>;
  };

type NotificationAttemptRecord = Pick<
  NotificationLogRecord,
  | "id"
  | "status"
  | "message_sid"
  | "metadata"
  | "order_id"
  | "event_type"
  | "recipient"
>;

type SupabaseErrorLike = {
  message: string;
};

type SupabaseQueryResult<T> = {
  data: T[] | null;
  error: SupabaseErrorLike | null;
};

type SupabaseQueryLike<T> = PromiseLike<SupabaseQueryResult<T>> & {
  select(columns: string): SupabaseQueryLike<T>;
  eq(field: string, value: unknown): SupabaseQueryLike<T>;
  neq(field: string, value: unknown): SupabaseQueryLike<T>;
  gte(field: string, value: string): SupabaseQueryLike<T>;
};

export type SupabaseNotificationLogClient = {
  from(
    table: "notification_logs",
  ): SupabaseQueryLike<NotificationAttemptRecord>;
};

function getDefaultCountryCode() {
  const configuredCountryCode = (
    getConfiguredEnv("WHATSAPP_DEFAULT_COUNTRY_CODE") || "44"
  )
    .trim()
    .replace(/^\+/, "");

  if (!/^\d{1,3}$/.test(configuredCountryCode)) {
    return null;
  }

  return configuredCountryCode;
}

export function normalizeWhatsAppPhone(
  customerPhone: string | null | undefined,
) {
  if (!customerPhone) {
    return null;
  }

  const stripped = customerPhone.trim().replace(/[\s\-()]/g, "");
  const hasExplicitCountryCode = stripped.startsWith("+") ||
    stripped.startsWith("00");
  const defaultCountryCode = getDefaultCountryCode();

  if (!defaultCountryCode) {
    return null;
  }

  let normalized = stripped;

  if (stripped.startsWith("+")) {
    normalized = stripped.slice(1);
  } else if (stripped.startsWith("00")) {
    normalized = stripped.slice(2);
  }

  if (!normalized) {
    return null;
  }

  if (!hasExplicitCountryCode) {
    if (normalized.startsWith("0")) {
      normalized = `${defaultCountryCode}${normalized.slice(1)}`;
    } else if (!normalized.startsWith(defaultCountryCode)) {
      return null;
    }
  }

  if (
    /\D/.test(normalized) || normalized.length < 8 || normalized.length > 15
  ) {
    return null;
  }

  return `+${normalized}`;
}

function parseAllowlistedRecipients() {
  const rawValue = getConfiguredEnv("WHATSAPP_ALLOWED_RECIPIENTS");
  if (!rawValue) {
    return new Set<string>();
  }

  return new Set(
    rawValue
      .split(",")
      .map((value) => normalizeWhatsAppPhone(value))
      .filter((value): value is string => Boolean(value)),
  );
}

function isProductionEnvironment() {
  return ["production", "prod"].includes(getRuntimeEnvironment());
}

function getUtcDayStartIso() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

function hasOperatorRequeueApproval(record: NotificationAttemptRecord) {
  return record.metadata?.whatsapp_operator_requeue_approved === true ||
    typeof record.metadata?.whatsapp_operator_requeue_approved_at === "string";
}

function hasWhatsAppProviderAttempt(record: NotificationAttemptRecord) {
  if (typeof record.metadata?.whatsapp_provider_attempted_at === "string") {
    return true;
  }

  if (record.message_sid) {
    return true;
  }

  return ["sent", "delivered", "read"].includes(record.status || "");
}

async function countDailyProviderAttempts(
  supabase: SupabaseNotificationLogClient,
) {
  const { data, error } = await supabase
    .from("notification_logs")
    .select(
      "id, status, message_sid, metadata, order_id, event_type, recipient",
    )
    .eq("channel", "whatsapp")
    .gte("created_at", getUtcDayStartIso());

  if (error) {
    throw new Error(
      `Failed to count WhatsApp notification attempts: ${error.message}`,
    );
  }

  return ((data || []) as NotificationAttemptRecord[]).filter(
    hasWhatsAppProviderAttempt,
  ).length;
}

async function hasDuplicateProviderAttempt(
  supabase: SupabaseNotificationLogClient,
  notification: NotificationLogRecord,
  normalizedRecipient: string,
) {
  if (hasWhatsAppProviderAttempt(notification)) {
    return !hasOperatorRequeueApproval(notification);
  }

  const { data, error } = await supabase
    .from("notification_logs")
    .select(
      "id, status, message_sid, metadata, order_id, event_type, recipient",
    )
    .eq("channel", "whatsapp")
    .eq("order_id", notification.order_id)
    .eq("event_type", notification.event_type)
    .neq("id", notification.id);

  if (error) {
    throw new Error(
      `Failed to check WhatsApp duplicate attempts: ${error.message}`,
    );
  }

  return ((data || []) as NotificationAttemptRecord[]).some(
    (record) =>
      normalizeWhatsAppPhone(record.recipient) === normalizedRecipient &&
      hasWhatsAppProviderAttempt(record) &&
      !hasOperatorRequeueApproval(record),
  );
}

function blocked(
  reason: WhatsAppGuardBlockReason,
  metadata: Record<string, unknown>,
): WhatsAppDispatchGuardResult {
  return {
    allowed: false,
    reason,
    metadata: {
      ...metadata,
      whatsapp_guard_block_reason: reason,
      whatsapp_guard_blocked_at: new Date().toISOString(),
    },
  };
}

export async function checkWhatsAppDispatchGuard({
  supabase,
  notification,
  payload,
  eventType,
  runState,
}: {
  supabase: SupabaseNotificationLogClient;
  notification: NotificationLogRecord;
  payload: NotificationPayloadSnapshot;
  eventType: NotificationEvent;
  runState: WhatsAppDispatchRunState;
}): Promise<WhatsAppDispatchGuardResult> {
  const sendMode = getWhatsAppSendMode();
  const dailySendLimit = getWhatsAppDailySendLimit();
  const perDispatchLimit = getWhatsAppPerDispatchLimit();
  const baseMetadata = {
    whatsapp_send_mode: sendMode,
    whatsapp_runtime_environment: getRuntimeEnvironment(),
    whatsapp_daily_send_limit: dailySendLimit,
    whatsapp_per_dispatch_limit: perDispatchLimit,
  };

  if (
    !isEventEnabledForChannel("whatsapp", eventType) ||
    eventType !== "order_ready"
  ) {
    return blocked("guard_ineligible_event", {
      ...baseMetadata,
      eventType,
    });
  }

  if (!payload.whatsappOptIn) {
    return blocked("guard_missing_opt_in", baseMetadata);
  }

  const normalizedRecipient = normalizeWhatsAppPhone(
    payload.customerPhone || notification.recipient,
  );
  if (!normalizedRecipient) {
    return blocked("guard_invalid_recipient", {
      ...baseMetadata,
      recipient: notification.recipient || null,
    });
  }

  if (sendMode === "disabled") {
    return blocked("guard_disabled", {
      ...baseMetadata,
      normalizedRecipient,
    });
  }

  if (
    sendMode === "live" &&
    !isProductionEnvironment() &&
    !getWhatsAppAllowLiveNonProd()
  ) {
    return blocked("guard_live_blocked_non_prod", {
      ...baseMetadata,
      normalizedRecipient,
    });
  }

  if (sendMode === "allowlist") {
    const allowlistedRecipients = parseAllowlistedRecipients();
    if (!allowlistedRecipients.has(normalizedRecipient)) {
      return blocked("guard_not_allowlisted", {
        ...baseMetadata,
        normalizedRecipient,
        allowlistConfigured: allowlistedRecipients.size > 0,
      });
    }
  }

  const dailyAttempts = await countDailyProviderAttempts(supabase);
  if (dailyAttempts >= dailySendLimit) {
    return blocked("guard_daily_cap_reached", {
      ...baseMetadata,
      normalizedRecipient,
      dailyAttempts,
    });
  }

  if (runState.whatsappProviderAttempts >= perDispatchLimit) {
    return blocked("guard_dispatch_cap_reached", {
      ...baseMetadata,
      normalizedRecipient,
      dispatchAttempts: runState.whatsappProviderAttempts,
    });
  }

  if (
    await hasDuplicateProviderAttempt(
      supabase,
      notification,
      normalizedRecipient,
    )
  ) {
    return blocked("guard_duplicate_logical_event", {
      ...baseMetadata,
      normalizedRecipient,
    });
  }

  return {
    allowed: true,
    normalizedRecipient,
    metadata: {
      ...baseMetadata,
      normalizedRecipient,
      whatsapp_guard_allowed_at: new Date().toISOString(),
    },
  };
}
