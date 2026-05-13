import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import AttendeeHeader from '../../components/shared/AttendeeHeader';
import { AdminStoreService } from '../../lib/services/adminStore.service';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Icon from '../../components/ui/Icon';

export default function AdminVendors() {
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [showNewStoreForm, setShowNewStoreForm] = useState(false);
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [newStore, setNewStore] = useState({ name: '', slug: '', user_id: '' });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: storesData, error: storesError } = await supabase
                .from('stores')
                .select('id, name, slug, status, created_at, user_id, deleted_at')
                .is('deleted_at', null)
                .order('created_at', { ascending: false });

            if (storesError) throw storesError;

            const { data: usersData, error: usersError } = await supabase
                .from('user_profiles')
                .select('id, email, full_name, role')
                .in('role', ['buyer', 'seller'])
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            const enrichedStores = (storesData || []).map((store) => {
                const ownerInfo = (usersData || []).find((user) => user.id === store.user_id);
                return { ...store, user_profiles: ownerInfo || null };
            });

            setStores(enrichedStores);
            setUsers(usersData || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            addToast('Failed to load vendors', 'error');
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateStatus(storeId, newStatus) {
        try {
            await AdminStoreService.updateStoreStatus(storeId, newStatus);
            addToast(`Store marked as ${newStatus}`, 'success');
            fetchData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    }

    async function handleArchiveStore() {
        if (!archiveTarget) return;

        try {
            await AdminStoreService.archiveStore(archiveTarget.id);
            addToast('Store archived', 'success');
            setArchiveTarget(null);
            fetchData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    }

    async function handleCreateStore(event) {
        event.preventDefault();
        try {
            await AdminStoreService.createVendorStore({
                userId: newStore.user_id,
                name: newStore.name,
                slug: newStore.slug,
            });

            addToast('Store created successfully.', 'success');
            setShowNewStoreForm(false);
            setNewStore({ name: '', slug: '', user_id: '' });
            fetchData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    }

    return (
        <main className="app-page">
            <AttendeeHeader backTo="/admin/dashboard" backLabel="Back to dashboard" />
            <div className="container" style={{ display: 'grid', gap: '22px', paddingTop: '28px' }}>
                <section style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <p className="page-kicker">Admin vendors</p>
                        <h1 className="page-title" style={{ fontSize: 'clamp(30px, 4vw, 42px)' }}>Manage Vendors</h1>
                        <p className="page-subtitle">Create, approve, suspend, and archive vendor stores.</p>
                    </div>
                    <button type="button" className={showNewStoreForm ? 'btn btn-ghost' : 'btn btn-primary'} onClick={() => setShowNewStoreForm((value) => !value)}>
                        <Icon name={showNewStoreForm ? 'close' : 'plus'} size={17} />
                        {showNewStoreForm ? 'Cancel' : 'Add Vendor Store'}
                    </button>
                </section>

                {showNewStoreForm && (
                    <section className="card">
                        <h2 style={{ color: 'var(--ink)', marginBottom: '16px' }}>Create vendor store</h2>
                        <form onSubmit={handleCreateStore} style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', alignItems: 'end' }}>
                            <div>
                                <label htmlFor="store-name">Store name</label>
                                <input id="store-name" required type="text" value={newStore.name} onChange={(event) => setNewStore({ ...newStore, name: event.target.value })} placeholder="Food Truck 1" />
                            </div>
                            <div>
                                <label htmlFor="store-slug">Store slug</label>
                                <input id="store-slug" type="text" value={newStore.slug} onChange={(event) => setNewStore({ ...newStore, slug: event.target.value })} placeholder="food-truck-1" />
                            </div>
                            <div>
                                <label htmlFor="store-owner">Assign owner</label>
                                <select id="store-owner" required value={newStore.user_id} onChange={(event) => setNewStore({ ...newStore, user_id: event.target.value })}>
                                    <option value="">Select a user account...</option>
                                    {users.map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.email} ({user.full_name || 'No name'}) - {user.role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary">Create Store</button>
                        </form>
                    </section>
                )}

                {loading ? (
                    <div className="surface empty-state">
                        <div className="spinner" />
                        <p>Loading vendors</p>
                    </div>
                ) : (
                    <section className="data-table-wrap">
                        {stores.length === 0 ? (
                            <div className="empty-state">
                                <p>No vendors found.</p>
                            </div>
                        ) : (
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Store Info</th>
                                        <th>Owner</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stores.map((store) => (
                                        <tr key={store.id}>
                                            <td>
                                                <strong style={{ color: 'var(--ink)' }}>{store.name}</strong><br />
                                                <span className="text-muted" style={{ fontSize: '13px' }}>/{store.slug}</span>
                                            </td>
                                            <td>
                                                {store.user_profiles?.full_name || 'N/A'}<br />
                                                <span className="text-muted" style={{ fontSize: '13px' }}>{store.user_profiles?.email}</span>
                                            </td>
                                            <td>
                                                <span className={store.status === 'active' ? 'chip chip--green' : 'chip'}>
                                                    {store.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    {store.status !== 'active' && (
                                                        <button type="button" className="btn btn-ghost" style={{ color: 'var(--green)' }} onClick={() => handleUpdateStatus(store.id, 'active')}>
                                                            Approve
                                                        </button>
                                                    )}
                                                    {store.status === 'active' && (
                                                        <button type="button" className="btn btn-ghost" style={{ color: 'var(--orange)' }} onClick={() => handleUpdateStatus(store.id, 'suspended')}>
                                                            Suspend
                                                        </button>
                                                    )}
                                                    <button type="button" className="btn btn-ghost" style={{ color: 'var(--red)' }} onClick={() => setArchiveTarget(store)}>
                                                        Archive
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </section>
                )}
            </div>

            <ConfirmDialog
                open={Boolean(archiveTarget)}
                title="Archive store?"
                description={archiveTarget ? `${archiveTarget.name} will be hidden from buyer and seller operational views.` : ''}
                confirmLabel="Archive"
                onConfirm={handleArchiveStore}
                onCancel={() => setArchiveTarget(null)}
            />
        </main>
    );
}
