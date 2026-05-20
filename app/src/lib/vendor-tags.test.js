import { describe, expect, it } from 'vitest';
import {
    getOrderableVendors,
    getVendorPaymentLabel,
    getVendorTags,
    isVendorReadyForOrders,
    normalizeVendorTags,
} from './vendor-tags';

describe('vendor tag helpers', () => {
    it('normalizes comma separated vendor tags', () => {
        expect(normalizeVendorTags('Burgers, Chicken, Burgers, A very long vendor tag')).toEqual([
            'Burgers',
            'Chicken',
            'A very long vendor tag',
        ]);
    });

    it('infers helpful fallback tags from vendor copy', () => {
        expect(getVendorTags({ name: 'Main Bar', description: 'Cocktails and cold beer' })).toContain('Bar');
    });

    it('falls back safely when vendor tags are missing or null', () => {
        expect(getVendorTags(null)).toEqual(['Food']);
        expect(getVendorTags({ tags: null })).toEqual(['Food']);
        expect(getVendorTags({ name: 'Chicken Shack', tags: [] })).toContain('Chicken');
    });
});

describe('vendor payment helpers', () => {
    it('detects ready vendors', () => {
        expect(isVendorReadyForOrders({ stripe_connect_status: 'ready' })).toBe(true);
        expect(isVendorReadyForOrders({ stripe_connect_status: 'pending_verification' })).toBe(false);
    });

    it('labels vendors that are still setting up payments', () => {
        expect(getVendorPaymentLabel({ stripe_connect_status: 'not_started' })).toBe('Setting up payments');
    });

    it('filters buyer-visible vendors to payment-ready stores', () => {
        expect(getOrderableVendors([
            { id: 'ready', stripe_connect_status: 'ready' },
            { id: 'pending', stripe_connect_status: 'pending_verification' },
            { id: 'legacy-ready', stripe_onboarding_complete: true },
        ]).map((vendor) => vendor.id)).toEqual(['ready', 'legacy-ready']);
    });
});
