import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';
import { StoreService } from '../../lib/services/store.service';
import { StripeService } from '../../lib/services/stripe.service';
import { useToast } from '../../components/ui/Toast';
import { useStoreOrders, useUpdateOrderStatus } from '../../lib/hooks/useOrders';
import { getScheduledCollectionLabel } from '../../lib/scheduledCollection';
import {
    VENDOR_ACTIVE_ORDER_LANE_IDS,
    VENDOR_ALL_ORDER_LANE_IDS,
    VENDOR_ORDER_LANE_DEFINITIONS,
    getAllowedOrderTransitions,
    getOrderStatusColor,
    getOrderStatusLabel,
    getVendorLaneEmptyMessage,
    getVendorOrderActionHint,
    getVendorOrderItemSummary,
    getVendorPrimaryTransition,
    getVendorTransitionSuccessMessage,
    groupVendorOrdersByLane,
} from '../../lib/orders';

const FILTERS = [
    { id: 'active', label: 'Active' },
    { id: 'scheduled', label: 'Scheduled' },
    { id: 'all', label: 'All' },
];

const pageStyles = {
    minHeight: '100vh',
    paddingBottom: '40px',
};

const headerStyles = {
    padding: '20px 0',
    borderBottom: '1px solid var(--stroke)',
    marginBottom: '32px',
};

const queueStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '16px',
    alignItems: 'start',
};

const laneStyles = {
    minHeight: '360px',
    border: '1px solid var(--stroke)',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.025)',
    padding: '14px',
};

function formatCurrency(value) {
    const amount = Number(value || 0);
    return `GBP ${amount.toFixed(2)}`;
}

function getOrderTotal(order) {
    return Number(order?.total ?? order?.total_amount ?? 0);
}

function getOrderContact(order) {
    if (order?.customer_phone) {
        return {
            label: order.customer_phone,
            href: `tel:${order.customer_phone}`,
            type: 'Phone',
        };
    }

    if (order?.customer_email) {
        return {
            label: order.customer_email,
            href: `mailto:${order.customer_email}`,
            type: 'Email',
        };
    }

    return {
        label: 'No buyer contact',
        href: null,
        type: 'Contact',
    };
}

function getLaneDefinitions(filter) {
    const laneIds = filter === 'all' ? VENDOR_ALL_ORDER_LANE_IDS : VENDOR_ACTIVE_ORDER_LANE_IDS;
    return laneIds
        .map((laneId) => VENDOR_ORDER_LANE_DEFINITIONS.find((lane) => lane.id === laneId))
        .filter(Boolean);
}

function VendorOrderCard({ order, isBusy, onTransition }) {
    const scheduledCollectionLabel = getScheduledCollectionLabel(order);
    const allowedTransitions = getAllowedOrderTransitions(order.status);
    const primaryTransition = getVendorPrimaryTransition(order.status);
    const canCancel = allowedTransitions.includes('cancelled');
    const contact = getOrderContact(order);
    const itemSummary = getVendorOrderItemSummary(order);
    const actionHint = getVendorOrderActionHint(order);

    return (
        <article
            className="card"
            style={{
                display: 'grid',
                gap: '14px',
                padding: '16px',
                borderRadius: '8px',
                borderLeft: `4px solid ${getOrderStatusColor(order)}`,
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
                <div>
                    <h3 style={{ fontSize: '16px', lineHeight: '1.25', marginBottom: '4px' }}>
                        Order #{String(order.id || '').slice(0, 8)}
                    </h3>
                    <p className="text-muted" style={{ fontSize: '12px' }}>
                        {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time unknown'}
                    </p>
                    <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                        {itemSummary}
                    </p>
                </div>
                <span
                    style={{
                        flexShrink: 0,
                        maxWidth: '128px',
                        overflowWrap: 'anywhere',
                        padding: '5px 8px',
                        borderRadius: '8px',
                        border: '1px solid var(--stroke)',
                        color: getOrderStatusColor(order),
                        fontSize: '11px',
                        fontWeight: 800,
                        lineHeight: 1.2,
                        textAlign: 'right',
                    }}
                >
                    {getOrderStatusLabel(order)}
                </span>
            </div>

            {scheduledCollectionLabel && (
                <div
                    style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(139, 92, 246, 0.12)',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        color: 'var(--text)',
                        fontSize: '12px',
                        fontWeight: 700,
                    }}
                >
                    Collection: {scheduledCollectionLabel}
                </div>
            )}

            <div style={{ display: 'grid', gap: '8px' }}>
                {(order.order_items || []).length === 0 ? (
                    <p className="text-muted" style={{ fontSize: '13px' }}>Item details are not available for this order.</p>
                ) : (
                    (order.order_items || []).map((item, index) => (
                        <div
                            key={`${order.id || 'order'}-${index}`}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) auto',
                                gap: '8px',
                                fontSize: '14px',
                            }}
                        >
                            <span style={{ overflowWrap: 'anywhere' }}>
                                <strong>{item.quantity} x</strong> {item.product_snapshot?.name || 'Item'}
                            </span>
                            <span>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</span>
                        </div>
                    ))
                )}
                {order.notes && (
                    <div
                        style={{
                            padding: '8px 10px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.04)',
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                            overflowWrap: 'anywhere',
                        }}
                    >
                        Note: {order.notes}
                    </div>
                )}
            </div>

            <div
                style={{
                    display: 'grid',
                    gap: '6px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--stroke)',
                    fontSize: '13px',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 800 }}>
                    <span>Total</span>
                    <span className="text-accent">{formatCurrency(getOrderTotal(order))}</span>
                </div>
                <div style={{ display: 'grid', gap: '4px' }}>
                    <span className="text-muted" style={{ fontSize: '12px' }}>{contact.type}</span>
                    {contact.href ? (
                        <a href={contact.href} className="text-accent" style={{ overflowWrap: 'anywhere', textDecoration: 'none', fontWeight: 700 }}>
                            {contact.label}
                        </a>
                    ) : (
                        <span className="text-muted">{contact.label}</span>
                    )}
                </div>
                <div
                    style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.035)',
                        color: 'var(--text-muted)',
                    }}
                >
                    {actionHint}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {primaryTransition && allowedTransitions.includes(primaryTransition.status) && (
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={isBusy}
                        onClick={() => onTransition(order.id, primaryTransition.status)}
                        style={{ minHeight: '40px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px' }}
                    >
                        {isBusy ? 'Updating...' : primaryTransition.label}
                    </button>
                )}
                {canCancel && (
                    <button
                        type="button"
                        className="btn btn-ghost"
                        disabled={isBusy}
                        onClick={() => onTransition(order.id, 'cancelled')}
                        style={{ minHeight: '40px', padding: '8px 12px', borderRadius: '8px', fontSize: '13px', color: '#f87171' }}
                    >
                        {isBusy ? 'Updating...' : 'Cancel order'}
                    </button>
                )}
            </div>
        </article>
    );
}

function QueueLane({ lane, orders, transitioningOrderId, onTransition }) {
    return (
        <section style={laneStyles}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start', marginBottom: '14px' }}>
                <div>
                    <h2 style={{ fontSize: '15px', fontWeight: 800, lineHeight: 1.2 }}>{lane.title}</h2>
                    <p className="text-muted" style={{ fontSize: '12px', lineHeight: 1.35, marginTop: '4px' }}>{lane.description}</p>
                </div>
                <span
                    style={{
                        display: 'inline-flex',
                        minWidth: '32px',
                        height: '28px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid var(--stroke)',
                        fontWeight: 800,
                    }}
                >
                    {orders.length}
                </span>
            </div>

            {orders.length === 0 ? (
                <div
                    style={{
                        minHeight: '140px',
                        display: 'grid',
                        placeItems: 'center',
                        border: '1px dashed var(--stroke)',
                        borderRadius: '8px',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                        padding: '16px',
                        fontSize: '13px',
                    }}
                >
                    {getVendorLaneEmptyMessage(lane.id)}
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                    {orders.map((order) => (
                        <VendorOrderCard
                            key={order.id}
                            order={order}
                            isBusy={transitioningOrderId === order.id}
                            onTransition={onTransition}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

export default function VendorDashboard() {
    const navigate = useNavigate();
    const location = useLocation();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active');
    const [transitioningOrderId, setTransitioningOrderId] = useState(null);
    const { addToast } = useToast();

    const { data: orders = [], refetch: fetchOrders, isLoading: ordersLoading, isError: ordersFailed } = useStoreOrders(store?.id, filter);
    const updateOrderStatusMutation = useUpdateOrderStatus();

    const lanes = useMemo(() => getLaneDefinitions(filter), [filter]);
    const groupedOrders = useMemo(
        () => groupVendorOrdersByLane(orders, lanes.map((lane) => lane.id)),
        [orders, lanes],
    );

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (store && isSupabaseConfigured()) {
            const subscription = supabase
                .channel('store-orders')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `store_id=eq.${store.id}`,
                }, () => {
                    fetchOrders();
                    playNotificationSound();
                })
                .subscribe();

            return () => subscription.unsubscribe();
        }
    }, [store, filter, fetchOrders]);

    async function checkAuth() {
        try {
            if (!isSupabaseConfigured()) {
                setStore({ id: '1', name: 'Burger Bliss (Demo)', description: 'Demo Store' });
                setLoading(false);
                return;
            }

            const session = await AuthService.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const storeData = await StoreService.getStoreByUserId(session.user.id);
            if (!storeData) {
                console.warn('Auth check failed: Store not found for user', session.user.id);
                addToast('No store found for this account.', 'error');
                navigate('/');
                return;
            }

            const stripeReturned = new URLSearchParams(location.search).get('stripe_return') === '1';
            if (stripeReturned) {
                const { store: reconciledStore } = await StripeService.reconcileConnectStatus({
                    storeId: storeData.id,
                });

                setStore(reconciledStore || storeData);

                if (reconciledStore?.stripe_connect_status === 'ready') {
                    addToast('Payment setup complete. Your shop can accept orders.', 'success');
                } else {
                    addToast('Payment setup still needs attention before orders can open.', 'info');
                }

                navigate('/vendor/dashboard', { replace: true });
                return;
            }

            setStore(storeData);
        } catch (error) {
            console.error('Auth check failed with specific error:', error);
            addToast(`Auth error: ${error.message || 'Unknown error'}`, 'error');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    }

    async function updateOrderStatus(orderId, newStatus) {
        if (!isSupabaseConfigured()) {
            addToast('Demo mode: status update simulated', 'info');
            return;
        }

        setTransitioningOrderId(orderId);
        updateOrderStatusMutation.mutate(
            { orderId, status: newStatus },
            {
                onSuccess: () => {
                    addToast(getVendorTransitionSuccessMessage(newStatus), 'success');
                },
                onError: (error) => {
                    console.error('Error updating status:', error);
                    addToast('Could not update the order. Refresh the queue and try again.', 'error');
                },
                onSettled: () => {
                    setTransitioningOrderId(null);
                },
            }
        );
    }

    async function handleLogout() {
        if (isSupabaseConfigured()) {
            await AuthService.signOut();
        }
        navigate('/login');
    }

    function playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVang8bllHAU2jdXy0Ho0Bitu/fDckUoLEV61/O+jWRMLRp3i8rltIAU1idLy1YU1BiJwwu/gl0gNDlSn4PK8aCAFNYzU8tN+MwYpasPv4ppIDg5Tp9/yu2kgBTWL1PLTfzMGKWrD7+KbSA4OU6ff8rtoIAU0i9Ty038zBilqw+/im0gODlKn3/K7aSAFNIvU8tN/MwYpasLv45tIDg5Sp9/yu2kgBTSL1PLTfzMGKWu/7+OaRg4MU6fe8rxoH');
        audio.play().catch(() => { });
    }

    async function handleConnectStripe() {
        if (!isSupabaseConfigured()) {
            addToast('Demo mode: Onboarding simulated', 'info');
            return;
        }

        try {
            setLoading(true);
            const { url } = await StripeService.createOnboardingLink({
                storeId: store.id,
                returnUrl: window.location.origin + '/#/vendor/dashboard?stripe_return=1',
                refreshUrl: window.location.origin + '/#/vendor/dashboard',
            });

            if (url) {
                window.location.href = url;
            } else {
                throw new Error('Failed to generate onboarding link');
            }
        } catch (error) {
            console.error('Onboarding failed:', error);
            addToast('Failed to start onboarding. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    const stripeConnectStatus = store?.stripe_connect_status
        || (store?.stripe_onboarding_complete ? 'ready' : store?.stripe_account_id ? 'onboarding' : 'not_started');
    const requiresPaymentSetup = Boolean(store && stripeConnectStatus !== 'ready');
    const setupStatusCopy = {
        not_started: 'Connect your bank account to start accepting orders.',
        onboarding: 'Finish the Stripe setup steps so your shop can accept payments.',
        restricted: 'Stripe needs updated information before your shop can accept payments.',
        pending_verification: 'Stripe is verifying your payment setup. Orders stay paused until verification completes.',
    };

    return (
        <div style={pageStyles}>
            <header style={headerStyles}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800 }}>{store?.name}</h1>
                        <p className="text-muted" style={{ fontSize: '14px' }}>Vendor Dashboard</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/vendor/products')} className="btn btn-primary" style={{ minHeight: '40px', padding: '8px 14px', borderRadius: '8px', fontSize: '14px' }}>Products</button>
                        <button onClick={handleLogout} className="btn btn-ghost" style={{ minHeight: '40px', padding: '8px 14px', borderRadius: '8px', fontSize: '14px' }}>Logout</button>
                    </div>
                </div>
            </header>

            <main className="container">
                {requiresPaymentSetup && (
                    <section
                        style={{
                            background: 'linear-gradient(135deg, #4f46e5 0%, #2563eb 100%)',
                            color: 'white',
                            marginBottom: '24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '18px',
                            padding: '24px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.16)',
                            flexWrap: 'wrap',
                        }}
                    >
                        <div style={{ maxWidth: '680px' }}>
                            <h2 style={{ marginBottom: '8px', color: 'white', fontSize: '22px' }}>Setup required to accept payments</h2>
                            <p style={{ opacity: 0.95, fontSize: '15px', lineHeight: 1.5 }}>
                                Your shop is currently in limited mode. {setupStatusCopy[stripeConnectStatus] || setupStatusCopy.onboarding}
                            </p>
                        </div>
                        <button
                            onClick={handleConnectStripe}
                            className="btn"
                            style={{
                                background: 'white',
                                color: '#1d4ed8',
                                fontWeight: 800,
                                minHeight: '44px',
                                padding: '10px 18px',
                                borderRadius: '8px',
                                fontSize: '14px',
                            }}
                        >
                            Complete Setup
                        </button>
                    </section>
                )}

                <section style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Order Queue</h2>
                        <p className="text-muted" style={{ fontSize: '14px' }}>
                            {orders.length} {orders.length === 1 ? 'order' : 'orders'} shown
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {FILTERS.map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setFilter(item.id)}
                                className={filter === item.id ? 'btn btn-primary' : 'btn btn-ghost'}
                                style={{ minHeight: '40px', padding: '8px 14px', borderRadius: '8px', fontSize: '14px' }}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>

                {ordersLoading && (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <div className="spinner" style={{ marginBottom: '16px' }}></div>
                        <p className="text-muted">Loading orders</p>
                    </div>
                )}

                {!ordersLoading && ordersFailed && (
                    <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
                        <h3 style={{ marginBottom: '8px' }}>Could not load orders</h3>
                        <p className="text-muted" style={{ marginBottom: '16px' }}>Refresh the queue or try again shortly.</p>
                        <button type="button" className="btn btn-primary" onClick={() => fetchOrders()} style={{ borderRadius: '8px' }}>
                            Refresh
                        </button>
                    </div>
                )}

                {!ordersLoading && !ordersFailed && orders.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: '56px' }}>
                        <h3 style={{ marginBottom: '8px' }}>No orders yet</h3>
                        <p className="text-muted">New orders will appear here as soon as they reach this vendor.</p>
                    </div>
                )}

                {!ordersLoading && !ordersFailed && orders.length > 0 && (
                    <div style={queueStyles}>
                        {lanes.map((lane) => (
                            <QueueLane
                                key={lane.id}
                                lane={lane}
                                orders={groupedOrders[lane.id] || []}
                                transitioningOrderId={transitioningOrderId}
                                onTransition={updateOrderStatus}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
