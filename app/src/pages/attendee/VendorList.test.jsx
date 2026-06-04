import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VendorList from './VendorList';

vi.mock('../../lib/supabase', () => ({
    isSupabaseConfigured: () => false,
}));

vi.mock('../../lib/hooks/useMenu', () => ({
    useStores: () => ({ data: [], isLoading: false }),
}));

vi.mock('../../lib/services/settings.service', () => ({
    SettingsService: {
        getLaunchEvent: vi.fn().mockResolvedValue({
            label: 'Test event',
            title: 'Test event',
            subtitle: 'Test event subtitle',
        }),
    },
}));

vi.mock('../../lib/analytics', () => ({
    trackSkiipEvent: vi.fn(),
}));

describe('VendorList pilot labels', () => {
    it('uses neutral Open labels without claiming a vendor is trending', async () => {
        render(
            <MemoryRouter>
                <VendorList />
            </MemoryRouter>
        );

        expect(await screen.findAllByText('Open')).toHaveLength(3);
        expect(screen.queryByText('Trending')).not.toBeInTheDocument();
        expect(screen.getAllByText('Mains').length).toBeGreaterThanOrEqual(2);
    });
});
