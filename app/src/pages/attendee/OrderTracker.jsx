import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { OrderService } from '../../lib/services/order.service';
import { StripeService } from '../../lib/services/stripe.service';
import { useCart } from '../../lib/hooks/useCart';
import { useToast } from '../../components/ui/Toast';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import { getScheduledCollectionLabel } from '../../lib/scheduledCollection';
import {
    canCancelUnpaidOrder,
    canContinuePendingPayment,
    getBuyerOrderStatusDescription,
    getBuyerOrderStatusLabel,
    getOrderStatusColor,
} from '../../lib/orders';

const STATUS_CONFIG = {
    pending: { label: 'Order Placed', color: '#9b9ba5', icon: '📝' },
    paid: { label: 'Payment Received', color: '#3b82f6', icon: '💳' },
    preparing: { label: 'Preparing', color: '#f59e0b', icon: '👨‍🍳' },
    ready: { label: 'Ready for Pickup', color: '#10b981', icon: '✅' },
    collected: { label: 'Collected', color: '#8b5cf6', icon: '🎉' },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: '❌' },
};

export default function OrderTracker() {
    const navigate = useNavigate();
    const { orderId: pathOrderId } = useParams();
    const [searchParams] = useSearchParams();
    const { clearCart } = useCart();
    const { addToast } = useToast();

    // Support both /track/:id and /track?order_id=... (Stripe redirect)
    const orderId = pathOrderId || searchParams.get('order_id');
    const isSuccess = searchParams.get('success') === 'true';
    const isCanceled = searchParams.get('canceled') === 'true';

    const [order, setOrder] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState('connected'); // connected, reconnecting, error
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(isSuccess);
    const [actionBusy, setActionBusy] = useState(null);

    useEffect(() => {
        if (isCanceled) {
            addToast('Payment was not completed. You can continue payment or cancel the order.', 'info');
            if (orderId && !pathOrderId) {
                navigate(`/order/track/${orderId}`, { replace: true });
            }
        }

        if (isSuccess && orderId) {
            clearCart();
            // We use the overlay now, but keep the URL clean
            if (!pathOrderId) {
                navigate(`/order/track/${orderId}`, { replace: true });
            }
        }

        if (!orderId) {
            setLoading(false);
            return;
        }

        fetchOrder();

        if (!isSupabaseConfigured()) return;

        // Subscribe to realtime updates
        const channel = supabase.channel(`order-${orderId}`);

        const subscription = channel
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`
            }, (payload) => {
                setOrder(prev => ({ ...prev, ...payload.new }));
            })
            .on('system', { event: '*' }, (payload) => {
                // Monitor connection health
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
                // Demo mode
                setOrder({
                    id: orderId,
                    status: 'preparing',
                    total: 18.00,
                    created_at: new Date().toISOString(),
                    order_items: [
                        { quantity: 2, price: 9, product_snapshot: { name: 'Demo Burger', price: 9 } }
                    ]
                });
                setVendor({ name: 'Burger Bliss (Demo)', pickup_location: 'Food Court A' });
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
            <div className="container" style={{ maxWidth: '600px', paddingTop: '60px' }}>
                <LoadingSkeleton height="200px" marginBottom="24px" borderRadius="12px" />
                <LoadingSkeleton height="100px" marginBottom="24px" borderRadius="12px" />
                <LoadingSkeleton height="200px" borderRadius="12px" />
            </div>
        );
    }

    if (!order) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <h2>Order not found</h2>
                    <p className="text-muted">Please check your order ID and try again.</p>
                </div>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const orderItems = order.order_items || [];
    const scheduledCollectionLabel = getScheduledCollectionLabel(order);
    const canContinuePayment = canContinuePendingPayment(order);
    const canCancelOrder = canCancelUnpaidOrder(order);
    const buyerStatusLabel = getBuyerOrderStatusLabel(order);
    const buyerStatusDescription = getBuyerOrderStatusDescription(order);
    const buyerStatusColor = getOrderStatusColor(order);

    return (
        <>
            {showSuccessOverlay && (
                <div style={{ 
                    position: 'fixed', 
                    inset: 0, 
                    zIndex: 9999, 
                    background: 'var(--bg)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    textAlign: 'center', 
                    padding: '20px' 
                }}>
                    <div style={{ fontSize: '80px', marginBottom: '20px', animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
                        🎉
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '16px', color: '#10b981' }}>
                        Payment Successful!
                    </h1>
                    <p className="text-muted" style={{ fontSize: '18px', maxWidth: '400px', marginBottom: '32px', lineHeight: '1.5' }}>
                        Your order has been sent to the vendor. No further action is required.
                    </p>
                    <button 
                        className="btn btn-primary" 
                        onClick={() => setShowSuccessOverlay(false)}
                        style={{ padding: '16px 32px', fontSize: '18px' }}
                    >
                        View Order Tracker
                    </button>
                    <style>{`
                        @keyframes popIn {
                            0% { transform: scale(0.5); opacity: 0; }
                            100% { transform: scale(1); opacity: 1; }
                        }
                    `}</style>
                </div>
            )}
        <div style={{ minHeight: '100vh', paddingBottom: '40px', background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, var(--bg) 100%)' }}>
            <div className="container" style={{ maxWidth: '600px', paddingTop: '60px' }}>
                {/* Connection Status Badge */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'reconnecting' ? '#f59e0b' : '#ef4444'
                }}>
                    <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'currentColor',
                        boxShadow: connectionStatus === 'connected' ? '0 0 8px rgba(16, 185, 129, 0.5)' : 'none'
                    }} />
                    {connectionStatus === 'connected' ? 'Live Updates Active' : connectionStatus === 'reconnecting' ? 'Reconnecting to live updates...' : 'Connection Lost. Refresh page.'}
                </div>

                {/* Status Card */}
                <div className="card" style={{ textAlign: 'center', padding: '40px', marginBottom: '24px', border: `2px solid ${buyerStatusColor}` }}>
                    <div style={{ fontSize: '60px', marginBottom: '16px' }}>{statusConfig.icon}</div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: buyerStatusColor }}>
                        {buyerStatusLabel}
                    </h1>
                    <p className="text-muted">Order #{order.id.slice(0, 8)}</p>
                    {buyerStatusDescription && (
                        <p className="text-muted" style={{ maxWidth: '360px', margin: '12px auto 0', lineHeight: 1.5 }}>
                            {buyerStatusDescription}
                        </p>
                    )}
                </div>

                {(canContinuePayment || canCancelOrder) && (
                    <div className="card" style={{ marginBottom: '24px', border: '1px solid rgba(245, 158, 11, 0.45)' }}>
                        <h3 style={{ marginBottom: '8px' }}>Payment needed</h3>
                        <p className="text-muted" style={{ marginBottom: '16px', lineHeight: 1.5 }}>
                            This order has not been paid for yet. Continue to secure payment or cancel it if you no longer need it.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {canContinuePayment && (
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={Boolean(actionBusy)}
                                    onClick={handleContinuePayment}
                                    style={{ minHeight: '42px', borderRadius: '8px' }}
                                >
                                    {actionBusy === 'payment' ? 'Opening payment...' : 'Continue payment'}
                                </button>
                            )}
                            {canCancelOrder && (
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    disabled={Boolean(actionBusy)}
                                    onClick={handleCancelOrder}
                                    style={{ minHeight: '42px', borderRadius: '8px', color: '#f87171' }}
                                >
                                    {actionBusy === 'cancel' ? 'Cancelling...' : 'Cancel order'}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Vendor Info */}
                {vendor && (
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '12px' }}>Vendor</h3>
                        <p style={{ fontWeight: '600', fontSize: '18px', marginBottom: '4px' }}>{vendor.name}</p>
                        {vendor.pickup_location && (
                            <p className="text-accent">📍 Pickup at: {vendor.pickup_location}</p>
                        )}

                        {scheduledCollectionLabel && (
                            <p className="text-accent" style={{ marginTop: '8px' }}>
                                Scheduled collection: {scheduledCollectionLabel}
                            </p>
                        )}

                        <div style={{ marginTop: '12px' }}>
                            <span
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 10px',
                                    borderRadius: '999px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    background: order.whatsapp_opt_in ? 'rgba(16, 185, 129, 0.14)' : 'rgba(107, 114, 128, 0.12)',
                                    color: order.whatsapp_opt_in ? '#047857' : '#6b7280',
                                    border: `1px solid ${order.whatsapp_opt_in ? 'rgba(16, 185, 129, 0.35)' : 'rgba(107, 114, 128, 0.25)'}`,
                                }}
                            >
                                {order.whatsapp_opt_in ? '📱 WhatsApp updates active' : '📱 WhatsApp updates inactive'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Order Details */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Order Details</h3>
                    {orderItems.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span>{item.quantity}× {item.product_snapshot?.name || 'Item'}</span>
                            <span>£{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--stroke)', fontSize: '18px', fontWeight: '700' }}>
                        <span>Total</span>
                        <span className="text-accent">£{order.total?.toFixed(2) ?? '0.00'}</span>
                    </div>
                </div>

                {/* Instructions */}
                {order.status === 'ready' && (
                    <div className="card" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981' }}>
                        <h3 style={{ marginBottom: '12px', color: '#10b981' }}>⚡ Your order is ready!</h3>
                        <p>Head to the vendor's pickup location to collect your order.</p>
                        <p className="text-muted" style={{ fontSize: '13px', marginTop: '8px' }}>
                            Show this screen to the vendor when collecting.
                        </p>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}
