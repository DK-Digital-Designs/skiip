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
            console.warn('Supabase not configured, cannot load live stats.');
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                    <div className="card">
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>All Orders</h3>
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>{stats.totalOrders}</p>
                    </div>
                    <div className="card">
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>Active Orders</h3>
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>{stats.activeOrders}</p>
                    </div>
                    <div className="card">
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>Paid Revenue</h3>
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>GBP {stats.paidRevenue.toFixed(2)}</p>
                    </div>
                    <div className="card">
                        <h3 className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>Refunded Revenue</h3>
                        <p style={{ fontSize: '36px', fontWeight: '800', color: 'var(--accent)' }}>GBP {stats.refundedRevenue.toFixed(2)}</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '24px', marginBottom: '40px' }}>
                    <div className="card">
                        <h3 style={{ marginBottom: '16px' }}>Order Status Mix</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {Object.entries(stats.statusCounts).length === 0 ? (
                                <p className="text-muted">No order status data yet.</p>
                            ) : (
                                Object.entries(stats.statusCounts).map(([status, count]) => (
                                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ textTransform: 'capitalize' }}>{status.replaceAll('_', ' ')}</span>
                                        <strong>{count}</strong>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <h3 style={{ marginBottom: '16px' }}>Notification Health</h3>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Total notifications</span>
                                <strong>{stats.notifications.total || 0}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Failures</span>
                                <strong style={{ color: stats.notifications.failed ? '#ef4444' : 'var(--text)' }}>{stats.notifications.failed || 0}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>WhatsApp failures</span>
                                <strong>{stats.notifications.whatsapp_failed || 0}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Email failures</span>
                                <strong>{stats.notifications.email_failed || 0}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ marginBottom: '40px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Vendor Performance</h3>
                    {stats.vendors.length === 0 ? (
                        <p className="text-muted">No vendor activity yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {stats.vendors.map((vendor) => (
                                <div key={vendor.store_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--stroke)' }}>
                                    <div>
                                        <strong>{vendor.store_name}</strong>
                                        <p className="text-muted" style={{ fontSize: '13px' }}>{vendor.status}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <strong>{vendor.orders} orders</strong>
                                        <p className="text-muted" style={{ fontSize: '13px' }}>GBP {parseFloat(vendor.revenue || 0).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <h2 style={{ marginBottom: '24px' }}>Recent Orders</h2>
                {recentOrders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                        <p className="text-muted">No orders yet</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {recentOrders.map((order) => (
                            <div key={order.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                                <div>
                                    <h4>{order.order_number || `Order #${order.id.slice(0, 8)}`}</h4>
                                    <p className="text-muted" style={{ fontSize: '14px' }}>
                                        {new Date(order.created_at).toLocaleString()} • {order.stores?.name || 'Unknown Store'} • {order.customer_phone}
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right', display: 'grid', gap: '8px', justifyItems: 'end' }}>
                                    <div>
                                        <p style={{ fontSize: '20px', fontWeight: '700' }}>GBP {parseFloat(order.total || 0).toFixed(2)}</p>
                                        <p className="text-accent" style={{ fontSize: '13px' }}>{order.status} • {order.payment_status}</p>
                                    </div>
                                    {order.payment_status === 'succeeded' && order.status !== 'refunded' && (
                                        <button
                                            onClick={() => handleRefund(order.id)}
                                            className="btn btn-ghost"
                                            disabled={refundingOrderId === order.id}
                                            style={{ color: '#ef4444', padding: '8px 12px', fontSize: '13px' }}
                                        >
                                            {refundingOrderId === order.id ? 'Refunding...' : 'Refund Order'}
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
