import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const STATUS_CONFIG = {
    pending_payment: { label: 'Payment Pending', color: '#9b9ba5', icon: '⏳' },
    preparing: { label: 'Preparing', color: '#f59e0b', icon: '👨‍🍳' },
    ready: { label: 'Ready for Pickup', color: '#10b981', icon: '✅' },
    collected: { label: 'Collected', color: '#8b5cf6', icon: '🎉' },
    cancelled: { label: 'Cancelled', color: '#ef4444', icon: '❌' },
};

export default function OrderTracker() {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [vendor, setVendor] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrder();

        // Subscribe to realtime updates
        const subscription = supabase
            .channel(`order-${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`
            }, (payload) => {
                setOrder(payload.new);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [orderId]);

    async function fetchOrder() {
        try {
            const { data: orderData } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            setOrder(orderData);

            if (orderData) {
                const { data: vendorData } = await supabase
                    .from('vendors')
                    .select('*')
                    .eq('id', orderData.vendor_id)
                    .single();

                setVendor(vendorData);
            }
        } catch (error) {
            console.error('Error:', error);
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

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.preparing;

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px', background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, var(--bg) 100%)' }}>
            <div className="container" style={{ maxWidth: '600px', paddingTop: '60px' }}>
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
                    </div>
                )}

                {/* Order Details */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Order Details</h3>
                    {order.items && order.items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span>{item.quantity}× {item.name}</span>
                            <span>R{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--stroke)', fontSize: '18px', fontWeight: '700' }}>
                        <span>Total</span>
                        <span className="text-accent">R{order.total_amount.toFixed(2)}</span>
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
