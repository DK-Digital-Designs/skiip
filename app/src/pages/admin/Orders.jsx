import React, { Fragment, useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { getScheduledCollectionLabel } from '../../lib/scheduledCollection';
import {
    getOrderStateSummary,
    getOrderStatusColor,
    getOrderStatusLabel,
    isPaymentReconciliationCandidate,
    isRefundableOrder,
} from '../../lib/orders';
import { AdminService } from '../../lib/services/admin.service';
import { RefundService } from '../../lib/services/refund.service';
import { formatCurrency, formatOrderCode } from '../../lib/ui-format';

function hasValue(value) {
    return value !== null && value !== undefined;
}

function formatMoney(value) {
    return hasValue(value) ? formatCurrency(value) : 'Not recorded';
}

function hasPaymentDetails(order) {
    return Boolean(
        order.payment_intent_id
        || order.charge_id
        || hasValue(order.platform_fee)
        || hasValue(order.stripe_fee)
        || hasValue(order.vendor_net)
    );
}

export default function AdminOrders() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [expandedOrderId, setExpandedOrderId] = useState(null);
    const [refundTarget, setRefundTarget] = useState(null);
    const [refundReason, setRefundReason] = useState('Pilot support refund');
    const [refundingOrderId, setRefundingOrderId] = useState(null);
    const [reconcilingOrderId, setReconcilingOrderId] = useState(null);

    async function loadOrders() {
        try {
            const data = await AdminService.getRecentOrders(20);
            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching admin orders:', error);
            addToast('Failed to load admin orders.', 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadOrders();
    }, []);

    async function handleRefundConfirmed() {
        if (!refundTarget) return;

        try {
            setRefundingOrderId(refundTarget.id);
            await RefundService.refundOrder(refundTarget.id, refundReason || 'Pilot support refund');
            addToast('Refund submitted successfully.', 'success');
            setRefundTarget(null);
            await loadOrders();
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
            await loadOrders();
        } catch (error) {
            console.error('Payment reconciliation failed:', error);
            addToast(error.message || 'Payment reconciliation failed.', 'error');
        } finally {
            setReconcilingOrderId(null);
        }
    }

    return (
        <AdminShell title="Orders" subtitle="Recent operational orders">
            {loading ? (
                <section className="admin-panel empty-state">
                    <div className="spinner" />
                    <p>Loading orders</p>
                </section>
            ) : orders.length === 0 ? (
                <section className="admin-panel empty-state">
                    <p>No orders yet</p>
                </section>
            ) : (
                <section className="admin-table-wrap">
                    <table className="admin-orders-table">
                        <thead>
                            <tr>
                                <th>Order</th>
                                <th>Placed / Vendor</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Payment</th>
                                <th>Collection</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <Fragment key={order.id}>
                                    <tr>
                                        <td>
                                            <strong>{formatOrderCode(order)}</strong>
                                            {hasPaymentDetails(order) && (
                                                <button
                                                    type="button"
                                                    className="admin-detail-toggle"
                                                    onClick={() => setExpandedOrderId((current) => current === order.id ? null : order.id)}
                                                    aria-expanded={expandedOrderId === order.id}
                                                >
                                                    {expandedOrderId === order.id ? 'Hide details' : 'Payment details'}
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            <strong>{order.stores?.name || 'Unknown Store'}</strong>
                                            <small>{new Date(order.created_at).toLocaleString()}</small>
                                        </td>
                                        <td>{order.customer_phone || order.customer_email || 'No direct contact'}</td>
                                        <td><strong>{formatMoney(order.total)}</strong></td>
                                        <td>
                                            <span className="admin-order-status" style={{ color: getOrderStatusColor(order) }}>
                                                {getOrderStatusLabel(order)}
                                            </span>
                                            <small>{getOrderStateSummary(order)}</small>
                                        </td>
                                        <td>
                                            {order.payment_status || 'unknown'}
                                            {order.payment_status === 'failed' && order.payment_failure_message && (
                                                <small className="admin-text-danger">{order.payment_failure_message}</small>
                                            )}
                                        </td>
                                        <td>{getScheduledCollectionLabel(order) || 'Immediate collection'}</td>
                                        <td>
                                            <div className="admin-table-actions">
                                                {isRefundableOrder(order) && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-ghost"
                                                        onClick={() => {
                                                            setRefundTarget(order);
                                                            setRefundReason('Pilot support refund');
                                                        }}
                                                        disabled={refundingOrderId === order.id}
                                                    >
                                                        {refundingOrderId === order.id ? 'Refunding...' : 'Refund'}
                                                    </button>
                                                )}
                                                {isPaymentReconciliationCandidate(order) && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-accent"
                                                        onClick={() => handleReconcile(order.id)}
                                                        disabled={reconcilingOrderId === order.id}
                                                    >
                                                        {reconcilingOrderId === order.id ? 'Reconciling...' : 'Reconcile payment'}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedOrderId === order.id && hasPaymentDetails(order) && (
                                        <tr className="admin-order-detail-row">
                                            <td colSpan="8">
                                                <div className="admin-order-details">
                                                    <div><span>Platform fee</span><strong>{formatMoney(order.platform_fee)}</strong></div>
                                                    <div><span>Stripe fee</span><strong>{formatMoney(order.stripe_fee)}</strong></div>
                                                    <div><span>Vendor net</span><strong>{formatMoney(order.vendor_net)}</strong></div>
                                                    <div><span>Payment intent</span><strong>{order.payment_intent_id || 'Not recorded'}</strong></div>
                                                    <div><span>Charge ID</span><strong>{order.charge_id || 'Not recorded'}</strong></div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            <ConfirmDialog
                open={Boolean(refundTarget)}
                title="Refund order?"
                description={refundTarget ? `Submit a refund for ${formatOrderCode(refundTarget)}.` : ''}
                confirmLabel="Submit refund"
                onCancel={() => setRefundTarget(null)}
                onConfirm={handleRefundConfirmed}
                confirmDisabled={!refundReason.trim() || Boolean(refundingOrderId)}
            >
                <label htmlFor="refund-reason">Reason</label>
                <input
                    id="refund-reason"
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                />
            </ConfirmDialog>
        </AdminShell>
    );
}
