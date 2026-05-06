import { logger } from "./logger.ts";
import {
  NOTIFICATION_EVENTS,
  type NotificationChannel,
  type NotificationEvent,
} from "./notification-types.ts";

const log = logger("notification-config");

const CHANNEL_PROVIDER_DEFAULTS: Record<NotificationChannel, string> = {
  email: "resend",
  whatsapp: "twilio",
  sms: "twilio",
};

const CHANNEL_PROVIDER_KEYS: Record<NotificationChannel, string> = {
  email: "EMAIL_PROVIDER",
  whatsapp: "WHATSAPP_PROVIDER",
  sms: "SMS_PROVIDER",
};

const SUPPORTED_CHANNEL_PROVIDERS: Record<NotificationChannel, Set<string>> = {
  email: new Set(["resend"]),
  whatsapp: new Set(["twilio"]),
  sms: new Set(["twilio"]),
};

function parsePositiveInteger(
  rawValue: string | undefined,
  key: string,
  fallback: number,
) {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    log.warn("Invalid notification configuration value", {
      key,
      rawValue,
      fallback,
    });
    return fallback;
  }

  return parsed;
}

function parseEventList(key: string, defaults: NotificationEvent[]) {
  const rawValue = getConfiguredEnv(key);
  if (!rawValue) {
    return new Set(defaults);
  }

  const parsed = rawValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const enabledEvents = new Set<NotificationEvent>();
  for (const eventName of parsed) {
    if ((NOTIFICATION_EVENTS as readonly string[]).includes(eventName)) {
      enabledEvents.add(eventName as NotificationEvent);
      continue;
    }

    log.warn("Ignoring unsupported notification event name", {
      key,
      eventName,
    });
  }

  return enabledEvents.size ? enabledEvents : new Set(defaults);
}

export function getConfiguredEnv(...keys: string[]) {
  for (const key of keys) {
    const value = Deno.env.get(key)?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getConfiguredProvider(channel: NotificationChannel) {
  const rawProvider =
    getConfiguredEnv(CHANNEL_PROVIDER_KEYS[channel]) ||
    CHANNEL_PROVIDER_DEFAULTS[channel];
  const provider = rawProvider.trim().toLowerCase();

  if (SUPPORTED_CHANNEL_PROVIDERS[channel].has(provider)) {
    return provider;
  }

  log.warn("Ignoring unsupported notification provider", {
    channel,
    provider,
  });
  return null;
}

export function isEventEnabledForChannel(
  channel: NotificationChannel,
  eventType: NotificationEvent,
) {
  if (channel === "email") {
    return EMAIL_NOTIFICATION_EVENTS.has(eventType);
  }

  if (channel === "whatsapp") {
    return WHATSAPP_NOTIFICATION_EVENTS.has(eventType);
  }

  return false;
}

export function getNotificationUserAgent() {
  return "skiip-notifications/1.0";
}

export function getRetryDelaySeconds(attemptNumber: number) {
  return NOTIFICATION_RETRY_BASE_DELAY_SECONDS *
    2 ** Math.max(attemptNumber - 1, 0);
}

export const EMAIL_NOTIFICATION_EVENTS = parseEventList(
  "EMAIL_NOTIFICATION_EVENTS",
  [...NOTIFICATION_EVENTS],
);

export const WHATSAPP_NOTIFICATION_EVENTS = parseEventList(
  "WHATSAPP_NOTIFICATION_EVENTS",
  ["order_ready"],
);

export const NOTIFICATION_DISPATCH_BATCH_SIZE = parsePositiveInteger(
  getConfiguredEnv("NOTIFICATION_DISPATCH_BATCH_SIZE"),
  "NOTIFICATION_DISPATCH_BATCH_SIZE",
  10,
);

export const NOTIFICATION_DISPATCH_MAX_BATCHES_PER_RUN = parsePositiveInteger(
  getConfiguredEnv("NOTIFICATION_DISPATCH_MAX_BATCHES_PER_RUN"),
  "NOTIFICATION_DISPATCH_MAX_BATCHES_PER_RUN",
  3,
);

export const NOTIFICATION_DISPATCH_MAX_ATTEMPTS = parsePositiveInteger(
  getConfiguredEnv("NOTIFICATION_DISPATCH_MAX_ATTEMPTS"),
  "NOTIFICATION_DISPATCH_MAX_ATTEMPTS",
  3,
);

export const NOTIFICATION_PROCESSING_TIMEOUT_SECONDS = parsePositiveInteger(
  getConfiguredEnv("NOTIFICATION_PROCESSING_TIMEOUT_SECONDS"),
  "NOTIFICATION_PROCESSING_TIMEOUT_SECONDS",
  300,
);

export const NOTIFICATION_RETRY_BASE_DELAY_SECONDS = parsePositiveInteger(
  getConfiguredEnv("NOTIFICATION_RETRY_BASE_DELAY_SECONDS"),
  "NOTIFICATION_RETRY_BASE_DELAY_SECONDS",
  60,
);
