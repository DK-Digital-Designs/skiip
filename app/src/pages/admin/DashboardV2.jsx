import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';
import { AdminService } from '../../lib/services/admin.service';
import { RefundService } from '../../lib/services/refund.service';
import { useToast } from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { getScheduledCollectionLabel } from '../../lib/scheduledCollection';
import {
    getOrderStateSummary,
    getOrderStatusColor,
    getOrderStatusLabel,
    isPaymentReconciliationCandidate,
} from '../../lib/orders';
import { formatCurrency, formatOrderCode } from '../../lib/ui-format';

function hasValue(value) {
    return value !== null && value !== undefined;
}

function formatMoney(value) {
    if (!hasValue(value)) return 'not recorded';
    return formatCurrency(value);
}

function hasReconciliationDetails(order) {
    const isReconciledStatus = order.payment_status === 'succeeded' || order.payment_status === 'refunded';
    return isReconciledStatus && (
        order.payment_intent_id ||
        order.charge_id ||
        hasValue(order.platform_fee) ||
        hasValue(order.stripe_fee) ||
        hasValue(order.vendor_net)
    );
}

export default function AdminDashboard() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refundingOrderId, setRefundingOrderId] = useState(null);
    const [refundTarget, setRefundTarget] = useState(null);
    const [refundReason, setRefundReason] = useState('Pilot support refund');
    const [reconcilingOrderId, setReconcilingOrderId] = useState(null);
    const [stats, setStats] = useState({
        totalOrders: 0,
        activeOrders: 0,
        failedPayments: 0,
        paidRevenue: 0,
        refundedRevenue: 0,
        statusCounts: {},
        vendors: [],
        notifications: { total: 0, failed: 0, whatsapp_failed: 0, email_failed: 0 },
    });
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            setLoading(false);
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
            failedPayments: metrics?.failedPayments || 0,
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

    async function handleRefundConfirmed() {
        if (!refundTarget) return;

        try {
            setRefundingOrderId(refundTarget.id);
            await RefundService.refundOrder(refundTarget.id, refundReason || 'Pilot support refund');
            addToast('Refund submitted successfully.', 'success');
            setRefundTarget(null);
            await refreshDashboard();
        } catch (error) {
            console.error('Refund failed:', error);
            addToast(error.message || 'Refund failed.', 'error');
        } finally {
            setRefundingOrderId(null);
        }
    }

    async function handleReconcile(orderId) {
        try {
            setReconcilingOrderId(orderId);
            await AdminService.reconcileOrderPayment(orderId);
            addToast('Payment reconciliation completed.', 'success');
            await refreshDashboard();
        } catch (error) {
            console.error('Payment reconciliation failed:', error);
            addToast(error.message || 'Payment reconciliation failed.', 'error');
        } finally {
            setReconcilingOrderId(null);
        }
    }

    if (loading) {
        return (
            <main className="app-page">
                <div className="surface empty-state">
                    <div className="spinner" />
                    <p>Loading admin dashboard</p>
                </div>
            </main>
        );
    }

    const metricCards = [
        { label: 'All Orders', value: stats.totalOrders },
        { label: 'Active Orders', value: stats.activeOrders },
        { label: 'Paid Revenue', value: formatCurrency(stats.paidRevenue) },
        { label: 'Failed Payments', value: stats.failedPayments, danger: stats.failedPayments > 0 },
        { label: 'Refunded Revenue', value: formatCurrency(stats.refundedRevenue) },
    ];

    return (
        <main className="app-page">
            <div className="container" style={{ display: 'grid', gap: '22px' }}>
                <section style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <p className="page-kicker">Admin operations</p>
                        <h1 className="page-title" style={{ fontSize: 'clamp(30px, 4vw, 42px)' }}>Admin Dashboard</h1>
                        <p className="page-subtitle">Monitor launch orders, vendors, refunds, and notification health.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Link to="/" className="btn btn-ghost">Return to Site</Link>
                        <Link to="/admin/vendors" className="btn btn-purple">Manage Vendors</Link>
                        <button type="button" onClick={handleLogout} className="btn btn-ghost">Logout</button>
                    </div>
                </section>

                <section className="dashboard-grid">
                    {metricCards.map((card) => (
                        <div key={card.label} className="card">
                            <p className="page-kicker" style={{ color: 'var(--text-soft)' }}>{card.label}</p>
                            <p style={{ fontSize: '34px', fontWeight: 950, color: card.danger ? 'var(--red)' : 'var(--accent)', marginTop: '6px' }}>
                                {card.value}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="two-column">
                    <div className="card">
                        <h2 style={{ color: 'var(--ink)', marginBottom: '16px' }}>Order Status Mix</h2>
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
                        <h2 style={{ color: 'var(--ink)', marginBottom: '16px' }}>Notification Health</h2>
                        <div style={{ display: 'grid', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Total notifications</span>
                                <strong>{stats.notifications.total || 0}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Failures</span>
                                <strong style={{ color: stats.notifications.failed ? 'var(--red)' : 'var(--text)' }}>{stats.notifications.failed || 0}</strong>
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
                </section>

                <section className="card">
                    <h2 style={{ color: 'var(--ink)', marginBottom: '16px' }}>Vendor Performance</h2>
                    {stats.vendors.length === 0 ? (
                        <p className="text-muted">No vendor activity yet.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '12px' }}>
                            {stats.vendors.map((vendor) => (
                                <div key={vendor.store_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--stroke)' }}>
                                    <div>
                                        <strong style={{ color: 'var(--ink)' }}>{vendor.store_name}</strong>
                                        <p className="text-muted" style={{ fontSize: '13px' }}>{vendor.status}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <strong>{vendor.orders} orders</strong>
                                        <p className="text-muted" style={{ fontSize: '13px' }}>{formatCurrency(vendor.revenue || 0)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                <section style={{ display: 'grid', gap: '16px' }}>
                    <h2 style={{ color: 'var(--ink)', fontSize: '26px' }}>Recent Orders</h2>
                    {recentOrders.length === 0 ? (
                        <div className="surface empty-state">
                            <p>No orders yet</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '14px' }}>
                            {recentOrders.map((order) => (
                                <article key={order.id} className="card" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '20px', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ color: 'var(--ink)', fontSize: '21px' }}>{formatOrderCode(order)}</h3>
                                        <p className="text-muted" style={{ fontSize: '14px' }}>
                                            {new Date(order.created_at).toLocaleString()} - {order.stores?.name || 'Unknown Store'} - {order.customer_phone || order.customer_email || 'No direct contact'}
                                        </p>
                                        {getScheduledCollectionLabel(order) && (
                                            <p className="chip chip--cyan" style={{ marginTop: '8px', width: 'fit-content' }}>
                                                Scheduled collection: {getScheduledCollectionLabel(order)}
                                            </p>
                                        )}
                                        {hasReconciliationDetails(order) && (
                                            <p className="text-muted" style={{ fontSize: '12px', marginTop: '8px', maxWidth: '720px' }}>
                                                Reconciliation: platform {formatMoney(order.platform_fee)}, Stripe {formatMoney(order.stripe_fee)}, vendor net {formatMoney(order.vendor_net)}
                                                {order.payment_intent_id ? ` | PI ${order.payment_intent_id}` : ''}
                                                {order.charge_id ? ` | Charge ${order.charge_id}` : ''}
                                            </p>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right', display: 'grid', gap: '8px', justifyItems: 'end' }}>
                                        <div>
                                            <p style={{ fontSize: '21px', fontWeight: 900 }}>{formatMoney(order.total)}</p>
                                            <p style={{ fontSize: '13px', color: getOrderStatusColor(order) }}>
                                                {getOrderStatusLabel(order)} | {getOrderStateSummary(order)}
                                            </p>
                                            {order.payment_status === 'failed' && order.payment_failure_message && (
                                                <p style={{ fontSize: '12px', color: 'var(--red)', maxWidth: '280px' }}>
                                                    {order.payment_failure_message}
                                                </p>
                                            )}
                                        </div>
                                        {order.payment_status === 'succeeded' && order.status !== 'refunded' && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setRefundTarget(order);
                                                    setRefundReason('Pilot support refund');
                                                }}
                                                className="btn btn-ghost"
                                                disabled={refundingOrderId === order.id}
                                                style={{ color: 'var(--red)' }}
                                            >
                                                {refundingOrderId === order.id ? 'Refunding...' : 'Refund Order'}
                                            </button>
                                        )}
                                        {isPaymentReconciliationCandidate(order) && (
                                            <button type="button" onClick={() => handleReconcile(order.id)} className="btn btn-primary" disabled={reconcilingOrderId === order.id}>
                                                {reconcilingOrderId === order.id ? 'Reconciling...' : 'Reconcile Payment'}
                                            </button>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <ConfirmDialog
                open={Boolean(refundTarget)}
                title="Refund order?"
                description={refundTarget ? `Submit a refund for ${formatOrderCode(refundTarget)}.` : ''}
                confirmLabel="Submit refund"
                onCancel={() => setRefundTarget(null)}
                onConfirm={handleRefundConfirmed}
                confirmDisabled={!refundReason.trim() || Boolean(refundingOrderId)}
            >
                <label htmlFor="refund-reason">Refund reason</label>
                <input
                    id="refund-reason"
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                />
            </ConfirmDialog>
        </main>
    );
}
