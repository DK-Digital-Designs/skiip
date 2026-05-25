import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import Icon from '../../components/ui/Icon';
import { useToast } from '../../components/ui/Toast';
import { DEFAULT_LAUNCH_EVENT } from '../../lib/launch-event';
import { AdminService } from '../../lib/services/admin.service';
import { SettingsService } from '../../lib/services/settings.service';
import { formatCurrency } from '../../lib/ui-format';

const EMPTY_STATS = {
    totalOrders: 0,
    activeOrders: 0,
    failedPayments: 0,
    paidRevenue: 0,
    serviceFeeRevenue: 0,
    refundedRevenue: 0,
    statusCounts: {},
    notifications: { total: 0, failed: 0, whatsapp_failed: 0, email_failed: 0 },
};

function normalizeMetrics(metrics) {
    return {
        totalOrders: metrics?.totalOrders || 0,
        activeOrders: metrics?.activeOrders || 0,
        failedPayments: metrics?.failedPayments || 0,
        paidRevenue: parseFloat(metrics?.paidRevenue || 0),
        serviceFeeRevenue: parseFloat(metrics?.serviceFeeRevenue || 0),
        refundedRevenue: parseFloat(metrics?.refundedRevenue || 0),
        statusCounts: metrics?.statusCounts || {},
        notifications: metrics?.notifications || EMPTY_STATS.notifications,
    };
}

export default function AdminDashboard() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(EMPTY_STATS);
    const [launchEvent, setLaunchEvent] = useState(DEFAULT_LAUNCH_EVENT);
    const [paymentControls, setPaymentControls] = useState(null);

    useEffect(() => {
        async function loadDashboard() {
            try {
                const metrics = await AdminService.getDashboardMetrics();
                setStats(normalizeMetrics(metrics));
            } catch (error) {
                console.error('Error fetching admin dashboard metrics:', error);
                addToast('Failed to load admin dashboard.', 'error');
            } finally {
                setLoading(false);
            }
        }

        async function loadStatusLinks() {
            const [eventResult, paymentResult] = await Promise.allSettled([
                SettingsService.getLaunchEvent(),
                SettingsService.getPaymentControls(),
            ]);

            if (eventResult.status === 'fulfilled') setLaunchEvent(eventResult.value);
            if (paymentResult.status === 'fulfilled') setPaymentControls(paymentResult.value);
        }

        loadDashboard();
        loadStatusLinks();
    }, [addToast]);

    const metricCards = [
        { label: 'All Orders', value: stats.totalOrders, icon: 'receipt' },
        { label: 'Active Orders', value: stats.activeOrders, icon: 'clock' },
        { label: 'Paid Revenue', value: formatCurrency(stats.paidRevenue), icon: 'check' },
        { label: 'Service Fees', value: formatCurrency(stats.serviceFeeRevenue), icon: 'tag' },
        { label: 'Failed Payments', value: stats.failedPayments, icon: 'bell', danger: stats.failedPayments > 0 },
        { label: 'Refunded Revenue', value: formatCurrency(stats.refundedRevenue), icon: 'arrowLeft' },
    ];

    const statusCounts = Object.entries(stats.statusCounts);

    return (
        <AdminShell title="Dashboard" subtitle="Operational overview">
            {loading ? (
                <section className="admin-panel empty-state">
                    <div className="spinner" />
                    <p>Loading dashboard</p>
                </section>
            ) : (
                <>
                    <section className="admin-metric-grid" aria-label="Dashboard metrics">
                        {metricCards.map((card) => (
                            <article key={card.label} className="admin-metric">
                                <div className={card.danger ? 'admin-metric__icon admin-metric__icon--danger' : 'admin-metric__icon'}>
                                    <Icon name={card.icon} size={18} />
                                </div>
                                <p>{card.label}</p>
                                <strong className={card.danger ? 'admin-metric__value admin-metric__value--danger' : 'admin-metric__value'}>
                                    {card.value}
                                </strong>
                            </article>
                        ))}
                    </section>

                    <section className="admin-summary-grid">
                        <article className="admin-panel">
                            <h2>Order Status Mix</h2>
                            {statusCounts.length === 0 ? (
                                <p className="text-muted">No order status data yet.</p>
                            ) : (
                                <div className="admin-summary-list">
                                    {statusCounts.map(([status, count]) => (
                                        <div key={status}>
                                            <span>{status.replaceAll('_', ' ')}</span>
                                            <strong>{count}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </article>
                        <article className="admin-panel">
                            <h2>Notification Health</h2>
                            <div className="admin-summary-list">
                                <div><span>Total notifications</span><strong>{stats.notifications.total || 0}</strong></div>
                                <div>
                                    <span>Failures</span>
                                    <strong className={stats.notifications.failed ? 'admin-text-danger' : ''}>{stats.notifications.failed || 0}</strong>
                                </div>
                                <div><span>WhatsApp failures</span><strong>{stats.notifications.whatsapp_failed || 0}</strong></div>
                                <div><span>Email failures</span><strong>{stats.notifications.email_failed || 0}</strong></div>
                            </div>
                        </article>
                    </section>

                    <section className="admin-panel admin-status-panel" aria-label="Operations">
                        <h2>Operations</h2>
                        <Link to="/admin/orders" className="admin-status-row">
                            <Icon name="receipt" size={20} />
                            <span>
                                <strong>Recent operational orders</strong>
                                <small>Review refunds and payment reconciliation</small>
                            </span>
                            <b>View orders</b>
                        </Link>
                        <Link to="/admin/settings" className="admin-status-row">
                            <Icon name="settings" size={20} />
                            <span>
                                <strong>
                                    {paymentControls
                                        ? (paymentControls.checkoutEnabled ? 'Checkout enabled' : 'Checkout paused')
                                        : 'Checkout status unavailable'}
                                </strong>
                                <small>Manage buyer checkout availability</small>
                            </span>
                            <b>Settings</b>
                        </Link>
                        <Link to="/admin/events" className="admin-status-row">
                            <Icon name="calendar" size={20} />
                            <span>
                                <strong>{launchEvent.label}</strong>
                                <small>Event content visible to customers</small>
                            </span>
                            <b>Edit event</b>
                        </Link>
                    </section>
                </>
            )}
        </AdminShell>
    );
}
