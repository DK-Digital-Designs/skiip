import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VendorProducts from './Products';
import { AuthService } from '../../lib/services/auth.service';
import { ProductService } from '../../lib/services/product.service';
import { StoreService } from '../../lib/services/store.service';

const addToast = vi.fn();

vi.mock('../../lib/supabase', () => ({
    isSupabaseConfigured: () => true,
}));

vi.mock('../../lib/services/auth.service', () => ({
    AuthService: { getSession: vi.fn() },
}));

vi.mock('../../lib/services/store.service', () => ({
    StoreService: { getStoreByUserId: vi.fn() },
}));

vi.mock('../../lib/services/product.service', () => ({
    ProductService: {
        getProducts: vi.fn(),
        createProduct: vi.fn(),
        updateProduct: vi.fn(),
        deleteProduct: vi.fn(),
        saveProductModifiers: vi.fn(),
    },
}));

vi.mock('../../lib/features/productModifiers', () => ({
    canShowProductModifierEditor: () => true,
    canPersistProductModifierEditor: () => true,
}));

vi.mock('../../components/vendor/ProductImageUpload', () => ({
    default: () => <div data-testid="product-image-upload" />,
}));

vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ addToast }),
}));

describe('VendorProducts modifier save failures', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        AuthService.getSession.mockResolvedValue({ user: { id: 'seller-1' } });
        StoreService.getStoreByUserId.mockResolvedValue({ id: 'store-1', name: 'Vendor Store' });
        ProductService.getProducts.mockResolvedValue({ data: [], count: 0 });
        ProductService.createProduct.mockResolvedValue({
            id: 'product-1',
            slug: 'combo-burger-created',
            name: 'Combo Burger',
            price: 10,
            category: 'Mains',
            inventory_quantity: 5,
        });
        ProductService.updateProduct.mockResolvedValue({
            id: 'product-1',
            slug: 'combo-burger-created',
            name: 'Combo Burger',
            price: 10,
            category: 'Mains',
            inventory_quantity: 5,
        });
    });

    it('retries as an update after product creation succeeds but modifier save fails', async () => {
        ProductService.saveProductModifiers
            .mockRejectedValueOnce(new Error('Modifier save failed'))
            .mockResolvedValueOnce([]);

        render(
            <MemoryRouter>
                <VendorProducts />
            </MemoryRouter>
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Add Product' }));
        fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Combo Burger' } });
        fireEvent.change(screen.getByLabelText('Price'), { target: { value: '10' } });
        fireEvent.change(screen.getByLabelText('Stock quantity'), { target: { value: '5' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save Product' }));

        await waitFor(() => expect(addToast).toHaveBeenCalledWith('Modifier save failed', 'error'));
        expect(ProductService.createProduct).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole('button', { name: 'Save Product' }));

        await waitFor(() => expect(ProductService.updateProduct).toHaveBeenCalledWith(
            'product-1',
            expect.objectContaining({ slug: 'combo-burger-created' })
        ));
        expect(ProductService.createProduct).toHaveBeenCalledTimes(1);
        expect(ProductService.saveProductModifiers).toHaveBeenCalledTimes(2);
    });

    it('offers Snacks as a product category', async () => {
        render(
            <MemoryRouter>
                <VendorProducts />
            </MemoryRouter>
        );

        fireEvent.click(await screen.findByRole('button', { name: 'Add Product' }));

        expect(screen.getByRole('option', { name: 'Snacks' })).toBeInTheDocument();
    });
});
