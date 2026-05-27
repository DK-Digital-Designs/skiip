import React, { useEffect, useMemo, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { useToast } from '../../components/ui/Toast';
import { isRefundableOrder } from '../../lib/orders';
import { RefundService } from '../../lib/services/refund.service';
import { SupportService } from '../../lib/services/support.service';
import { formatCurrency } from '../../lib/ui-format';

const STATUS_OPTIONS = ['open', 'in_review', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['normal', 'high', 'urgent'];

function formatLabel(value) {
    return String(value || '').replaceAll('_', ' ');
}

export default function AdminIssues() {
    const { addToast } = useToast();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('active');
    const [priorityFilter, setPriorityFilter] = useState('all');
    const [selectedId, setSelectedId] = useState(null);
    const [draft, setDraft] = useState({ status: 'open', priority: 'normal', internalNotes: '' });
    const [saving, setSaving] = useState(false);
    const [refundTarget, setRefundTarget] = useState(null);
    const [refunding, setRefunding] = useState(false);

    async function loadRequests() {
        try {
            const data = await SupportService.getAdminRequests();
            setRequests(data);
            setSelectedId((current) => current || data[0]?.id || null);
        } catch (error) {
            addToast(error.message || 'Unable to load issues.', 'error');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRequests();
    }, []);

    const filteredRequests = useMemo(() => requests.filter((request) => {
        const statusMatches = statusFilter === 'all'
            || (statusFilter === 'active' && ['open', 'in_review'].includes(request.status))
            || request.status === statusFilter;
        const priorityMatches = priorityFilter === 'all' || request.priority === priorityFilter;
        return statusMatches && priorityMatches;
    }), [requests, statusFilter, priorityFilter]);

    const selected = filteredRequests.find((request) => request.id === selectedId) || filteredRequests[0] || null;

    useEffect(() => {
        if (!selected) return;
        setDraft({
            status: selected.status,
            priority: selected.priority,
            internalNotes: selected.internal_notes || '',
        });
    }, [selected?.id, selected?.status, selected?.priority, selected?.internal_notes]);

    async function handleSave(event) {
        event.preventDefault();
        if (!selected) return;
        setSaving(true);
        try {
            const updated = await SupportService.updateAdminRequest(selected.id, draft);
            setRequests((current) => current.map((request) => (
                request.id === selected.id ? { ...request, ...updated } : request
            )));
            addToast('Issue updated.', 'success');
        } catch (error) {
            addToast(error.message || 'Unable to update issue.', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleRefund() {
        if (!refundTarget) return;
        setRefunding(true);
        try {
            await RefundService.refundOrder(refundTarget.order_id, `Support case ${refundTarget.reference_code}`);
            addToast('Refund submitted successfully.', 'success');
            setRefundTarget(null);
            await loadRequests();
        } catch (error) {
            addToast(error.message || 'Refund failed.', 'error');
        } finally {
            setRefunding(false);
        }
    }

    return (
        <AdminShell title="Issues" subtitle="Buyer and vendor support triage">
            <section className="admin-panel" style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'end' }}>
                <div>
                    <label htmlFor="issues-status-filter">Status</label>
                    <select id="issues-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                        <option value="active">Open or in review</option>
                        <option value="all">All statuses</option>
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="issues-priority-filter">Priority</label>
                    <select id="issues-priority-filter" value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}>
                        <option value="all">All priorities</option>
                        {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                    </select>
                </div>
            </section>

            {loading ? (
                <section className="admin-panel empty-state">
                    <div className="spinner" />
                    <p>Loading issues</p>
                </section>
            ) : filteredRequests.length === 0 ? (
                <section className="admin-panel empty-state">
                    <p>No issues match this filter.</p>
                </section>
            ) : (
                <section className="admin-editor-grid">
                    <div className="admin-panel" style={{ display: 'grid', gap: '10px' }}>
                        {filteredRequests.map((request) => (
                            <button
                                key={request.id}
                                type="button"
                                className={selected?.id === request.id ? 'btn btn-accent' : 'btn btn-ghost'}
                                onClick={() => setSelectedId(request.id)}
                                style={{ display: 'grid', justifyContent: 'stretch', textAlign: 'left', height: 'auto', gap: '4px' }}
                            >
                                <strong>{request.reference_code}</strong>
                                <span>{formatLabel(request.issue_type)} - {request.priority}</span>
                                <small>{new Date(request.created_at).toLocaleString()}</small>
                            </button>
                        ))}
                    </div>
                    {selected && (
                        <form className="admin-panel admin-event-form" onSubmit={handleSave}>
                            <h2>{selected.reference_code}</h2>
                            <p className="text-muted">{selected.contact_name} - {selected.contact_email}</p>
                            {selected.contact_phone && <p className="text-muted">{selected.contact_phone}</p>}
                            <div className="admin-summary-list">
                                <div><span>Reporter</span><strong>{selected.reporter_role}</strong></div>
                                <div><span>Issue type</span><strong>{formatLabel(selected.issue_type)}</strong></div>
                                <div><span>Vendor</span><strong>{selected.stores?.name || 'Not linked'}</strong></div>
                                <div><span>Order</span><strong>{selected.orders?.order_number || 'Not linked'}</strong></div>
                            </div>
                            <div>
                                <label htmlFor="issue-description">Customer description</label>
                                <textarea id="issue-description" value={selected.description} disabled style={{ minHeight: '104px' }} />
                            </div>
                            <div className="two-column">
                                <div>
                                    <label htmlFor="issue-status">Case status</label>
                                    <select id="issue-status" value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="issue-priority">Case priority</label>
                                    <select id="issue-priority" value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))}>
                                        {PRIORITY_OPTIONS.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="issue-internal-notes">Internal notes</label>
                                <textarea
                                    id="issue-internal-notes"
                                    value={draft.internalNotes}
                                    onChange={(event) => setDraft((current) => ({ ...current, internalNotes: event.target.value }))}
                                    maxLength={4000}
                                    style={{ minHeight: '110px' }}
                                />
                            </div>
                            {selected.orders && (
                                <div className="chip" style={{ width: 'fit-content' }}>
                                    Order total: {formatCurrency(selected.orders.total)} - payment {selected.orders.payment_status}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button className="btn btn-primary" type="submit" disabled={saving}>
                                    {saving ? 'Saving...' : 'Save triage'}
                                </button>
                                {selected.order_id && isRefundableOrder(selected.orders) && (
                                    <button type="button" className="btn btn-ghost" onClick={() => setRefundTarget(selected)}>
                                        Refund linked order
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </section>
            )}

            <ConfirmDialog
                open={Boolean(refundTarget)}
                title="Refund linked order?"
                description={refundTarget ? `Submit an admin-confirmed refund for case ${refundTarget.reference_code}.` : ''}
                confirmLabel={refunding ? 'Refunding...' : 'Submit refund'}
                confirmDisabled={refunding}
                onCancel={() => setRefundTarget(null)}
                onConfirm={handleRefund}
            />
        </AdminShell>
    );
}
