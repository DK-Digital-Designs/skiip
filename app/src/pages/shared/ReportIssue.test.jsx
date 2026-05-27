import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ReportIssue from './ReportIssue';
import { useAuth } from '../../lib/context/AuthContext';
import { OrderService } from '../../lib/services/order.service';
import { StoreService } from '../../lib/services/store.service';
import { SupportService } from '../../lib/services/support.service';

vi.mock('../../lib/context/AuthContext', () => ({ useAuth: vi.fn() }));
vi.mock('../../lib/services/order.service', () => ({
    OrderService: { getMyOrders: vi.fn(), getStoreOrders: vi.fn() },
}));
vi.mock('../../lib/services/store.service', () => ({
    StoreService: { getMyStore: vi.fn() },
}));
vi.mock('../../lib/services/support.service', () => ({
    SupportService: { submitRequest: vi.fn() },
}));
vi.mock('../../components/ui/Toast', () => ({
    useToast: () => ({ addToast: vi.fn() }),
}));

beforeEach(() => {
    vi.clearAllMocks();
    OrderService.getMyOrders.mockResolvedValue([
        { id: 'order-1', order_number: 'ORD-1', stores: { name: 'Food Store' } },
    ]);
    StoreService.getMyStore.mockResolvedValue({ id: 'store-1' });
    OrderService.getStoreOrders.mockResolvedValue([]);
    SupportService.submitRequest.mockResolvedValue({ reference_code: 'SUP-20260527-ABC12345' });
});

describe('ReportIssue', () => {
    it('shows buyer issue categories and submits an owned-order refund request', async () => {
        useAuth.mockReturnValue({
            user: { id: 'buyer', email: 'buyer@example.com' },
            profile: { role: 'buyer', full_name: 'Buyer', email: 'buyer@example.com' },
        });
        render(<MemoryRouter><ReportIssue /></MemoryRouter>);

        expect(screen.getByRole('option', { name: 'Refund request' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Payment or payout concern' })).not.toBeInTheDocument();
        fireEvent.change(await screen.findByLabelText(/Related order/), { target: { value: 'order-1' } });
        fireEvent.change(screen.getByLabelText('What happened?'), { target: { value: 'My order was cancelled after payment.' } });
        fireEvent.click(screen.getByText(/I understand SKIIP/));
        fireEvent.click(screen.getByRole('button', { name: 'Submit issue' }));

        await waitFor(() => expect(SupportService.submitRequest).toHaveBeenCalledWith(expect.objectContaining({
            issueType: 'refund_request',
            orderId: 'order-1',
            acknowledged: true,
        })));
        expect(await screen.findByText(/SUP-20260527-ABC12345/)).toBeInTheDocument();
    });

    it('shows vendor-specific issue categories without buyer complaint categories', async () => {
        useAuth.mockReturnValue({
            user: { id: 'seller', email: 'seller@example.com' },
            profile: { role: 'seller', full_name: 'Vendor', email: 'seller@example.com' },
        });
        render(<MemoryRouter><ReportIssue /></MemoryRouter>);

        expect(await screen.findByRole('option', { name: 'Payment or payout concern' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'Cold food' })).not.toBeInTheDocument();
    });
});
