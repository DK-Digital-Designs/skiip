import {
  DEFAULT_SCHEDULED_COLLECTION_TIMEZONE,
  collectionInputToIso,
  getScheduledCollectionLabel,
  toScheduledCollectionPayload,
} from './scheduledCollection';
import { normalizeScheduledCollection } from '../../../supabase/functions/_shared/scheduled-collection.ts';

describe('scheduled collection helpers', () => {
  it('keeps immediate orders compatible with a null scheduled payload', () => {
    expect(toScheduledCollectionPayload('')).toEqual({
      scheduled_collection_at: null,
      scheduled_collection_timezone: DEFAULT_SCHEDULED_COLLECTION_TIMEZONE,
    });

    expect(normalizeScheduledCollection({}, new Date('2026-04-28T12:00:00.000Z'))).toEqual({
      scheduled_collection_at: null,
      scheduled_collection_timezone: DEFAULT_SCHEDULED_COLLECTION_TIMEZONE,
    });
  });

  it('converts UK local collection input to an ISO instant', () => {
    expect(collectionInputToIso('2026-05-12T18:30')).toBe('2026-05-12T17:30:00.000Z');
    expect(collectionInputToIso('2026-12-12T18:30')).toBe('2026-12-12T18:30:00.000Z');
  });

  it('rejects invalid scheduled collection values', () => {
    expect(() =>
      toScheduledCollectionPayload('not-a-date', new Date('2026-04-28T12:00:00.000Z'))
    ).toThrow('Choose a valid scheduled collection time.');

    expect(() =>
      toScheduledCollectionPayload('2026-04-28T10:00', new Date('2026-04-28T12:00:00.000Z'))
    ).toThrow('Choose a scheduled collection time in the future.');

    expect(() =>
      normalizeScheduledCollection(
        {
          scheduled_collection_at: 'not-a-date',
          scheduled_collection_timezone: DEFAULT_SCHEDULED_COLLECTION_TIMEZONE,
        },
        new Date('2026-04-28T12:00:00.000Z')
      )
    ).toThrow('scheduled_collection_at must be a valid ISO date/time');
  });

  it('keeps launch timezone fixed to Europe/London', () => {
    expect(() =>
      normalizeScheduledCollection(
        {
          scheduled_collection_at: '2026-05-12T17:30:00.000Z',
          scheduled_collection_timezone: 'UTC',
        },
        new Date('2026-04-28T12:00:00.000Z')
      )
    ).toThrow('Scheduled collection timezone must be Europe/London');
  });

  it('formats scheduled collection labels in UK time', () => {
    expect(
      getScheduledCollectionLabel({
        scheduled_collection_at: '2026-05-12T17:30:00.000Z',
        scheduled_collection_timezone: DEFAULT_SCHEDULED_COLLECTION_TIMEZONE,
      })
    ).toBe('12 May 2026, 18:30 UK time');
  });
});
