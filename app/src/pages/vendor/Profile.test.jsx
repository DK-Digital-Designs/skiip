import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VendorProfile from './Profile';
import { AuthService } from '../../lib/services/auth.service';
import { StoreService } from '../../lib/services/store.service';

const addToast = vi.fn();
const uploadedUrl = 'https://example.supabase.co/storage/v1/object/public/product-images/products/store-1/vendor.png';

vi.mock('../../lib/supabase', () => ({
    isSupabaseConfigured: () => true,
}));

vi.mock('../../lib/services/auth.service', () => ({
    AuthService: {
        getSession: vi.fn(),
    },
}));

vi.mock('../../lib/services/store.service', () => ({
    StoreService: {
        getStoreByUserId: vi.fn(),
        updateMyStoreProfile: vi.fn(),
    },
}));

vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ addToast }),
}));

vi.mock('../../components/vendor/ProductImageUpload', () => ({
    default: ({ label, onUpload }) => (
        <button type="button" onClick={() => onUpload(uploadedUrl)}>
            Upload {label}
        </button>
    ),
}));

describe('VendorProfile image upload reuse', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        AuthService.getSession.mockResolvedValue({ user: { id: 'seller-1' } });
        StoreService.getStoreByUserId.mockResolvedValue({
            id: 'store-1',
            name: 'Test Vendor',
            description: 'Food stall',
            logo_url: '',
            pickup_location: 'Stall 1',
            tags: ['Mains'],
        });
        StoreService.updateMyStoreProfile.mockImplementation(async (payload) => ({
            id: 'store-1',
            logo_url: payload.logoUrl,
            pickup_location: payload.pickupLocation,
            ...payload,
        }));
    });

    it('populates the vendor image URL and persists it only when Save profile is used', async () => {
        render(
            <MemoryRouter>
                <VendorProfile />
            </MemoryRouter>
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Upload Vendor image' }));

        expect(screen.getByLabelText('Image URL')).toHaveValue(uploadedUrl);
        expect(StoreService.updateMyStoreProfile).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));

        await waitFor(() => expect(StoreService.updateMyStoreProfile).toHaveBeenCalledWith(expect.objectContaining({
            logoUrl: uploadedUrl,
        })));
    });
});
