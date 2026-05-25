import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import AdminShell from '../../components/admin/AdminShell';
import { AdminStoreService } from '../../lib/services/adminStore.service';
import { AdminService } from '../../lib/services/admin.service';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Icon from '../../components/ui/Icon';
import { formatCurrency } from '../../lib/ui-format';

const STORE_CATEGORIES = ['Food', 'Drinks', 'Dessert', 'Coffee', 'Other'];

export default function AdminVendors() {
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const [showNewStoreForm, setShowNewStoreForm] = useState(false);
    const [archiveTarget, setArchiveTarget] = useState(null);
    const [newStore, setNewStore] = useState({ name: '', slug: '', user_id: '' });
    const [updatingCategoryId, setUpdatingCategoryId] = useState(null);
    const [vendorPerformance, setVendorPerformance] = useState([]);
    const [performanceLoading, setPerformanceLoading] = useState(true);
    const [performanceUnavailable, setPerformanceUnavailable] = useState(false);

    useEffect(() => {
        fetchData();
        fetchVendorPerformance();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const { data: storesData, error: storesError } = await supabase
                .from('stores')
                .select('id, name, slug, status, category, created_at, user_id, deleted_at')
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

    async function fetchVendorPerformance() {
        try {
            const metrics = await AdminService.getDashboardMetrics();
            setVendorPerformance(metrics?.vendors || []);
        } catch (error) {
            console.error('Error fetching vendor performance:', error);
            setPerformanceUnavailable(true);
        } finally {
            setPerformanceLoading(false);
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

    async function handleUpdateCategory(storeId, category) {
        try {
            setUpdatingCategoryId(storeId);
            await AdminStoreService.updateStoreCategory(storeId, category);
            addToast(`Store category set to ${category}`, 'success');
            fetchData();
        } catch (error) {
            addToast(error.message, 'error');
        } finally {
            setUpdatingCategoryId(null);
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
        <AdminShell
            title="Vendors"
            subtitle="Create, approve, suspend, and archive vendor stores."
            actions={(
                <button type="button" className={showNewStoreForm ? 'btn btn-ghost' : 'btn btn-accent'} onClick={() => setShowNewStoreForm((value) => !value)}>
                    <Icon name={showNewStoreForm ? 'close' : 'plus'} size={17} />
                    {showNewStoreForm ? 'Cancel' : 'Add Vendor Store'}
                </button>
            )}
        >
            {showNewStoreForm && (
                <section className="admin-panel">
                    <h2>Create vendor store</h2>
                    <form className="admin-vendor-form" onSubmit={handleCreateStore}>
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
                        <button type="submit" className="btn btn-accent">Create Store</button>
                    </form>
                </section>
            )}

            <section className="admin-panel">
                <h2>Vendor Performance</h2>
                {performanceLoading ? (
                    <p className="text-muted">Loading vendor activity...</p>
                ) : performanceUnavailable ? (
                    <p className="text-muted">Vendor activity is unavailable. Vendor management remains available below.</p>
                ) : vendorPerformance.length === 0 ? (
                    <p className="text-muted">No vendor activity yet.</p>
                ) : (
                    <div className="admin-performance-list">
                        {vendorPerformance.map((vendor) => (
                            <div key={vendor.store_id}>
                                <span>
                                    <strong>{vendor.store_name}</strong>
                                    <small>{vendor.status}</small>
                                </span>
                                <span>
                                    <strong>{vendor.orders} orders</strong>
                                    <small>{formatCurrency(vendor.revenue || 0)} vendor gross</small>
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {loading ? (
                <section className="admin-panel empty-state">
                    <div className="spinner" />
                    <p>Loading vendors</p>
                </section>
            ) : (
                <section className="admin-table-wrap">
                    {stores.length === 0 ? (
                        <div className="empty-state">
                            <p>No vendors found.</p>
                        </div>
                    ) : (
                        <table className="data-table admin-vendors-table">
                            <thead>
                                <tr>
                                    <th>Store Info</th>
                                    <th>Owner</th>
                                    <th>Category</th>
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
                                            <select
                                                aria-label={`Category for ${store.name}`}
                                                value={store.category || 'Food'}
                                                disabled={updatingCategoryId === store.id}
                                                onChange={(event) => handleUpdateCategory(store.id, event.target.value)}
                                                style={{ minWidth: '130px' }}
                                            >
                                                {STORE_CATEGORIES.map((category) => (
                                                    <option key={category} value={category}>{category}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <span className={store.status === 'active' ? 'chip chip--green' : 'chip'}>
                                                {store.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className="admin-table-actions">
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

            <ConfirmDialog
                open={Boolean(archiveTarget)}
                title="Archive store?"
                description={archiveTarget ? `${archiveTarget.name} will be hidden from buyer and seller operational views.` : ''}
                confirmLabel="Archive"
                onConfirm={handleArchiveStore}
                onCancel={() => setArchiveTarget(null)}
            />
        </AdminShell>
    );
}
