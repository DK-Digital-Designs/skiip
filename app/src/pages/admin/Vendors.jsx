import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';
import AttendeeHeader from '../../components/shared/AttendeeHeader';

export default function AdminVendors() {
    const [stores, setStores] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    // New Store Form State
    const [showNewStoreForm, setShowNewStoreForm] = useState(false);
    const [newStore, setNewStore] = useState({ name: '', slug: '', user_id: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch stores without relational join
            const { data: storesData, error: storesError } = await supabase
                .from('stores')
                .select('id, name, slug, status, created_at, user_id')
                .order('created_at', { ascending: false });

            if (storesError) throw storesError;

            // Fetch users (potential owners)
            const { data: usersData, error: usersError } = await supabase
                .from('user_profiles')
                .select('id, email, full_name, role')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;

            // Manual Join in javascript
            const enrichedStores = (storesData || []).map(store => {
                const ownerInfo = (usersData || []).find(u => u.id === store.user_id);
                return {
                    ...store,
                    user_profiles: ownerInfo || null
                };
            });

            setStores(enrichedStores);
            setUsers(usersData || []);
        } catch (error) {
            console.error('Error fetching admin data:', error);
            addToast('Failed to load vendors', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (storeId, newStatus) => {
        try {
            const { error } = await supabase
                .from('stores')
                .update({ status: newStatus })
                .eq('id', storeId);

            if (error) throw error;
            addToast(`Store marked as ${newStatus}`, 'success');
            fetchData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    const handleDeleteStore = async (storeId) => {
        if (!window.confirm('Are you sure you want to delete this store?')) return;
        
        try {
            const { error } = await supabase
                .from('stores')
                .delete()
                .eq('id', storeId);

            if (error) throw error;
            addToast('Store deleted permanently', 'success');
            fetchData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    const handleCreateStore = async (e) => {
        e.preventDefault();
        try {
            // Ensure owner role is seller
            await supabase
                .from('user_profiles')
                .update({ role: 'seller' })
                .eq('id', newStore.user_id);

            const { error } = await supabase
                .from('stores')
                .insert([{
                    user_id: newStore.user_id,
                    name: newStore.name,
                    slug: newStore.slug || newStore.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                    status: 'active'
                }]);

            if (error) throw error;
            
            addToast('Store created successfully!', 'success');
            setShowNewStoreForm(false);
            setNewStore({ name: '', slug: '', user_id: '' });
            fetchData();
        } catch (error) {
            addToast(error.message, 'error');
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
            <AttendeeHeader backTo="/admin/dashboard" backLabel="← Back to Dashboard" />
            
            <div className="container" style={{ paddingBottom: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800' }}>Manage Vendors</h1>
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowNewStoreForm(!showNewStoreForm)}
                    >
                        {showNewStoreForm ? 'Cancel' : '+ Add Vendor Store'}
                    </button>
                </div>

                {showNewStoreForm && (
                    <div className="card" style={{ marginBottom: '32px', padding: '24px' }}>
                        <h2 style={{ marginBottom: '16px' }}>Create New Vendor Store</h2>
                        <form onSubmit={handleCreateStore} style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', alignItems: 'end' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label>Store Name</label>
                                <input 
                                    required 
                                    type="text" 
                                    value={newStore.name} 
                                    onChange={e => setNewStore({...newStore, name: e.target.value})} 
                                    placeholder="Food Truck 1" 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label>Store Slug (Optional)</label>
                                <input 
                                    type="text" 
                                    value={newStore.slug} 
                                    onChange={e => setNewStore({...newStore, slug: e.target.value})} 
                                    placeholder="food-truck-1" 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <label>Assign Owner</label>
                                <select 
                                    required
                                    value={newStore.user_id}
                                    onChange={e => setNewStore({...newStore, user_id: e.target.value})}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg)', border: '1px solid var(--stroke)', color: 'var(--text)' }}
                                >
                                    <option value="">Select a user account...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>
                                            {u.email} ({u.full_name || 'No name'}) - {u.role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '48px' }}>Create Store</button>
                            </div>
                        </form>
                    </div>
                )}

                {loading ? (
                    <p>Loading vendors...</p>
                ) : (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        {stores.length === 0 ? (
                            <div style={{ padding: '60px', textAlign: 'center' }}>
                                <p className="text-muted">No vendors found.</p>
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--stroke)' }}>
                                    <tr>
                                        <th style={{ padding: '16px' }}>Store Info</th>
                                        <th style={{ padding: '16px' }}>Owner</th>
                                        <th style={{ padding: '16px' }}>Status</th>
                                        <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {stores.map(store => (
                                        <tr key={store.id} style={{ borderBottom: '1px solid var(--stroke)' }}>
                                            <td style={{ padding: '16px' }}>
                                                <strong>{store.name}</strong><br/>
                                                <span className="text-muted" style={{ fontSize: '13px' }}>/{store.slug}</span>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                {store.user_profiles?.full_name || 'N/A'}<br/>
                                                <span className="text-muted" style={{ fontSize: '13px' }}>{store.user_profiles?.email}</span>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <span style={{ 
                                                    padding: '4px 8px', 
                                                    borderRadius: '4px', 
                                                    fontSize: '12px',
                                                    background: store.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                    color: store.status === 'active' ? '#4ade80' : '#fbbf24'
                                                }}>
                                                    {store.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {store.status !== 'active' && (
                                                        <button 
                                                            className="btn btn-ghost" 
                                                            style={{ padding: '6px 12px', fontSize: '12px', color: '#4ade80' }}
                                                            onClick={() => handleUpdateStatus(store.id, 'active')}
                                                        >
                                                            Approve
                                                        </button>
                                                    )}
                                                    {store.status === 'active' && (
                                                        <button 
                                                            className="btn btn-ghost" 
                                                            style={{ padding: '6px 12px', fontSize: '12px', color: '#fbbf24' }}
                                                            onClick={() => handleUpdateStatus(store.id, 'suspended')}
                                                        >
                                                            Suspend
                                                        </button>
                                                    )}
                                                    <button 
                                                        className="btn btn-ghost" 
                                                        style={{ padding: '6px 12px', fontSize: '12px', color: '#f87171' }}
                                                        onClick={() => handleDeleteStore(store.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
