import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { OrderService } from '../../lib/services/order.service';
import { useCart } from '../../lib/hooks/useCart';
import { useToast } from '../../components/ui/Toast';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';

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

    useEffect(() => {
        if (isCanceled) {
            addToast('Payment cancelled. Your cart is preserved.', 'info');
            navigate('/order'); // Go back to vendors
            return;
        }

        if (isSuccess && orderId) {
            clearCart();
            addToast('Payment successful! Tracking your order...', 'success');
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

    return (
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
                <div className="card" style={{ textAlign: 'center', padding: '40px', marginBottom: '24px', border: `2px solid ${statusConfig.color}` }}>
                    <div style={{ fontSize: '60px', marginBottom: '16px' }}>{statusConfig.icon}</div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: statusConfig.color }}>
                        {statusConfig.label}
                    </h1>
                    <p className="text-muted">Order #{order.id.slice(0, 8)}</p>
                </div>

                {/* Vendor Info */}
                {vendor && (
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '12px' }}>Vendor</h3>
                        <p style={{ fontWeight: '600', fontSize: '18px', marginBottom: '4px' }}>{vendor.name}</p>
                        {vendor.pickup_location && (
                            <p className="text-accent">📍 Pickup at: {vendor.pickup_location}</p>
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
    );
}
