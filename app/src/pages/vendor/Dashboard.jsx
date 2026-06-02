import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';
import { StoreService } from '../../lib/services/store.service';
import { StripeService } from '../../lib/services/stripe.service';
import { useToast } from '../../components/ui/Toast';
import { useStoreOrders, useUpdateOrderStatus } from '../../lib/hooks/useOrders';
import { getScheduledCollectionLabel } from '../../lib/scheduledCollection';
import HoldToConfirmButton from '../../components/ui/HoldToConfirmButton';
import Icon from '../../components/ui/Icon';
import {
    VENDOR_ORDER_FILTERS,
    VENDOR_ORDER_LANE_DEFINITIONS,
    getAllowedOrderTransitions,
    getOrderStatusLabel,
    getVendorOrderFilterLaneIds,
    getVendorOrderQueryFilter,
    getVendorLaneEmptyMessage,
    getVendorOrderActionHint,
    getVendorOrderItemSummary,
    getVendorPrimaryTransition,
    getVendorTransitionSuccessMessage,
    groupVendorOrdersByLane,
} from '../../lib/orders';
import { formatCurrency, formatOrderCode, getQueueVisual, getVendorActionClass, shouldShowVendorCancel } from '../../lib/ui-format';

function getOrderTotal(order) {
    return Number(order?.total ?? order?.total_amount ?? 0);
}

function getVendorGross(order) {
    return Number(order?.subtotal || 0) + Number(order?.tip_amount || 0);
}

function getOrderContact(order) {
    if (order?.customer_phone) {
        return { label: order.customer_phone, href: `tel:${order.customer_phone}`, type: 'Phone' };
    }

    if (order?.customer_email) {
        return { label: order.customer_email, href: `mailto:${order.customer_email}`, type: 'Email' };
    }

    return { label: 'No buyer contact', href: null, type: 'Contact' };
}

function getLaneDefinitions(filter) {
    const laneIds = getVendorOrderFilterLaneIds(filter);
    return laneIds
        .map((laneId) => VENDOR_ORDER_LANE_DEFINITIONS.find((lane) => lane.id === laneId))
        .filter(Boolean);
}

function VendorOrderCard({ order, isBusy, onTransition }) {
    const scheduledCollectionLabel = getScheduledCollectionLabel(order);
    const allowedTransitions = getAllowedOrderTransitions(order.status);
    const primaryTransition = getVendorPrimaryTransition(order.status);
    const canCancel = shouldShowVendorCancel(order);
    const contact = getOrderContact(order);
    const itemSummary = getVendorOrderItemSummary(order);
    const actionHint = getVendorOrderActionHint(order);
    const visual = getQueueVisual(order.status);

    return (
        <article className={`order-card ${visual.cardClass}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start' }}>
                <div>
                    <p className="page-kicker" style={{ color: 'var(--text-soft)' }}>Order</p>
                    <h3 style={{ color: 'var(--ink)', fontSize: '24px', lineHeight: 1.05 }}>{formatOrderCode(order)}</h3>
                    <p className="text-muted" style={{ fontSize: '12px', marginTop: '5px' }}>
                        {order.created_at ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time unknown'}
                    </p>
                    <p className="text-muted" style={{ fontSize: '13px', marginTop: '6px' }}>{itemSummary}</p>
                </div>
                <span className="chip chip--accent" style={{ textAlign: 'right' }}>
                    {getOrderStatusLabel(order)}
                </span>
            </div>

            {scheduledCollectionLabel && (
                <div className="chip chip--cyan" style={{ width: 'fit-content' }}>
                    <Icon name="clock" size={15} />
                    Collection: {scheduledCollectionLabel}
                </div>
            )}

            <div style={{ display: 'grid', gap: '8px' }}>
                {(order.order_items || []).length === 0 ? (
                    <p className="text-muted" style={{ fontSize: '13px' }}>Item details are not available for this order.</p>
                ) : (
                    (order.order_items || []).map((item, index) => (
                        <div key={`${order.id || 'order'}-${index}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '8px', fontSize: '14px' }}>
                            <span style={{ overflowWrap: 'anywhere' }}>
                                <strong>{item.quantity}x</strong> {item.product_snapshot?.name || 'Item'}
                            </span>
                            <span>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</span>
                        </div>
                    ))
                )}
                {order.notes && (
                    <div style={{ padding: '9px 10px', borderRadius: '12px', background: 'var(--surface-muted)', color: 'var(--text-muted)', fontSize: '13px', overflowWrap: 'anywhere' }}>
                        Note: {order.notes}
                    </div>
                )}
            </div>

            <div style={{ display: 'grid', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--stroke)', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 900 }}>
                    <span>Buyer total</span>
                    <span className="text-accent">{formatCurrency(getOrderTotal(order))}</span>
                </div>
                {Number(order.service_fee || 0) > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                        <span className="text-muted">Vendor gross</span>
                        <span>{formatCurrency(getVendorGross(order))}</span>
                    </div>
                )}
                <div>
                    <span className="text-muted" style={{ fontSize: '12px', display: 'block' }}>{contact.type}</span>
                    {contact.href ? (
                        <a href={contact.href} className="text-accent" style={{ overflowWrap: 'anywhere', textDecoration: 'none', fontWeight: 850 }}>
                            {contact.label}
                        </a>
                    ) : (
                        <span className="text-muted">{contact.label}</span>
                    )}
                </div>
                <div style={{ padding: '9px 10px', borderRadius: '12px', background: 'var(--surface-muted)', color: 'var(--text-muted)' }}>
                    {actionHint}
                </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {primaryTransition && allowedTransitions.includes(primaryTransition.status) && (
                    <button
                        type="button"
                        className={`btn ${getVendorActionClass(primaryTransition.status)}`}
                        disabled={isBusy}
                        onClick={() => onTransition(order, primaryTransition.status)}
                        style={{ minHeight: '40px', padding: '9px 13px' }}
                    >
                        {isBusy ? 'Updating...' : primaryTransition.label}
                    </button>
                )}
                {canCancel && (
                    <HoldToConfirmButton
                        disabled={isBusy}
                        onConfirm={() => onTransition(order, 'cancelled')}
                        style={{ minHeight: '40px', padding: '9px 13px' }}
                    >
                        {isBusy ? 'Updating...' : 'Cancel'}
                    </HoldToConfirmButton>
                )}
            </div>
        </article>
    );
}

function QueueLane({ lane, orders, transitioningOrderId, onTransition }) {
    const visual = getQueueVisual(lane.id);

    return (
        <section className={`queue-lane ${visual.laneClass}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start', marginBottom: '14px' }}>
                <div>
                    <h2 style={{ color: 'var(--ink)', fontSize: '18px', fontWeight: 950, lineHeight: 1.2 }}>{lane.title}</h2>
                    <p className="text-muted" style={{ fontSize: '12px', lineHeight: 1.35, marginTop: '4px' }}>{lane.description}</p>
                </div>
                <span className="chip chip--accent">{orders.length}</span>
            </div>

            {orders.length === 0 ? (
                <div className="empty-state" style={{ minHeight: '150px', border: '1px dashed var(--stroke)', borderRadius: '16px' }}>
                    <p>{getVendorLaneEmptyMessage(lane.id)}</p>
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
    const [filter, setFilter] = useState('paid');
    const [transitioningOrderId, setTransitioningOrderId] = useState(null);
    const previousOrderIdsRef = useRef(new Set());
    const { addToast } = useToast();

    const queryFilter = getVendorOrderQueryFilter(filter);
    const { data: orders = [], refetch: fetchOrders, isLoading: ordersLoading, isError: ordersFailed } = useStoreOrders(store?.id, queryFilter);
    const updateOrderStatusMutation = useUpdateOrderStatus();
    const lanes = useMemo(() => getLaneDefinitions(filter), [filter]);
    const groupedOrders = useMemo(
        () => groupVendorOrdersByLane(orders, lanes.map((lane) => lane.id)),
        [orders, lanes],
    );
    const visibleOrderCount = lanes.reduce((count, lane) => count + (groupedOrders[lane.id]?.length || 0), 0);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (!orders.length) return;

        const currentIds = new Set(orders.map((order) => order.id));
        const hasNewOrder = orders.some((order) => !previousOrderIdsRef.current.has(order.id));
        if (previousOrderIdsRef.current.size > 0 && hasNewOrder) {
            addToast('New order received.', 'success');
            playNotificationSound();
        }
        previousOrderIdsRef.current = currentIds;
    }, [orders, addToast]);

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
                })
                .subscribe();

            return () => subscription.unsubscribe();
        }
        return undefined;
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
                addToast('No store found for this account.', 'error');
                navigate('/');
                return;
            }

            const stripeReturned = new URLSearchParams(location.search).get('stripe_return') === '1';
            if (stripeReturned) {
                const { store: reconciledStore } = await StripeService.reconcileConnectStatus({ storeId: storeData.id });
                setStore(reconciledStore || storeData);
                addToast(
                    reconciledStore?.stripe_connect_status === 'ready'
                        ? 'Payment setup complete. Your shop can accept orders.'
                        : 'Payment setup still needs attention before orders can open.',
                    reconciledStore?.stripe_connect_status === 'ready' ? 'success' : 'info',
                );
                navigate('/vendor/dashboard', { replace: true });
                return;
            }

            setStore(storeData);
        } catch (error) {
            console.error('Auth check failed:', error);
            addToast(`Auth error: ${error.message || 'Unknown error'}`, 'error');
            navigate('/login');
        } finally {
            setLoading(false);
        }
    }

    async function updateOrderStatus(order, newStatus) {
        if (newStatus === 'cancelled' && ['preparing', 'ready', 'collected'].includes(order?.status)) {
            addToast('Orders cannot be cancelled once preparation has started.', 'error');
            return;
        }

        if (!isSupabaseConfigured()) {
            addToast('Demo mode: status update simulated', 'info');
            return;
        }

        setTransitioningOrderId(order.id);
        updateOrderStatusMutation.mutate(
            { orderId: order.id, status: newStatus },
            {
                onSuccess: () => addToast(getVendorTransitionSuccessMessage(newStatus), 'success'),
                onError: (error) => {
                    console.error('Error updating status:', error);
                    addToast('Could not update the order. Refresh the queue and try again.', 'error');
                },
                onSettled: () => setTransitioningOrderId(null),
            },
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
        audio.play().catch(() => {});
    }

    async function handleConnectStripe() {
        if (!isSupabaseConfigured()) {
            addToast('Demo mode: onboarding simulated', 'info');
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
                return;
            }
            throw new Error('Failed to generate onboarding link');
        } catch (error) {
            console.error('Onboarding failed:', error);
            addToast('Failed to start onboarding. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <main className="app-page">
                <div className="surface empty-state">
                    <div className="spinner" style={{ width: '40px', height: '40px' }} />
                    <p>Loading vendor portal</p>
                </div>
            </main>
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
        <main className="app-page">
            <div className="container" style={{ display: 'grid', gap: '22px' }}>
                <section style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <p className="page-kicker">Vendor portal</p>
                        <h1 className="page-title" style={{ fontSize: 'clamp(30px, 4vw, 42px)' }}>{store?.name}</h1>
                        <p className="page-subtitle">Live order queue with realtime updates.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={() => navigate('/vendor/profile')} className="btn btn-ghost">Profile</button>
                        <button type="button" onClick={() => navigate('/vendor/products')} className="btn btn-purple">Products</button>
                        <button type="button" onClick={handleLogout} className="btn btn-ghost">Logout</button>
                    </div>
                </section>

                {requiresPaymentSetup && (
                    <section className="hero-panel" style={{ minHeight: 'auto' }}>
                        <div className="hero-panel__content" style={{ minHeight: 'auto', maxWidth: '860px' }}>
                            <h2 style={{ fontSize: '30px' }}>Setup required to accept payments</h2>
                            <p>Your shop is currently in limited mode. {setupStatusCopy[stripeConnectStatus] || setupStatusCopy.onboarding}</p>
                            <button type="button" onClick={handleConnectStripe} className="btn btn-primary" style={{ width: 'fit-content', marginTop: '16px' }}>
                                Complete Setup
                            </button>
                        </div>
                    </section>
                )}

                <section className="surface" style={{ padding: '18px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '16px', flexWrap: 'wrap' }}>
                        <div>
                            <h2 style={{ color: 'var(--ink)', fontSize: '24px' }}>Order Queue</h2>
                            <p className="text-muted">{visibleOrderCount} {visibleOrderCount === 1 ? 'order' : 'orders'} shown</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {VENDOR_ORDER_FILTERS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setFilter(item.id)}
                                    className={filter === item.id ? 'btn btn-purple' : 'btn btn-ghost'}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {ordersLoading && (
                    <div className="surface empty-state">
                        <div className="spinner" />
                        <p>Loading orders</p>
                    </div>
                )}

                {!ordersLoading && ordersFailed && (
                    <div className="surface empty-state">
                        <h3>Could not load orders</h3>
                        <p>Refresh the queue or try again shortly.</p>
                        <button type="button" className="btn btn-primary" onClick={() => fetchOrders()}>
                            Refresh
                        </button>
                    </div>
                )}

                {!ordersLoading && !ordersFailed && orders.length === 0 && (
                    <div className="surface empty-state">
                        <h3>No orders yet</h3>
                        <p>New orders will appear here as soon as they reach this vendor.</p>
                    </div>
                )}

                {!ordersLoading && !ordersFailed && orders.length > 0 && (
                    <div className="queue-grid">
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
            </div>
        </main>
    );
}
