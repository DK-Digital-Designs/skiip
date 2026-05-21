import { beforeEach, describe, expect, it, vi } from 'vitest';
import { track } from '@vercel/analytics';
import {
    captureAnalyticsAttribution,
    getCampaignLabel,
    trackSkiipEvent,
    trackSkiipEventOnce,
} from './analytics';

vi.mock('@vercel/analytics', () => ({
    track: vi.fn(),
}));

describe('analytics helpers', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        window.history.replaceState({}, '', '/');
        vi.clearAllMocks();
    });

    it('captures UTM attribution from query params before a hash route', () => {
        window.history.replaceState({}, '', '/?utm_source=poster&utm_medium=qr&utm_campaign=sawft_launch&utm_content=burger_bliss#/order/vendor/1');

        captureAnalyticsAttribution();

        expect(getCampaignLabel()).toBe('poster/qr/sawft_launch/burger_bliss');
    });

    it('captures UTM attribution from hash route query params', () => {
        window.history.replaceState({}, '', '/#/order?utm_source=instagram&utm_campaign=sawft_launch');

        captureAnalyticsAttribution();

        expect(getCampaignLabel()).toBe('instagram/sawft_launch');
    });

    it('adds campaign attribution while keeping custom events small', () => {
        window.history.replaceState({}, '', '/?utm_source=poster&utm_campaign=sawft_launch');
        captureAnalyticsAttribution();

        trackSkiipEvent('menu_item_added', { item: '1:Classic Burger', ignored: 'not sent' });

        expect(track).toHaveBeenCalledWith('menu_item_added', {
            item: '1:Classic_Burger',
            campaign: 'poster/sawft_launch',
        });
    });

    it('deduplicates one-shot events within a session', () => {
        trackSkiipEventOnce('checkout_completed:123', 'checkout_completed', { status: 'stripe_success' });
        trackSkiipEventOnce('checkout_completed:123', 'checkout_completed', { status: 'stripe_success' });

        expect(track).toHaveBeenCalledTimes(1);
    });
});
