import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, activeVendors: 0 });
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        checkAuth();
        fetchStats();
    }, []);

    async function checkAuth() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/admin/login');
        }
    }

    async function fetchStats() {
        // Fetch total orders and revenue
        const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, created_at, id, status, customer_phone')
            .order('created_at', { ascending: false })
            .limit(10);

        const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0;

        // Fetch active vendors
        const { data: vendors } = await supabase
            .from('vendors')
            .select('id')
            .eq('is_active', true);

        setStats({
            totalOrders: orders?.length || 0,
            totalRevenue,
            activeVendors: vendors?.length || 0
        });

        setRecentOrders(orders || []);
    }

    async function handleLogout() {
        await supabase.auth.signOut();
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
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>R{stats.totalRevenue.toFixed(2)}</p>
                    </div>
                    <div className="card">
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>Active Vendors</h3>
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>{stats.activeVendors}</p>
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
                                    <p style={{ fontSize: '20px', fontWeight: '700' }}>R{order.total_amount.toFixed(2)}</p>
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
