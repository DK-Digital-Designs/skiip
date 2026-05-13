import { describe, expect, it } from 'vitest';
import { DEFAULT_LAUNCH_EVENT, normalizeLaunchEvent } from './launch-event';

describe('normalizeLaunchEvent', () => {
    it('uses defaults for missing launch event copy', () => {
        expect(normalizeLaunchEvent({})).toEqual(DEFAULT_LAUNCH_EVENT);
    });

    it('falls back landing title and subtitle from buyer copy', () => {
        expect(normalizeLaunchEvent({
            label: 'Tonight',
            title: 'Launch Night',
            subtitle: 'Order from the current stalls.',
        })).toMatchObject({
            label: 'Tonight',
            title: 'Launch Night',
            subtitle: 'Order from the current stalls.',
            landingTitle: 'Launch Night',
            landingSubtitle: 'Order from the current stalls.',
        });
    });
});
