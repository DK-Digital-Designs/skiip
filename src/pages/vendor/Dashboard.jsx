import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

const STATUS_COLORS = {
    pending_payment: '#9b9ba5',
    preparing: '#f59e0b',
    ready: '#10b981',
    collected: '#8b5cf6',
    cancelled: '#ef4444',
};

export default function VendorDashboard() {
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // active | all

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (vendor) {
            fetchOrders();

            // Subscribe to realtime order updates
            const subscription = supabase
                .channel('vendor-orders')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `vendor_id=eq.${vendor.id}`
                }, () => {
                    fetchOrders();
                    playNotificationSound();
                })
                .subscribe();

            return () => subscription.unsubscribe();
        }
    }, [vendor, filter]);

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/vendor/login');
            return;
        }

        const { data: vendorData } = await supabase
            .from('vendors')
            .select('*')
            .eq('email', user.email)
            .single();

        setVendor(vendorData);
        setLoading(false);
    }

    async function fetchOrders() {
        if (!vendor) return;

        let query = supabase
            .from('orders')
            .select('*')
            .eq('vendor_id', vendor.id)
            .order('created_at', { ascending: false });

        if (filter === 'active') {
            query = query.in('status', ['preparing', 'ready']);
        }

        const { data } = await query;
        setOrders(data || []);
    }

    async function updateOrderStatus(orderId, newStatus) {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId);

        if (!error) {
            fetchOrders();
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut();
        navigate('/vendor/login');
    }

    function playNotificationSound() {
        // Play a simple beep notification
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVang8bllHAU2jdXy0Ho0Bitu/fDckUoLEV61/O+jWRMLRp3i8rltIAU1idLy1YU1BiJwwu/gl0gNDlSn4PK8aCAFNYzU8tN+MwYpasPv4ppIDg5Tp9/yu2kgBTWL1PLTfzMGKWrD7+KbSA4OU6ff8rtoIAU0i9Ty038zBilqw+/im0gODlKn3/K7aSAFNIvU8tN/MwYpasLv45tIDg5Sp9/yu2kgBTSL1PLTfzMGKWu/7+OaRg4MU6fe8rxoH');
        audio.play().catch(() => { }); // Ignore errors
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{ padding: '20px 0', borderBottom: '1px solid var(--stroke)', marginBottom: '40px' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>{vendor?.name}</h1>
                        <p className="text-muted" style={{ fontSize: '14px' }}>Vendor Dashboard</p>
                    </div>
                    <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
                </div>
            </header>

            <div className="container">
                {/* Filter Tabs */}
                <div style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
                    <button
                        onClick={() => setFilter('active')}
                        className={filter === 'active' ? 'btn btn-primary' : 'btn btn-ghost'}
                    >
                        Active Orders
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={filter === 'all' ? 'btn btn-primary' : 'btn btn-ghost'}
                    >
                        All Orders
                    </button>
                </div>

                {/* Orders Grid */}
                {orders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                        <h3>No orders yet</h3>
                        <p className="text-muted">New orders will appear here</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {orders.map((order) => (
                            <div key={order.id} className="card" style={{ borderLeft: `4px solid ${STATUS_COLORS[order.status]}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '4px' }}>Order #{order.id.slice(0, 8)}</h3>
                                        <p className="text-muted" style={{ fontSize: '14px' }}>
                                            {new Date(order.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '20px', fontWeight: '700', color: STATUS_COLORS[order.status] }}>
                                            {order.status.replace('_', ' ').toUpperCase()}
                                        </p>
                                        <p style={{ fontSize: '14px' }}>📱 {order.customer_phone}</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span>{item.quantity}× {item.name}</span>
                                            <span>R{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--stroke)', fontWeight: '700' }}>
                                        <span>Total</span>
                                        <span className="text-accent">R{order.total_amount.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {order.status === 'preparing' && (
                                        <button onClick={() => updateOrderStatus(order.id, 'ready')} className="btn btn-primary">
                                            ✅ Mark as Ready
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <button onClick={() => updateOrderStatus(order.id, 'collected')} className="btn btn-primary">
                                            🎉 Mark as Collected
                                        </button>
                                    )}
                                    {(order.status === 'preparing' || order.status === 'ready') && (
                                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="btn btn-ghost" style={{ color: '#ef4444' }}>
                                            ❌ Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
