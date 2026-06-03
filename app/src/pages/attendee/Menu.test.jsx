import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Menu from './Menu';

const addItem = vi.fn(() => true);

vi.mock('../../lib/supabase', () => ({
    isSupabaseConfigured: () => true,
}));

vi.mock('../../lib/analytics', () => ({
    trackSkiipEvent: vi.fn(),
}));

vi.mock('../../lib/features/productModifiers', () => ({
    canUseMockProductModifiers: () => false,
    canUseRealProductModifiers: () => true,
}));

vi.mock('../../lib/hooks/useCart', () => ({
    useCart: () => ({
        items: [],
        addItem,
        removeItem: vi.fn(),
        clearCart: vi.fn(),
        getCartTotal: () => 0,
        getItemCount: () => 0,
        vendorId: 'vendor-1',
    }),
}));

vi.mock('../../lib/hooks/useMenu', () => ({
    useStore: () => ({
        data: { id: 'vendor-1', name: 'Test Vendor', pickup_location: 'Stall 1' },
        isLoading: false,
    }),
    useStoreMenu: () => ({
        data: [{
            id: 'product-1',
            name: 'Combo Burger',
            description: 'Burger with choices',
            price: 10,
            category: 'Mains',
            store_id: 'vendor-1',
            inventory_quantity: 5,
            modifierGroups: [
                {
                    id: 'required-group',
                    name: 'Choose a side',
                    required: true,
                    minSelect: 1,
                    maxSelect: 1,
                    active: true,
                    options: [{ id: 'side-fries', name: 'Fries', priceDelta: 0, active: true }],
                },
                {
                    id: 'optional-group',
                    name: 'Add a sauce',
                    required: false,
                    minSelect: 0,
                    maxSelect: 1,
                    active: true,
                    options: [{ id: 'sauce-aioli', name: 'Aioli', priceDelta: 0.5, active: true }],
                },
            ],
        }],
        isLoading: false,
    }),
}));

function renderMenu() {
    render(
        <MemoryRouter initialEntries={['/order/vendor/vendor-1']}>
            <Routes>
                <Route path="/order/vendor/:vendorId" element={<Menu />} />
            </Routes>
        </MemoryRouter>
    );
}

describe('Menu product configuration dialog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('caps line notes at 240 characters', async () => {
        renderMenu();

        fireEvent.click(await screen.findByRole('button', { name: 'Configure Combo Burger' }));
        const noteField = screen.getByLabelText('Line note');
        fireEvent.change(noteField, { target: { value: 'x'.repeat(260) } });

        expect(noteField).toHaveValue('x'.repeat(240));
        expect(noteField).toHaveAttribute('maxLength', '240');
    });

    it('clears optional single-select modifiers but keeps required single-select choices', async () => {
        renderMenu();

        fireEvent.click(await screen.findByRole('button', { name: 'Configure Combo Burger' }));
        const requiredOption = await screen.findByRole('radio', { name: /Fries/ });
        const optionalOption = screen.getByRole('checkbox', { name: /Aioli/ });

        fireEvent.click(requiredOption);
        expect(requiredOption).toBeChecked();
        fireEvent.click(requiredOption);
        expect(requiredOption).toBeChecked();

        fireEvent.click(optionalOption);
        expect(optionalOption).toBeChecked();
        fireEvent.click(optionalOption);
        expect(optionalOption).not.toBeChecked();
    });
});
