import React, { useEffect, useState } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { useToast } from '../../components/ui/Toast';
import { DEFAULT_LAUNCH_EVENT } from '../../lib/launch-event';
import { SettingsService } from '../../lib/services/settings.service';

export default function AdminEvents() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState(DEFAULT_LAUNCH_EVENT);
    const [saving, setSaving] = useState(false);
    const [previewSurface, setPreviewSurface] = useState('buyer');

    useEffect(() => {
        async function loadEvent() {
            try {
                const value = await SettingsService.getLaunchEvent();
                setDraft(value);
            } catch (error) {
                console.error('Launch event settings load failed:', error);
                addToast('Could not load event content.', 'error');
            } finally {
                setLoading(false);
            }
        }

        loadEvent();
    }, [addToast]);

    function updateField(field, value) {
        setDraft((current) => ({ ...current, [field]: value }));
    }

    async function handleSave(event) {
        event.preventDefault();
        setSaving(true);
        try {
            const saved = await SettingsService.saveLaunchEvent(draft);
            setDraft(saved);
            addToast('Launch event copy updated.', 'success');
        } catch (error) {
            console.error('Launch event save failed:', error);
            addToast(error.message || 'Could not save launch event copy.', 'error');
        } finally {
            setSaving(false);
        }
    }

    const previewTitle = previewSurface === 'buyer' ? draft.title : draft.landingTitle;
    const previewSubtitle = previewSurface === 'buyer' ? draft.subtitle : draft.landingSubtitle;

    return (
        <AdminShell title="Event Setup" subtitle="Public event content">
            {loading ? (
                <section className="admin-panel empty-state">
                    <div className="spinner" />
                    <p>Loading event content</p>
                </section>
            ) : (
                <section className="admin-editor-grid">
                    <form className="admin-panel admin-event-form" onSubmit={handleSave}>
                        <h2>Buyer page content</h2>
                        <div>
                            <label htmlFor="launch-label">Status label</label>
                            <input id="launch-label" value={draft.label} onChange={(event) => updateField('label', event.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="launch-title">Buyer page title</label>
                            <input id="launch-title" value={draft.title} onChange={(event) => updateField('title', event.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="launch-subtitle">Buyer page subtitle</label>
                            <textarea id="launch-subtitle" value={draft.subtitle} onChange={(event) => updateField('subtitle', event.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="launch-landing-title">Landing page title</label>
                            <input id="launch-landing-title" value={draft.landingTitle} onChange={(event) => updateField('landingTitle', event.target.value)} />
                        </div>
                        <div>
                            <label htmlFor="launch-landing-subtitle">Landing page subtitle</label>
                            <textarea id="launch-landing-subtitle" value={draft.landingSubtitle} onChange={(event) => updateField('landingSubtitle', event.target.value)} />
                        </div>
                        <button type="submit" className="btn btn-accent" disabled={saving}>
                            {saving ? 'Saving...' : 'Save event copy'}
                        </button>
                    </form>
                    <article className="admin-panel admin-preview-panel">
                        <h2>Preview</h2>
                        <div className="admin-preview-tabs" role="tablist" aria-label="Preview surface">
                            <button
                                type="button"
                                role="tab"
                                aria-selected={previewSurface === 'buyer'}
                                className={previewSurface === 'buyer' ? 'admin-preview-tab admin-preview-tab--active' : 'admin-preview-tab'}
                                onClick={() => setPreviewSurface('buyer')}
                            >
                                Buyer vendors page
                            </button>
                            <button
                                type="button"
                                role="tab"
                                aria-selected={previewSurface === 'landing'}
                                className={previewSurface === 'landing' ? 'admin-preview-tab admin-preview-tab--active' : 'admin-preview-tab'}
                                onClick={() => setPreviewSurface('landing')}
                            >
                                Landing page
                            </button>
                        </div>
                        <div className="hero-panel admin-event-preview">
                            <div className="hero-panel__content">
                                <span className="chip chip--cyan">{draft.label}</span>
                                <h2>{previewTitle}</h2>
                                <p>{previewSubtitle}</p>
                            </div>
                        </div>
                    </article>
                </section>
            )}
        </AdminShell>
    );
}
