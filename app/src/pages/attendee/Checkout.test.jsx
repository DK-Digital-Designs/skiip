import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Checkout from './Checkout';
import { useCart } from '../../lib/hooks/useCart';
import { useAuth } from '../../lib/context/AuthContext';
import { calculateOrderSummary } from '../../lib/orders';
import { OrderService } from '../../lib/services/order.service';
import { isSupabaseConfigured } from '../../lib/supabase';
import { StoreService } from '../../lib/services/store.service';
import { StripeService } from '../../lib/services/stripe.service';

const addToast = vi.fn();

vi.mock('../../lib/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../lib/hooks/useCart', () => ({
    useCart: vi.fn(),
}));

vi.mock('../../lib/orders', async () => {
    const actual = await vi.importActual('../../lib/orders');
    return {
        ...actual,
        calculateOrderSummary: vi.fn(actual.calculateOrderSummary),
    };
});

vi.mock('../../lib/supabase', () => ({
    isSupabaseConfigured: vi.fn(() => false),
}));

vi.mock('../../lib/analytics', () => ({
    trackSkiipEvent: vi.fn(),
}));

vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ addToast }),
}));

vi.mock('../../lib/services/order.service', () => ({
    OrderService: {
        createOrder: vi.fn(),
        updateOrderStatus: vi.fn(),
    },
}));

vi.mock('../../lib/services/store.service', () => ({
    StoreService: {
        getStoreById: vi.fn(),
    },
}));

vi.mock('../../lib/services/stripe.service', () => ({
    StripeService: {
        createCheckoutSession: vi.fn(),
    },
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
    beforeEach(async () => {
        const actual = await vi.importActual('../../lib/orders');
        vi.clearAllMocks();
        addToast.mockClear();
        calculateOrderSummary.mockImplementation(actual.calculateOrderSummary);
        isSupabaseConfigured.mockReturnValue(false);
        StoreService.getStoreById.mockResolvedValue(null);
        OrderService.createOrder.mockResolvedValue({ id: 'order-1' });
        StripeService.createCheckoutSession.mockRejectedValue(new Error('Stop after payload assertion'));
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

    it('shows pilot policy copy, hides WhatsApp controls, and shows the configured service fee', () => {
        renderCheckout();

        expect(screen.getByText('Confirmation')).toBeInTheDocument();
        expect(screen.getByText(/notified the vendor of any allergies or dietary requirements/i)).toBeInTheDocument();
        expect(screen.getByText(/To enjoy your food at its best/i)).toBeInTheDocument();
        expect(screen.getByText(/refund requests related to delayed collection cannot be accommodated/i)).toBeInTheDocument();
        expect(screen.queryByLabelText('WhatsApp country code')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('WhatsApp number')).not.toBeInTheDocument();
        expect(screen.queryByText('WhatsApp updates')).not.toBeInTheDocument();
        expect(screen.queryByText('Service fee waived')).not.toBeInTheDocument();
        expect(screen.getByText('Service Fee')).toBeInTheDocument();
        expect(screen.getByText(/1\.50/)).toBeInTheDocument();
    });

    it('submits WhatsApp fields disabled for the pilot', async () => {
        isSupabaseConfigured.mockReturnValue(true);
        renderCheckout();

        fireEvent.click(screen.getByRole('button', { name: /pay/i }));

        await waitFor(() => expect(OrderService.createOrder).toHaveBeenCalledWith(expect.objectContaining({
            customer_phone: null,
            whatsapp_opt_in: false,
        })));
    });

    it('does not show scheduled collection controls on checkout', () => {
        renderCheckout();

        expect(screen.queryByText('Collection time')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Scheduled' })).not.toBeInTheDocument();
        expect(screen.queryByLabelText('Collection date and time')).not.toBeInTheDocument();
    });

    it('shows the service fee row when a fee is present', () => {
        calculateOrderSummary.mockReturnValue({
            subtotal: 8.5,
            tip: 0,
            serviceFee: 1.5,
            total: 10,
        });

        renderCheckout();

        expect(screen.getByText('Service Fee')).toBeInTheDocument();
        expect(screen.getByText(/1\.50/)).toBeInTheDocument();
    });

    it('blocks configured cart checkout before backend order creation', () => {
        renderCheckout({
            items: [{
                id: 'burger',
                productId: 'burger',
                lineId: 'burger::cheese::no onions',
                name: 'Classic Burger',
                price: 9,
                displayUnitPrice: 9,
                quantity: 1,
                selectedOptionIds: ['cheese'],
                lineNote: 'No onions',
                modifierDisplay: [{ groupName: 'Extras', optionName: 'Extra cheese', priceDelta: 0.5 }],
            }],
        });

        fireEvent.click(screen.getByRole('button', { name: /pay/i }));

        expect(addToast).toHaveBeenCalledWith('Checkout for configured products is not enabled yet.', 'error');
        expect(OrderService.createOrder).not.toHaveBeenCalled();
    });
});
