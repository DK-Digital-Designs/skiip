import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';
import { StoreService } from '../../lib/services/store.service';
import { useToast } from '../../components/ui/Toast';
import BackButton from '../../components/ui/BackButton';
import Icon from '../../components/ui/Icon';
import ProductImageUpload from '../../components/vendor/ProductImageUpload';
import { getInitials, getVendorImage } from '../../lib/ui-format';
import { getVendorTags, normalizeVendorTags } from '../../lib/vendor-tags';

function toFormData(store) {
    return {
        name: store?.name || '',
        description: store?.description || '',
        logoUrl: store?.logo_url || '',
        pickupLocation: store?.pickup_location || '',
        tags: getVendorTags(store).join(', '),
    };
}

export default function VendorProfile() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [store, setStore] = useState(null);
    const [formData, setFormData] = useState(toFormData(null));
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadStore();
    }, []);

    async function loadStore() {
        try {
            if (!isSupabaseConfigured()) {
                const demoStore = {
                    id: 'demo',
                    name: 'Burger Bliss',
                    description: 'Gourmet burgers, loaded fries, and quick festival pickups.',
                    pickup_location: 'Food Court A, Stall 3',
                    tags: ['Mains', 'Budget'],
                };
                setStore(demoStore);
                setFormData(toFormData(demoStore));
                return;
            }

            const session = await AuthService.getSession();
            if (!session) {
                navigate('/login');
                return;
            }

            const storeData = await StoreService.getStoreByUserId(session.user.id);
            if (!storeData) {
                addToast('No store found for this account.', 'error');
                navigate('/vendor/dashboard');
                return;
            }
            setStore(storeData);
            setFormData(toFormData(storeData));
        } catch (error) {
            console.error('Vendor profile load failed:', error);
            addToast('Could not load vendor profile.', 'error');
        } finally {
            setLoading(false);
        }
    }

    function updateField(field, value) {
        setFormData((current) => ({ ...current, [field]: value }));
    }

    async function handleSubmit(event) {
        event.preventDefault();
        const payload = {
            ...formData,
            tags: normalizeVendorTags(formData.tags),
        };

        if (!payload.name.trim()) {
            addToast('Vendor name is required.', 'error');
            return;
        }

        if (!isSupabaseConfigured()) {
            const updatedStore = {
                ...store,
                name: payload.name,
                description: payload.description,
                logo_url: payload.logoUrl,
                pickup_location: payload.pickupLocation,
                tags: payload.tags,
            };
            setStore(updatedStore);
            setFormData(toFormData(updatedStore));
            addToast('Demo mode: vendor profile saved.', 'success');
            return;
        }

        setSaving(true);
        try {
            const updatedStore = await StoreService.updateMyStoreProfile(payload);
            setStore(updatedStore);
            setFormData(toFormData(updatedStore));
            addToast('Vendor profile updated.', 'success');
        } catch (error) {
            console.error('Vendor profile save failed:', error);
            addToast(error.message || 'Could not save vendor profile.', 'error');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <main className="app-page">
                <div className="surface empty-state">
                    <div className="spinner" />
                    <p>Loading vendor profile</p>
                </div>
            </main>
        );
    }

    const previewImage = getVendorImage({
        ...store,
        logo_url: formData.logoUrl,
        name: formData.name,
    });
    const previewTags = normalizeVendorTags(formData.tags);

    return (
        <main className="app-page">
            <div className="container" style={{ display: 'grid', gap: '22px' }}>
                <section style={{ display: 'grid', gap: '14px' }}>
                    <BackButton to="/vendor/dashboard" label="Back to queue" style={{ width: 'fit-content' }} />
                    <div>
                        <p className="page-kicker">Vendor profile</p>
                        <h1 className="page-title" style={{ fontSize: 'clamp(30px, 4vw, 42px)' }}>Customize your stall</h1>
                        <p className="page-subtitle">Control how your vendor card appears in buyer discovery.</p>
                    </div>
                </section>

                <section className="two-column">
                    <form className="card" onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label htmlFor="vendor-name">Vendor name</label>
                            <input
                                id="vendor-name"
                                required
                                maxLength={80}
                                value={formData.name}
                                onChange={(event) => updateField('name', event.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="vendor-description">Description</label>
                            <textarea
                                id="vendor-description"
                                maxLength={280}
                                value={formData.description}
                                onChange={(event) => updateField('description', event.target.value)}
                                placeholder="What do you sell? What makes the stall worth visiting?"
                                style={{ minHeight: '110px' }}
                            />
                        </div>
                        <div>
                            <ProductImageUpload
                                label="Vendor image"
                                helperText="Upload a square logo or food image. PNG, JPG, or WebP up to 5MB."
                                successMessage="Vendor image uploaded. Save profile to publish it."
                                currentImageUrl={formData.logoUrl}
                                storeId={store?.id}
                                onUpload={(url) => updateField('logoUrl', url)}
                            />
                            <label htmlFor="vendor-logo">Image URL</label>
                            <input
                                id="vendor-logo"
                                value={formData.logoUrl}
                                onChange={(event) => updateField('logoUrl', event.target.value)}
                                placeholder="https://..."
                            />
                            <p className="text-muted" style={{ fontSize: '12px', marginTop: '6px' }}>
                                You can also use a direct public JPG, PNG, or WebP image URL. Canva share links may not work.
                            </p>
                        </div>
                        <div>
                            <label htmlFor="vendor-location">Pickup location</label>
                            <input
                                id="vendor-location"
                                maxLength={120}
                                value={formData.pickupLocation}
                                onChange={(event) => updateField('pickupLocation', event.target.value)}
                                placeholder="Food court, stall, or bar area"
                            />
                        </div>
                        <div>
                            <label htmlFor="vendor-tags">Discovery tags</label>
                            <input
                                id="vendor-tags"
                                value={formData.tags}
                                onChange={(event) => updateField('tags', event.target.value)}
                                placeholder="Mains, Chicken, Bar"
                            />
                            <p className="text-muted" style={{ fontSize: '12px', marginTop: '6px' }}>
                                Separate tags with commas. Keep them short and buyer-friendly.
                            </p>
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save profile'}
                        </button>
                    </form>

                    <aside style={{ display: 'grid', gap: '16px', alignContent: 'start' }}>
                        <article className="vendor-card" style={{ minHeight: '220px' }}>
                            <div style={{ display: 'grid', alignContent: 'center', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <span className="chip chip--accent">Preview</span>
                                    {previewTags.slice(0, 2).map((tag) => (
                                        <span key={tag} className="chip chip--cyan">{tag}</span>
                                    ))}
                                </div>
                                <div>
                                    <h3 style={{ color: 'var(--ink)', fontSize: '22px', lineHeight: 1.05 }}>
                                        {formData.name || 'Vendor name'}
                                    </h3>
                                    <p className="text-muted" style={{ fontSize: '14px', marginTop: '6px' }}>
                                        {formData.description || 'Vendor description appears here.'}
                                    </p>
                                </div>
                                <span className="btn btn-primary" style={{ width: 'fit-content', minHeight: '34px', padding: '9px 16px', fontSize: '12px' }}>
                                    View Menu
                                </span>
                            </div>
                            <div className="vendor-card__media">
                                {previewImage ? (
                                    <img src={previewImage} alt="" />
                                ) : (
                                    <span className="vendor-card__initials">{getInitials(formData.name || 'SKIIP')}</span>
                                )}
                            </div>
                        </article>

                        <article className="card" style={{ background: 'rgba(139,92,246,0.08)' }}>
                            <div className="chip chip--accent" style={{ width: 'fit-content', marginBottom: '12px' }}>
                                <Icon name="spark" size={15} />
                                Roadmap
                            </div>
                            <h2 style={{ color: 'var(--ink)', fontSize: '22px', marginBottom: '8px' }}>Vendor page themes</h2>
                            <p className="text-muted">
                                Theme controls belong with the upcoming multi-event/vendor branding work. This V1 pass stores the profile data needed for discovery.
                            </p>
                        </article>
                    </aside>
                </section>
            </div>
        </main>
    );
}
