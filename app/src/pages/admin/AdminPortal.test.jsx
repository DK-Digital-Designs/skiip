import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './DashboardV2';
import AdminEvents from './Events';
import AdminOrders from './Orders';
import AdminIssues from './Issues';
import AdminSettings from './Settings';
import AdminVendors from './Vendors';
import { supabase } from '../../lib/supabase';
import { AdminService } from '../../lib/services/admin.service';
import { AdminStoreService } from '../../lib/services/adminStore.service';
import { RefundService } from '../../lib/services/refund.service';
import { SettingsService } from '../../lib/services/settings.service';
import { SupportService } from '../../lib/services/support.service';

vi.mock('../../lib/supabase', () => ({
    supabase: { from: vi.fn() },
}));

vi.mock('../../lib/services/admin.service', () => ({
    AdminService: {
        getDashboardMetrics: vi.fn(),
        getRecentOrders: vi.fn(),
        reconcileOrderPayment: vi.fn(),
    },
}));

vi.mock('../../lib/services/adminStore.service', () => ({
    AdminStoreService: {
        createVendorStore: vi.fn(),
        updateStoreStatus: vi.fn(),
        updateStoreCategory: vi.fn(),
        archiveStore: vi.fn(),
    },
}));

vi.mock('../../lib/services/refund.service', () => ({
    RefundService: { refundOrder: vi.fn() },
}));

vi.mock('../../lib/services/settings.service', () => ({
    SettingsService: {
        getLaunchEvent: vi.fn(),
        saveLaunchEvent: vi.fn(),
        getPaymentControls: vi.fn(),
        savePaymentControls: vi.fn(),
    },
}));

vi.mock('../../lib/services/support.service', () => ({
    SupportService: {
        getAdminRequests: vi.fn(),
        updateAdminRequest: vi.fn(),
    },
}));

const metrics = {
    totalOrders: 14,
    activeOrders: 3,
    failedPayments: 1,
    paidRevenue: 160,
    serviceFeeRevenue: 0,
    refundedRevenue: 12,
    statusCounts: { paid: 3, refunded: 1 },
    vendors: [{ store_id: 'store-1', store_name: 'Sunset Tacos', status: 'active', orders: 7, revenue: 95 }],
    notifications: { total: 8, failed: 1, whatsapp_failed: 1, email_failed: 0 },
};

const launchEvent = {
    label: 'Live now',
    title: 'FOOD WITHOUT THE QUEUE',
    subtitle: 'Collect when ready.',
    landingTitle: 'LANDING EVENT',
    landingSubtitle: 'Landing copy.',
};

const controls = {
    controls: { enabled: true, reason: null, updatedAt: '2026-05-25T10:00:00Z', updatedBy: 'admin' },
    masterEnabled: false,
    checkoutEnabled: false,
};

const orders = [
    {
        id: 'paid-1',
        order_number: '101',
        created_at: '2026-05-25T11:00:00Z',
        stores: { name: 'Sunset Tacos' },
        customer_email: 'buyer@example.com',
        total: 28.5,
        status: 'paid',
        payment_status: 'succeeded',
        platform_fee: 0,
        stripe_fee: 0.8,
        vendor_net: 27.7,
        payment_intent_id: 'pi_paid',
        charge_id: 'ch_paid',
    },
    {
        id: 'reconcile-1',
        order_number: '102',
        created_at: '2026-05-25T11:30:00Z',
        stores: { name: 'Bao Brothers' },
        customer_phone: '+441234',
        total: 16,
        status: 'pending',
        payment_status: 'pending',
        checkout_session_id: 'cs_reconcile',
    },
];

const issues = [{
    id: 'issue-1',
    reference_code: 'SUP-20260527-CASE0001',
    source: 'buyer_submission',
    reporter_role: 'buyer',
    order_id: 'paid-1',
    contact_name: 'Buyer Name',
    contact_email: 'buyer@example.com',
    issue_type: 'refund_request',
    description: 'Please review my refund request.',
    status: 'open',
    priority: 'high',
    created_at: '2026-05-27T10:00:00Z',
    orders: { order_number: '101', total: 28.5, status: 'paid', payment_status: 'succeeded' },
    stores: { name: 'Sunset Tacos' },
}];

function renderPage(page, path) {
    return render(<MemoryRouter initialEntries={[path]}>{page}</MemoryRouter>);
}

function resolvedQuery(result) {
    const query = {
        select: vi.fn(() => query),
        is: vi.fn(() => query),
        in: vi.fn(() => query),
        order: vi.fn(() => Promise.resolve(result)),
    };
    return query;
}

beforeEach(() => {
    vi.clearAllMocks();
    AdminService.getDashboardMetrics.mockResolvedValue(metrics);
    AdminService.getRecentOrders.mockResolvedValue(orders);
    AdminService.reconcileOrderPayment.mockResolvedValue({});
    RefundService.refundOrder.mockResolvedValue({});
    SettingsService.getLaunchEvent.mockResolvedValue(launchEvent);
    SettingsService.saveLaunchEvent.mockImplementation(async (value) => value);
    SettingsService.getPaymentControls.mockResolvedValue(controls);
    SettingsService.savePaymentControls.mockResolvedValue({
        controls: { enabled: false, reason: 'Incident', updatedAt: '2026-05-25T12:00:00Z', updatedBy: 'admin' },
        masterEnabled: false,
        checkoutEnabled: false,
    });
    AdminStoreService.updateStoreStatus.mockResolvedValue({});
    SupportService.getAdminRequests.mockResolvedValue(issues);
    SupportService.updateAdminRequest.mockResolvedValue({ id: 'issue-1', status: 'in_review', priority: 'high', internal_notes: 'Contacted buyer' });
    supabase.from.mockImplementation((table) => {
        if (table === 'stores') {
            return resolvedQuery({
                data: [{ id: 'store-1', name: 'Sunset Tacos', slug: 'sunset', status: 'active', category: 'Food', user_id: 'user-1' }],
                error: null,
            });
        }
        return resolvedQuery({
            data: [{ id: 'user-1', email: 'seller@example.com', full_name: 'Vendor Owner', role: 'seller' }],
            error: null,
        });
    });
});

describe('admin operational surfaces', () => {
    it('renders shared navigation and keeps mutations off the overview dashboard', async () => {
        renderPage(<AdminDashboard />, '/admin/dashboard');

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('link', { name: 'Orders' })).toBeInTheDocument();
        expect(screen.getByText('Notification Health')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /refund/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /pause checkout/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /save event copy/i })).not.toBeInTheDocument();
    });

    it('submits refunds, reconciliation, and displays payment detail from Orders', async () => {
        renderPage(<AdminOrders />, '/admin/orders');

        await screen.findByText('Sunset Tacos');
        fireEvent.click(screen.getByRole('button', { name: 'Payment details' }));
        expect(screen.getByText('pi_paid')).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Refund' }));
        fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'Customer request' } });
        fireEvent.click(screen.getByRole('button', { name: 'Submit refund' }));

        await waitFor(() => expect(RefundService.refundOrder).toHaveBeenCalledWith('paid-1', 'Customer request'));
        fireEvent.click(screen.getByRole('button', { name: 'Reconcile payment' }));
        await waitFor(() => expect(AdminService.reconcileOrderPayment).toHaveBeenCalledWith('reconcile-1'));
    });

    it('previews and saves launch-event content from Event Setup', async () => {
        renderPage(<AdminEvents />, '/admin/events');

        const titleField = await screen.findByLabelText('Buyer page title');
        fireEvent.change(titleField, { target: { value: 'UPDATED EVENT TITLE' } });
        expect(screen.getByRole('heading', { name: 'UPDATED EVENT TITLE' })).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Save event copy' }));
        await waitFor(() => expect(SettingsService.saveLaunchEvent).toHaveBeenCalledWith(expect.objectContaining({
            title: 'UPDATED EVENT TITLE',
        })));
    });

    it('pauses checkout through Settings and exposes the master-switch warning', async () => {
        renderPage(<AdminSettings />, '/admin/settings');

        expect(await screen.findByText(/environment master switch must also be on/i)).toBeInTheDocument();
        fireEvent.change(screen.getByLabelText('Pause reason'), { target: { value: 'Incident' } });
        fireEvent.click(screen.getByRole('button', { name: 'Pause checkout' }));
        await waitFor(() => expect(SettingsService.savePaymentControls).toHaveBeenCalledWith({
            enabled: false,
            reason: 'Incident',
        }));
    });

    it('renders vendor performance without replacing vendor mutation controls', async () => {
        renderPage(<AdminVendors />, '/admin/vendors');

        expect(await screen.findByText('Vendor Performance')).toBeInTheDocument();
        expect(await screen.findByText('7 orders')).toBeInTheDocument();
        fireEvent.click(await screen.findByRole('button', { name: 'Suspend' }));
        await waitFor(() => expect(AdminStoreService.updateStoreStatus).toHaveBeenCalledWith('store-1', 'suspended'));
    });

    it('triages support issues and can launch an approved linked-order refund', async () => {
        renderPage(<AdminIssues />, '/admin/issues');

        expect((await screen.findAllByText('SUP-20260527-CASE0001')).length).toBeGreaterThan(0);
        fireEvent.change(screen.getByLabelText('Case status'), { target: { value: 'in_review' } });
        fireEvent.change(screen.getByLabelText('Internal notes'), { target: { value: 'Contacted buyer' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save triage' }));
        await waitFor(() => expect(SupportService.updateAdminRequest).toHaveBeenCalledWith(
            'issue-1',
            expect.objectContaining({ status: 'in_review', internalNotes: 'Contacted buyer' }),
        ));

        fireEvent.click(screen.getByRole('button', { name: 'Refund linked order' }));
        fireEvent.click(screen.getByRole('button', { name: 'Submit refund' }));
        await waitFor(() => expect(RefundService.refundOrder).toHaveBeenCalledWith('paid-1', 'Support case SUP-20260527-CASE0001'));
    });

    it('keeps vendor management usable when optional performance data fails', async () => {
        AdminService.getDashboardMetrics.mockRejectedValueOnce(new Error('Metrics unavailable'));
        renderPage(<AdminVendors />, '/admin/vendors');

        expect(await screen.findByText(/vendor activity is unavailable/i)).toBeInTheDocument();
        expect(await screen.findByRole('button', { name: 'Suspend' })).toBeInTheDocument();
    });
});
