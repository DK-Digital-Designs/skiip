import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Checkout from './Checkout';
import { useCart } from '../../lib/hooks/useCart';
import { useAuth } from '../../lib/context/AuthContext';

vi.mock('../../lib/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../lib/hooks/useCart', () => ({
    useCart: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
    isSupabaseConfigured: () => false,
}));

vi.mock('../../lib/analytics', () => ({
    trackSkiipEvent: vi.fn(),
}));

vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ addToast: vi.fn() }),
}));

function renderCheckout(cartOverrides = {}) {
    const removeItem = vi.fn();
    const removeLineItem = vi.fn();

    useAuth.mockReturnValue({
        user: { id: 'buyer', email: 'buyer@example.com' },
        profile: null,
        loading: false,
    });
    useCart.mockReturnValue({
        items: [{ id: 'burger', name: 'Classic Burger', price: 8.5, quantity: 1 }],
        addItem: vi.fn(),
        removeItem,
        removeLineItem,
        vendorId: 'vendor-1',
        ...cartOverrides,
    });

    render(
        <MemoryRouter>
            <Checkout />
        </MemoryRouter>
    );

    return { removeItem, removeLineItem };
}

describe('Checkout cart controls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('allows decrementing the final quantity out of the cart', () => {
        const { removeItem } = renderCheckout();

        const decrementButton = screen.getByLabelText('Decrease Classic Burger checkout quantity');
        expect(decrementButton).toBeEnabled();
        fireEvent.click(decrementButton);

        expect(removeItem).toHaveBeenCalledWith('burger');
    });

    it('offers an explicit action to remove a selected line item', () => {
        const { removeLineItem } = renderCheckout();

        fireEvent.click(screen.getByRole('button', { name: 'Remove Classic Burger from cart' }));

        expect(removeLineItem).toHaveBeenCalledWith('burger');
    });

    it('defaults WhatsApp entry to the United Kingdom country code and displays the pilot fee', () => {
        renderCheckout();

        expect(screen.getByLabelText('WhatsApp country code')).toHaveValue('GB');
        expect(screen.getByText('£1.50')).toBeInTheDocument();
    });
});
