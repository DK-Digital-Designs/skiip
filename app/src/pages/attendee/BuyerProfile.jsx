import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export default function BuyerProfile() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            navigate('/order/login', { replace: true });
            return;
        }

        async function fetchHistory() {
            if (!isSupabaseConfigured()) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, stores(name, logo_url)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!error && data) setOrders(data);
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [user, navigate]);

    if (!user) return null;

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="container" style={{ paddingBottom: '40px', marginTop: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>My Profile</h1>

                <div className="card mb-40">
                    <div className="flex gap-16 items-center">
                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent)', color: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                            {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h3 style={{ marginBottom: '4px' }}>{user.user_metadata?.full_name || 'Guest User'}</h3>
                            <p className="text-muted">{user.email}</p>
                        </div>
                    </div>
                </div>

                <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Recent Orders</h2>
                {loading ? (
                    <p className="text-muted">Loading history...</p>
                ) : orders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                        <p className="text-muted">You haven't placed any orders yet.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-16">
                        {orders.map(order => (
                            <div key={order.id} className="card flex justify-between items-center" onClick={() => navigate(`/order/track/${order.id}`)} style={{ cursor: 'pointer', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                <div className="flex gap-16 items-center">
                                    {order.stores?.logo_url ? (
                                        <img src={order.stores.logo_url} alt={order.stores.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            🍽️
                                        </div>
                                    )}
                                    <div>
                                        <h4 style={{ marginBottom: '4px' }}>{order.stores?.name || 'Unknown Store'}</h4>
                                        <p className="text-muted" style={{ fontSize: '13px' }}>
                                            {new Date(order.created_at).toLocaleDateString()} • {order.order_number}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h4 style={{ marginBottom: '4px' }}>£{parseFloat(order.total).toFixed(2)}</h4>
                                    <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', background: order.status === 'collected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)', color: order.status === 'collected' ? '#10b981' : '#f59e0b' }}>
                                        {order.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
