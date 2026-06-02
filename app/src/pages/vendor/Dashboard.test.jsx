import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VendorDashboard from './Dashboard';

const mockAddToast = vi.fn();
const mockMutate = vi.fn();
const mockFetchOrders = vi.fn().mockResolvedValue({});

let mockOrders = [];

vi.mock('../../lib/supabase', () => {
    const channelApi = {
        on: vi.fn(() => channelApi),
        subscribe: vi.fn(() => ({ unsubscribe: vi.fn() })),
    };

    return {
        isSupabaseConfigured: () => true,
        supabase: {
            channel: vi.fn(() => channelApi),
        },
    };
});

vi.mock('../../lib/services/auth.service', () => ({
    AuthService: {
        getSession: vi.fn().mockResolvedValue({ user: { id: 'seller-1' } }),
        signOut: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('../../lib/services/store.service', () => ({
    StoreService: {
        getStoreByUserId: vi.fn().mockResolvedValue({
            id: 'store-1',
            name: 'Burger Bliss',
            stripe_connect_status: 'ready',
        }),
    },
}));

vi.mock('../../lib/services/stripe.service', () => ({
    StripeService: {
        reconcileConnectStatus: vi.fn(),
        createOnboardingLink: vi.fn(),
    },
}));

vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ addToast: mockAddToast }),
}));

vi.mock('../../lib/hooks/useOrders', () => ({
    useStoreOrders: vi.fn(() => ({
        data: mockOrders,
        refetch: mockFetchOrders,
        isLoading: false,
        isError: false,
    })),
    useUpdateOrderStatus: vi.fn(() => ({
        mutate: mockMutate,
    })),
}));

function renderDashboard() {
    return render(
        <MemoryRouter>
            <VendorDashboard />
        </MemoryRouter>
    );
}

describe('VendorDashboard new order banner', () => {
    beforeEach(() => {
        mockOrders = [];
        mockAddToast.mockClear();
        mockMutate.mockClear();
        mockFetchOrders.mockClear();
        global.Audio = class {
            play = vi.fn().mockResolvedValue(undefined);
        };
    });

    it('shows and clears the unseen order banner as new orders arrive', async () => {
        mockOrders = [
            {
                id: 'order-1',
                status: 'paid',
                payment_status: 'succeeded',
                created_at: '2026-06-02T10:00:00.000Z',
                total: 21.5,
                subtotal: 20,
                tip_amount: 0,
                service_fee: 1.5,
                order_items: [{ quantity: 2, price: 10, product_snapshot: { name: 'Burger' } }],
            },
        ];

        const view = renderDashboard();

        await screen.findByText('Burger Bliss');
        expect(screen.queryByText(/new order/i)).not.toBeInTheDocument();

        mockOrders = [
            ...mockOrders,
            {
                id: 'order-2',
                status: 'paid',
                payment_status: 'succeeded',
                created_at: '2026-06-02T10:05:00.000Z',
                total: 13.5,
                subtotal: 12,
                tip_amount: 0,
                service_fee: 1.5,
                order_items: [{ quantity: 1, price: 12, product_snapshot: { name: 'Wrap' } }],
            },
        ];

        view.rerender(
            <MemoryRouter>
                <VendorDashboard />
            </MemoryRouter>
        );

        expect(await screen.findByText('1 new order')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Refresh orders' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Refresh orders' }));

        await waitFor(() => {
            expect(mockFetchOrders).toHaveBeenCalled();
            expect(screen.queryByText('1 new order')).not.toBeInTheDocument();
        });
    });
});
