import React, { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { useToast } from '../../components/ui/Toast';
import { SettingsService } from '../../lib/services/settings.service';

const EMPTY_CONTROLS = {
    controls: { enabled: true, reason: null, updatedAt: null, updatedBy: null },
    masterEnabled: false,
    checkoutEnabled: false,
};

export default function AdminSettings() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [paymentControls, setPaymentControls] = useState(EMPTY_CONTROLS);
    const [pauseReason, setPauseReason] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        async function loadControls() {
            try {
                const value = await SettingsService.getPaymentControls();
                setPaymentControls(value);
                setPauseReason(value.controls.reason || '');
            } catch (error) {
                console.error('Payment controls load failed:', error);
                addToast('Could not load checkout controls.', 'error');
            } finally {
                setLoading(false);
            }
        }

        loadControls();
    }, [addToast]);

    async function handleSetPaymentsEnabled(enabled) {
        setSaving(true);
        try {
            const saved = await SettingsService.savePaymentControls({
                enabled,
                reason: enabled ? null : pauseReason || 'Admin paused checkout',
            });
            setPaymentControls(saved);
            setPauseReason(saved.controls.reason || '');
            addToast(enabled ? 'Buyer checkout resumed.' : 'Buyer checkout paused.', 'success');
        } catch (error) {
            console.error('Payment controls update failed:', error);
            addToast(error.message || 'Could not update payment controls.', 'error');
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminShell title="Settings" subtitle="Operational controls">
            {loading ? (
                <section className="admin-panel empty-state">
                    <div className="spinner" />
                    <p>Loading settings</p>
                </section>
            ) : (
                <section className="admin-panel admin-settings-panel">
                    <div className="admin-settings-intro">
                        <h2>Checkout availability</h2>
                        <p>Pause buyer checkout when needed. Refunds and reconciliation remain available.</p>
                    </div>
                    <div className="admin-control-statuses">
                        <StatusFlag label="Checkout" onLabel="enabled" offLabel="paused" enabled={paymentControls.checkoutEnabled} />
                        <StatusFlag label="Environment master" onLabel="on" offLabel="off" enabled={paymentControls.masterEnabled} />
                        <StatusFlag label="Admin switch" onLabel="on" offLabel="off" enabled={paymentControls.controls.enabled} />
                    </div>
                    <div className="admin-control-field">
                        <label htmlFor="payment-pause-reason">Pause reason</label>
                        <input
                            id="payment-pause-reason"
                            value={pauseReason}
                            onChange={(event) => setPauseReason(event.target.value)}
                            placeholder="Incident, curfew, vendor issue, or operator stop-sale"
                        />
                    </div>
                    {paymentControls.controls.updatedAt && (
                        <p className="admin-last-changed">
                            <strong>Last changed</strong>
                            {new Date(paymentControls.controls.updatedAt).toLocaleString()}
                        </p>
                    )}
                    <p className={paymentControls.masterEnabled ? 'admin-safety-note' : 'admin-safety-note admin-safety-note--warning'}>
                        Safety: the environment master switch must also be on for checkout to be available.
                    </p>
                    <div className="admin-settings-actions">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => handleSetPaymentsEnabled(true)}
                            disabled={saving || paymentControls.controls.enabled}
                        >
                            {saving ? 'Updating...' : 'Resume checkout'}
                        </button>
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleSetPaymentsEnabled(false)}
                            disabled={saving || !paymentControls.controls.enabled}
                        >
                            {saving ? 'Updating...' : 'Pause checkout'}
                        </button>
                    </div>
                </section>
            )}
        </AdminShell>
    );
}

function StatusFlag({ label, onLabel, offLabel, enabled }) {
    return (
        <div className="admin-control-status">
            <span className={enabled ? 'admin-status-dot admin-status-dot--on' : 'admin-status-dot admin-status-dot--off'} />
            <strong>{label} {enabled ? onLabel : offLabel}</strong>
            <span className={enabled ? 'chip chip--green' : 'chip chip--amber'}>{enabled ? 'On' : 'Off'}</span>
        </div>
    );
}
