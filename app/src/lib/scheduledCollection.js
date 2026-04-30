export const DEFAULT_SCHEDULED_COLLECTION_TIMEZONE = 'Europe/London';

function parseDateTimeLocal(value) {
  if (typeof value !== 'string') return null;

  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;

  const [, year, month, day, hour, minute] = match.map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  if (
    utcGuess.getUTCFullYear() !== year ||
    utcGuess.getUTCMonth() !== month - 1 ||
    utcGuess.getUTCDate() !== day ||
    utcGuess.getUTCHours() !== hour ||
    utcGuess.getUTCMinutes() !== minute
  ) {
    return null;
  }

  return { year, month, day, hour, minute };
}

function getTimeZoneParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
}

function getTimeZoneOffsetMs(date, timeZone) {
  const parts = getTimeZoneParts(date, timeZone);
  const zonedAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return zonedAsUtc - date.getTime();
}

export function collectionInputToIso(value, timeZone = DEFAULT_SCHEDULED_COLLECTION_TIMEZONE) {
  const parts = parseDateTimeLocal(value);
  if (!parts) return null;

  const utcWallTime = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const firstPass = new Date(utcWallTime - getTimeZoneOffsetMs(new Date(utcWallTime), timeZone));
  const secondPass = new Date(utcWallTime - getTimeZoneOffsetMs(firstPass, timeZone));

  return secondPass.toISOString();
}

export function toScheduledCollectionPayload(
  collectionInput,
  now = new Date(),
  timeZone = DEFAULT_SCHEDULED_COLLECTION_TIMEZONE
) {
  if (!collectionInput) {
    return {
      scheduled_collection_at: null,
      scheduled_collection_timezone: DEFAULT_SCHEDULED_COLLECTION_TIMEZONE,
    };
  }

  if (timeZone !== DEFAULT_SCHEDULED_COLLECTION_TIMEZONE) {
    throw new Error('Scheduled collection timezone must be Europe/London');
  }

  const scheduledIso = collectionInputToIso(collectionInput, timeZone);
  if (!scheduledIso) {
    throw new Error('Choose a valid scheduled collection time.');
  }

  if (new Date(scheduledIso).getTime() <= now.getTime()) {
    throw new Error('Choose a scheduled collection time in the future.');
  }

  return {
    scheduled_collection_at: scheduledIso,
    scheduled_collection_timezone: DEFAULT_SCHEDULED_COLLECTION_TIMEZONE,
  };
}

export function getScheduledCollectionLabel(order) {
  const scheduledAt = order?.scheduled_collection_at;
  if (!scheduledAt) return '';

  const date = new Date(scheduledAt);
  if (!Number.isFinite(date.getTime())) return '';

  const timeZone = order.scheduled_collection_timezone || DEFAULT_SCHEDULED_COLLECTION_TIMEZONE;
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);

  return `${formatted} UK time`;
}

export function getMinimumScheduledCollectionInputValue(now = new Date()) {
  const future = new Date(now.getTime() + 60 * 1000);
  const parts = getTimeZoneParts(future, DEFAULT_SCHEDULED_COLLECTION_TIMEZONE);

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
