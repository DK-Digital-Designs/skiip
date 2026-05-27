import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { OrderService } from '../../lib/services/order.service';
import { StoreService } from '../../lib/services/store.service';
import { SupportService } from '../../lib/services/support.service';
import { useToast } from '../../components/ui/Toast';
import { formatOrderCode } from '../../lib/ui-format';

const BUYER_TYPES = [
    { value: 'refund_request', label: 'Refund request', requiresOrder: true },
    { value: 'wrong_order', label: 'Wrong order', requiresOrder: true },
    { value: 'cold_food', label: 'Cold food', requiresOrder: true },
    { value: 'vendor_cancelled', label: 'Vendor cancelled', requiresOrder: true },
    { value: 'collection_issue', label: 'Collection issue', requiresOrder: true },
    { value: 'payment_issue', label: 'Payment issue', requiresOrder: true },
    { value: 'app_bug', label: 'Bug in the app', requiresOrder: false },
    { value: 'general_query', label: 'General query', requiresOrder: false },
];

const VENDOR_TYPES = [
    { value: 'app_bug', label: 'Bug in the app', requiresOrder: false },
    { value: 'payment_payout_concern', label: 'Payment or payout concern', requiresOrder: false },
    { value: 'order_operation_issue', label: 'Order operation issue', requiresOrder: false },
    { value: 'general_query', label: 'General query', requiresOrder: false },
];

export default function ReportIssue() {
    const { user, profile } = useAuth();
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();
    const isVendor = profile?.role === 'seller';
    const issueTypes = isVendor ? VENDOR_TYPES : BUYER_TYPES;
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [issueType, setIssueType] = useState('');
    const [orderId, setOrderId] = useState(searchParams.get('order_id') || '');
    const [contactPhone, setContactPhone] = useState('');
    const [description, setDescription] = useState('');
    const [acknowledged, setAcknowledged] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submittedRequest, setSubmittedRequest] = useState(null);

    useEffect(() => {
        setIssueType(issueTypes[0]?.value || '');
    }, [isVendor]);

    useEffect(() => {
        async function loadAvailableOrders() {
            try {
                if (isVendor) {
                    const store = await StoreService.getMyStore();
                    setOrders(store ? await OrderService.getStoreOrders(store.id, 'all') : []);
                } else {
                    setOrders(await OrderService.getMyOrders());
                }
            } catch (error) {
                console.error('Failed to load support order choices:', error);
                addToast('Order choices could not be loaded. You can still report an app or general issue.', 'error');
            } finally {
                setLoadingOrders(false);
            }
        }

        if (profile?.role) loadAvailableOrders();
    }, [profile?.role, isVendor, addToast]);

    const selectedIssueType = useMemo(
        () => issueTypes.find((type) => type.value === issueType),
        [issueType, issueTypes],
    );

    async function handleSubmit(event) {
        event.preventDefault();
        if (selectedIssueType?.requiresOrder && !orderId) {
            addToast('Select the order affected by this issue.', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const request = await SupportService.submitRequest({
                issueType,
                orderId: orderId || null,
                contactPhone: contactPhone.trim() || null,
                description,
                acknowledged,
            });
            setSubmittedRequest(request);
        } catch (error) {
            addToast(error.message || 'Unable to submit your request.', 'error');
        } finally {
            setSubmitting(false);
        }
    }

    if (submittedRequest) {
        return (
            <main className="app-page">
                <div className="narrow-container card" style={{ display: 'grid', gap: '18px', marginTop: '28px' }}>
                    <p className="page-kicker">Request received</p>
                    <h1 className="page-title">We have logged your issue</h1>
                    <p>SKIIP will review this request and respond using your recorded contact details.</p>
                    <div className="chip chip--accent" style={{ width: 'fit-content' }}>
                        Case reference: {submittedRequest.reference_code}
                    </div>
                    <Link className="btn btn-primary" to={isVendor ? '/vendor/dashboard' : '/order/profile'}>
                        {isVendor ? 'Return to dashboard' : 'Return to my orders'}
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="app-page">
            <div className="narrow-container" style={{ display: 'grid', gap: '20px', paddingBlock: '26px' }}>
                <div>
                    <p className="page-kicker">Support</p>
                    <h1 className="page-title">Report an issue</h1>
                    <p className="page-subtitle" style={{ marginTop: '10px' }}>
                        {isVendor
                            ? 'Tell us about a payout, operational, or app issue affecting your store.'
                            : 'Tell us about an order problem, refund request, or problem using the app.'}
                    </p>
                </div>
                <form className="card" onSubmit={handleSubmit} style={{ display: 'grid', gap: '18px' }}>
                    <div className="two-column">
                        <div>
                            <label htmlFor="support-name">Name</label>
                            <input id="support-name" value={profile?.full_name || ''} disabled />
                        </div>
                        <div>
                            <label htmlFor="support-email">Email</label>
                            <input id="support-email" value={profile?.email || user?.email || ''} disabled />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="support-phone">Phone number (optional)</label>
                        <input
                            id="support-phone"
                            type="tel"
                            value={contactPhone}
                            onChange={(event) => setContactPhone(event.target.value)}
                            placeholder="Best number for follow-up"
                        />
                    </div>
                    <div>
                        <label htmlFor="support-type">Issue type</label>
                        <select id="support-type" value={issueType} onChange={(event) => setIssueType(event.target.value)} required>
                            {issueTypes.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="support-order">
                            Related order {selectedIssueType?.requiresOrder ? '(required)' : '(optional)'}
                        </label>
                        <select
                            id="support-order"
                            value={orderId}
                            onChange={(event) => setOrderId(event.target.value)}
                            required={Boolean(selectedIssueType?.requiresOrder)}
                            disabled={loadingOrders}
                        >
                            <option value="">{loadingOrders ? 'Loading orders...' : 'No linked order'}</option>
                            {orders.map((order) => (
                                <option key={order.id} value={order.id}>
                                    {formatOrderCode(order)} - {order.stores?.name || (isVendor ? 'Store order' : 'Vendor')}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="support-description">What happened?</label>
                        <textarea
                            id="support-description"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            minLength={10}
                            maxLength={2000}
                            required
                            style={{ minHeight: '132px' }}
                            placeholder="Include enough detail for the support team to review this request."
                        />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <input
                            type="checkbox"
                            checked={acknowledged}
                            onChange={(event) => setAcknowledged(event.target.checked)}
                            required
                            style={{ width: '20px', marginTop: '2px' }}
                        />
                        <span>I understand SKIIP will review this issue and respond using my recorded contact details.</span>
                    </label>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit issue'}
                    </button>
                </form>
            </div>
        </main>
    );
}
