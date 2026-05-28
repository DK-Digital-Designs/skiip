import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { OrderService } from '../../lib/services/order.service';
import { StripeService } from '../../lib/services/stripe.service';
import { useCart } from '../../lib/hooks/useCart';
import { useToast } from '../../components/ui/Toast';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import StatusTimeline from '../../components/ui/StatusTimeline';
import BottomNav from '../../components/ui/BottomNav';
import Icon from '../../components/ui/Icon';
import BackButton from '../../components/ui/BackButton';
import { getScheduledCollectionLabel } from '../../lib/scheduledCollection';
import {
    canCancelUnpaidOrder,
    canContinuePendingPayment,
    getBuyerOrderStatusDescription,
    getBuyerOrderStatusLabel,
    getOrderStatusColor,
} from '../../lib/orders';
import { formatCurrency, formatOrderCode, getBuyerTimelineSteps } from '../../lib/ui-format';
import { trackSkiipEvent, trackSkiipEventOnce } from '../../lib/analytics';

export default function OrderTracker() {
    const navigate = useNavigate();
    const { orderId: pathOrderId } = useParams();
    const [searchParams] = useSearchParams();
    const { clearCart } = useCart();
    const { addToast } = useToast();

    const orderId = pathOrderId || searchParams.get('order_id');
    const isSuccess = searchParams.get('success') === 'true';
    const isCanceled = searchParams.get('canceled') === 'true';

    const [order, setOrder] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('connected');
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(isSuccess);
    const [actionBusy, setActionBusy] = useState(null);

    useEffect(() => {
        if (isCanceled) {
            trackSkiipEventOnce(`checkout_canceled:${orderId || 'missing'}`, 'checkout_canceled', { status: 'stripe_canceled' });
            addToast('Payment was not completed. You can continue payment or cancel the order.', 'info');
            if (orderId && !pathOrderId) {
                navigate(`/order/track/${orderId}`, { replace: true });
            }
        }

        if (isSuccess && orderId) {
            trackSkiipEventOnce(`checkout_completed:${orderId}`, 'checkout_completed', { status: 'stripe_success' });
            clearCart();
            if (!pathOrderId) {
                navigate(`/order/track/${orderId}`, { replace: true });
            }
        }

        if (!orderId) {
            setLoading(false);
            return undefined;
        }

        fetchOrder();

        if (!isSupabaseConfigured()) return undefined;

        const channel = supabase.channel(`order-${orderId}`);
        const subscription = channel
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`,
            }, (payload) => {
                setOrder((previous) => ({ ...previous, ...payload.new }));
            })
            .on('system', { event: '*' }, (payload) => {
                if (payload.extension === 'postgres_changes') {
                    if (payload.status === 'SUBSCRIBED') setConnectionStatus('connected');
                    if (payload.status === 'CHANNEL_ERROR') setConnectionStatus('error');
                    if (payload.status === 'TIMED_OUT') setConnectionStatus('reconnecting');
                }
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') setConnectionStatus('connected');
                if (status === 'CLOSED' || status === 'CHANNEL_ERROR') setConnectionStatus('error');
            });

        return () => {
            subscription.unsubscribe();
        };
    }, [orderId]);

    async function handleContinuePayment() {
        if (!order?.id) return;
        trackSkiipEvent('continue_payment_clicked', { status: order.status || 'unknown' });

        if (!isSupabaseConfigured()) {
            addToast('Demo mode: payment recovery simulated.', 'info');
            return;
        }

        setActionBusy('payment');
        try {
            const session = await StripeService.createCheckoutSession({
                orderId: order.id,
                returnUrl: window.location.origin + '/#/order/track',
            });

            if (session?.url) {
                window.location.href = session.url;
                return;
            }

            throw new Error('Failed to generate payment link');
        } catch (error) {
            console.error('Continue payment failed:', error);
            addToast(error.buyerMessage || 'Could not restart payment. Please try again.', 'error');
        } finally {
            setActionBusy(null);
        }
    }

    async function handleCancelOrder() {
        if (!order?.id) return;
        trackSkiipEvent('order_cancel_clicked', { status: order.status || 'unknown' });

        if (!isSupabaseConfigured()) {
            setOrder((current) => ({ ...current, status: 'cancelled' }));
            addToast('Demo mode: order cancelled.', 'info');
            return;
        }

        setActionBusy('cancel');
        try {
            const updatedOrder = await OrderService.updateOrderStatus(order.id, 'cancelled');
            setOrder((current) => ({
                ...current,
                ...(updatedOrder || {}),
                status: updatedOrder?.status || 'cancelled',
            }));
            addToast('Order cancelled.', 'success');
        } catch (error) {
            console.error('Cancel order failed:', error);
            addToast('Could not cancel this order. Refresh and try again.', 'error');
        } finally {
            setActionBusy(null);
        }
    }

    async function fetchOrder() {
        try {
            if (!isSupabaseConfigured()) {
                setOrder({
                    id: orderId,
                    order_number: 'ORD-20260512-DEMO',
                    status: 'preparing',
                    payment_status: 'succeeded',
                    total: 37,
                    subtotal: 37,
                    tip_amount: 0,
                    service_fee: 0,
                    created_at: new Date().toISOString(),
                    whatsapp_opt_in: true,
                    order_items: [
                        { quantity: 2, price: 11, product_snapshot: { name: 'Classic Cheeseburger', price: 11 } },
                        { quantity: 3, price: 5, product_snapshot: { name: 'Large Fries', price: 5 } },
                    ],
                });
                setVendor({ name: 'Burger Bliss', pickup_location: 'Food Court A, Stall 3' });
                setLoading(false);
                return;
            }

            const orderData = await OrderService.getOrderById(orderId);
            setOrder(orderData);

            if (orderData?.stores) {
                setVendor(orderData.stores);
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <main className="app-page app-page--buyer">
                <div className="narrow-container" style={{ display: 'grid', gap: '16px' }}>
                    <LoadingSkeleton height="180px" borderRadius="30px" />
                    <LoadingSkeleton height="270px" borderRadius="24px" />
                    <LoadingSkeleton height="180px" borderRadius="24px" />
                </div>
            </main>
        );
    }

    if (!order) {
        return (
            <main className="app-page app-page--buyer">
                <div className="narrow-container surface empty-state">
                    <h2>Order not found</h2>
                    <p>Please check your order ID and try again.</p>
                    <button type="button" className="btn btn-primary" onClick={() => navigate('/order')}>
                        Browse Vendors
                    </button>
                </div>
                <BottomNav />
            </main>
        );
    }

    const orderItems = order.order_items || [];
    const scheduledCollectionLabel = getScheduledCollectionLabel(order);
    const canContinuePayment = canContinuePendingPayment(order);
    const canCancelOrder = canCancelUnpaidOrder(order);
    const buyerStatusLabel = getBuyerOrderStatusLabel(order);
    const buyerStatusDescription = getBuyerOrderStatusDescription(order);
    const buyerStatusColor = getOrderStatusColor(order);
    const timelineSteps = getBuyerTimelineSteps(order);
    const orderCode = formatOrderCode(order);

    return (
        <main className="app-page app-page--buyer">
            {showSuccessOverlay && (
                <div className="dialog-backdrop">
                    <section className="dialog text-center">
                        <div style={{ width: 74, height: 74, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(34,197,94,0.14)', color: 'var(--green)', margin: '0 auto 18px' }}>
                            <Icon name="check" size={38} strokeWidth={2.6} />
                        </div>
                        <h1 style={{ color: 'var(--ink)', fontSize: '30px', marginBottom: '10px' }}>Payment successful</h1>
                        <p className="text-muted" style={{ marginBottom: '22px' }}>
                            Your order has been sent to the vendor.
                        </p>
                        <button type="button" className="btn btn-primary" onClick={() => setShowSuccessOverlay(false)}>
                            View Order Tracker
                        </button>
                    </section>
                </div>
            )}

            <div className="narrow-container" style={{ display: 'grid', gap: '20px' }}>
                <BackButton to="/order/profile" label="Back to my orders" style={{ width: 'fit-content' }} />
                <section className="surface" style={{ padding: '24px', borderRadius: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'start', flexWrap: 'wrap' }}>
                        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                            <p className="page-kicker">Live order status</p>
                            <h1 style={{ color: 'var(--ink)', fontSize: 'clamp(34px, 9vw, 62px)', lineHeight: 0.96, fontWeight: 950, marginTop: '12px', overflowWrap: 'anywhere' }}>
                                {orderCode}
                            </h1>
                        </div>
                        {vendor && (
                            <div style={{ textAlign: 'left', flex: '1 1 150px' }}>
                                <p className="text-muted" style={{ fontSize: '13px', fontWeight: 800 }}>Order from</p>
                                <h2 style={{ color: 'var(--ink)', fontSize: '22px', lineHeight: 1.1 }}>{vendor.name}</h2>
                            </div>
                        )}
                    </div>

                    <div className="chip" style={{ marginTop: '22px', color: buyerStatusColor, borderColor: `${buyerStatusColor}55`, background: `${buyerStatusColor}18` }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor', boxShadow: connectionStatus === 'connected' ? '0 0 10px currentColor' : 'none' }} />
                        {connectionStatus === 'connected' ? 'Live updates active' : connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Refresh for latest status'}
                    </div>
                </section>

                {(canContinuePayment || canCancelOrder) && (
                    <section className="card" style={{ borderColor: 'rgba(245,158,11,0.45)' }}>
                        <h2 style={{ color: 'var(--ink)', marginBottom: '8px' }}>Payment needed</h2>
                        <p className="text-muted" style={{ marginBottom: '16px' }}>
                            This order has not been paid for yet. Continue payment or cancel it if you no longer need it.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {canContinuePayment && (
                                <button type="button" className="btn btn-primary" disabled={Boolean(actionBusy)} onClick={handleContinuePayment}>
                                    {actionBusy === 'payment' ? 'Opening payment...' : 'Continue payment'}
                                </button>
                            )}
                            {canCancelOrder && (
                                <button type="button" className="btn btn-ghost" disabled={Boolean(actionBusy)} onClick={handleCancelOrder} style={{ color: 'var(--red)' }}>
                                    {actionBusy === 'cancel' ? 'Cancelling...' : 'Cancel order'}
                                </button>
                            )}
                        </div>
                    </section>
                )}

                <section className="card">
                    <StatusTimeline steps={timelineSteps} />
                    {buyerStatusDescription && (
                        <p className="chip chip--accent" style={{ marginTop: '20px', width: 'fit-content' }}>
                            {buyerStatusLabel}: {buyerStatusDescription}
                        </p>
                    )}
                    <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => navigate(`/report-issue?order_id=${order.id}`)}
                        style={{ marginTop: '20px' }}
                    >
                        Report an issue
                    </button>
                </section>

                <section className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'start', marginBottom: '18px' }}>
                        <div>
                            <h2 style={{ color: 'var(--ink)', fontSize: '22px' }}>Order summary</h2>
                            {scheduledCollectionLabel && (
                                <p className="chip chip--cyan" style={{ marginTop: '10px', width: 'fit-content' }}>
                                    Scheduled: {scheduledCollectionLabel}
                                </p>
                            )}
                        </div>
                        <span className={order.whatsapp_opt_in ? 'chip chip--green' : 'chip'}>
                            WhatsApp {order.whatsapp_opt_in ? 'active' : 'inactive'}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        {orderItems.map((item, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                                <span>
                                    <strong>{item.quantity}x</strong> {item.product_snapshot?.name || 'Item'}
                                </span>
                                <span>{formatCurrency(Number(item.price || 0) * Number(item.quantity || 0))}</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gap: '10px', marginTop: '18px', paddingTop: '18px', borderTop: '2px solid var(--stroke)' }}>
                        {Number(order.tip_amount || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                                <span className="text-muted">Tip</span>
                                <span>{formatCurrency(order.tip_amount)}</span>
                            </div>
                        )}
                        {Number(order.service_fee || 0) > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px' }}>
                                <span className="text-muted">Service Fees</span>
                                <span>{formatCurrency(order.service_fee)}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 950 }}>
                            <span>Total paid</span>
                            <span className="text-accent">{formatCurrency(order.total)}</span>
                        </div>
                    </div>
                </section>

                {order.status === 'ready' && (
                    <section className="card" style={{ borderColor: 'rgba(34,197,94,0.45)', background: 'rgba(34,197,94,0.08)' }}>
                        <h2 style={{ color: 'var(--green)', marginBottom: '8px' }}>Your order is ready</h2>
                        <p>Head to the vendor pickup location and show this screen when collecting.</p>
                        {vendor?.pickup_location && <p className="text-muted" style={{ marginTop: '8px' }}>{vendor.pickup_location}</p>}
                    </section>
                )}
            </div>
            <BottomNav />
        </main>
    );
}
