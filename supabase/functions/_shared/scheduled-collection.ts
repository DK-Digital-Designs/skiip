export const DEFAULT_SCHEDULED_COLLECTION_TIMEZONE = "Europe/London";

export interface ScheduledCollectionInput {
  scheduled_collection_at?: unknown;
  scheduled_collection_timezone?: unknown;
}

export interface NormalizedScheduledCollection {
  scheduled_collection_at: string | null;
  scheduled_collection_timezone: typeof DEFAULT_SCHEDULED_COLLECTION_TIMEZONE;
}

function isMissing(value: unknown) {
  return value === undefined ||
    value === null ||
    (typeof value === "string" && value.trim() === "");
}

export function normalizeScheduledCollection(
  input: ScheduledCollectionInput = {},
  now = new Date(),
): NormalizedScheduledCollection {
  const timezone = isMissing(input.scheduled_collection_timezone)
    ? DEFAULT_SCHEDULED_COLLECTION_TIMEZONE
    : String(input.scheduled_collection_timezone).trim();

  if (timezone !== DEFAULT_SCHEDULED_COLLECTION_TIMEZONE) {
    throw new Error("Scheduled collection timezone must be Europe/London");
  }

  if (isMissing(input.scheduled_collection_at)) {
    return {
      scheduled_collection_at: null,
      scheduled_collection_timezone: DEFAULT_SCHEDULED_COLLECTION_TIMEZONE,
    };
  }

  if (typeof input.scheduled_collection_at !== "string") {
    throw new Error("scheduled_collection_at must be an ISO date/time string");
  }

  const scheduledAt = new Date(input.scheduled_collection_at);
  if (!Number.isFinite(scheduledAt.getTime())) {
    throw new Error("scheduled_collection_at must be a valid ISO date/time");
  }

  if (scheduledAt.getTime() <= now.getTime()) {
    throw new Error("Scheduled collection time must be in the future");
  }

  return {
    scheduled_collection_at: scheduledAt.toISOString(),
    scheduled_collection_timezone: DEFAULT_SCHEDULED_COLLECTION_TIMEZONE,
  };
}
