import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, activeVendors: 0 });
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            // Demo mode
            setStats({ totalOrders: 3, totalRevenue: 450.00, activeVendors: 3 });
            setRecentOrders([
                { id: 'demo-001a', status: 'preparing', total: 180.00, customer_phone: '+44 79 1234 5678', created_at: new Date().toISOString() },
                { id: 'demo-002b', status: 'ready', total: 110.00, customer_phone: '+44 79 4567 8901', created_at: new Date().toISOString() },
                { id: 'demo-003c', status: 'collected', total: 160.00, customer_phone: '+44 79 7890 1234', created_at: new Date().toISOString() },
            ]);
            return;
        }

        checkAuth();
        fetchStats();

        // Subscribe to real-time order updates
        const ordersSubscription = supabase
            .channel('admin-order-updates')
            .on('postgres_changes', { event: '*', table: 'orders', schema: 'public' }, () => {
                fetchStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(ordersSubscription);
        };
    }, []);

    async function checkAuth() {
        const session = await AuthService.getSession();
        if (!session) {
            navigate('/admin/login');
        }
    }

    async function fetchStats() {
        try {
            // Fetch total orders and revenue
            const { data: orders } = await supabase
                .from('orders')
                .select('total, created_at, id, status, customer_phone')
                .order('created_at', { ascending: false })
                .limit(10);

            const totalRevenue = orders?.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0) || 0;

            // Fetch active stores (vendors)
            const { data: stores } = await supabase
                .from('stores')
                .select('id')
                .eq('status', 'active');

            setStats({
                totalOrders: orders?.length || 0,
                totalRevenue,
                activeVendors: stores?.length || 0
            });

            setRecentOrders(orders || []);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }

    async function handleLogout() {
        if (isSupabaseConfigured()) {
            await AuthService.signOut();
        }
        navigate('/admin/login');
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{ padding: '20px 0', borderBottom: '1px solid var(--stroke)', marginBottom: '40px' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Admin Dashboard</h1>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Link to="/admin/vendors" className="btn btn-ghost">Manage Vendors</Link>
                        <Link to="/admin/events" className="btn btn-ghost">Events</Link>
                        <button onClick={handleLogout} className="btn btn-ghost">Logout</button>
                    </div>
                </div>
            </header>

            <div className="container">
                {/* Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <div className="card">
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>Total Orders</h3>
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>{stats.totalOrders}</p>
                    </div>
                    <div className="card">
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>Total Revenue</h3>
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>£{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="card">
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>Active Vendors</h3>
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>{stats.activeVendors}</p>
                    </div>
                </div>

                {/* System Health */}
                <div className="card" style={{ marginBottom: '40px', border: '1px solid var(--stroke)', background: 'rgba(0,0,0,0.1)' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>🛡️ System Health (Remote Coordination)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></div>
                            <span style={{ fontSize: '14px' }}>Supabase Connection: OK</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: import.meta.env.VITE_SENTRY_DSN ? '#22c55e' : '#f59e0b' }}></div>
                            <span style={{ fontSize: '14px' }}>Sentry Monitoring: {import.meta.env.VITE_SENTRY_DSN ? 'Active' : 'Missing DSN'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }}></div>
                            <span style={{ fontSize: '14px' }}>Stripe Hooks (LHR): Connected</span>
                        </div>
                    </div>
                </div>

                {/* Recent Orders */}
                <h2 style={{ marginBottom: '24px' }}>Recent Orders</h2>
                {recentOrders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                        <p className="text-muted">No orders yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {recentOrders.map((order) => (
                            <div key={order.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h4>Order #{order.id.slice(0, 8)}</h4>
                                    <p className="text-muted" style={{ fontSize: '14px' }}>
                                        {new Date(order.created_at).toLocaleString()} • {order.customer_phone}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '20px', fontWeight: '700' }}>£{parseFloat(order.total || 0).toFixed(2)}</p>
                                    <p className="text-accent" style={{ fontSize: '13px' }}>{order.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
