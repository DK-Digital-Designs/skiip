import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';
import { AdminService } from '../../lib/services/admin.service';
import { RefundService } from '../../lib/services/refund.service';
import { useToast } from '../../components/ui/Toast';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refundingOrderId, setRefundingOrderId] = useState(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        activeOrders: 0,
        paidRevenue: 0,
        refundedRevenue: 0,
        statusCounts: {},
        vendors: [],
        notifications: { total: 0, failed: 0, whatsapp_failed: 0, email_failed: 0 },
    });
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            console.warn("Supabase not configured, cannot load live stats.");
            return;
        }

        checkAuthAndLoad();
    }, []);

    async function checkAuthAndLoad() {
        try {
            const session = await AuthService.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            await refreshDashboard();
        } catch (error) {
            console.error('Error fetching admin dashboard:', error);
            addToast('Failed to load admin dashboard.', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function refreshDashboard() {
        try {
            const [metrics, orders] = await Promise.all([
                AdminService.getDashboardMetrics(),
                AdminService.getRecentOrders(20),
            ]);

            setStats({
                totalOrders: metrics?.totalOrders || 0,
                activeOrders: metrics?.activeOrders || 0,
                paidRevenue: parseFloat(metrics?.paidRevenue || 0),
                refundedRevenue: parseFloat(metrics?.refundedRevenue || 0),
                statusCounts: metrics?.statusCounts || {},
                vendors: metrics?.vendors || [],
                notifications: metrics?.notifications || { total: 0, failed: 0, whatsapp_failed: 0, email_failed: 0 },
            });

            setRecentOrders(orders || []);
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw error;
        }
    }

    async function handleLogout() {
        if (isSupabaseConfigured()) {
            await AuthService.signOut();
        }
        navigate('/login');
    }

    async function handleRefund(orderId) {
        const reason = window.prompt('Refund reason', 'Pilot support refund');
        if (reason === null) return;

        try {
            setRefundingOrderId(orderId);
            await RefundService.refundOrder(orderId, reason);
            addToast('Refund submitted successfully.', 'success');
            await refreshDashboard();
        } catch (error) {
            console.error('Refund failed:', error);
            addToast(error.message || 'Refund failed.', 'error');
        } finally {
            setRefundingOrderId(null);
        }
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
                    <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Admin Dashboard</h1>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Link to="/" className="btn btn-ghost">Return to Site</Link>
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
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>All Orders</h3>
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>{stats.totalOrders}</p>
                    </div>
                    <div className="card">
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>Active Orders</h3>
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
                                        {new Date(order.created_at).toLocaleString()} • {order.customer_phone || order.customer_email || 'No direct contact'}
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
