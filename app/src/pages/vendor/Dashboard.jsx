import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';
import { StoreService } from '../../lib/services/store.service';
import { StripeService } from '../../lib/services/stripe.service';
import { useToast } from '../../components/ui/Toast';
import { useStoreOrders, useUpdateOrderStatus } from '../../lib/hooks/useOrders';

const STATUS_COLORS = {
    pending: '#9b9ba5',
    pending_payment: '#9b9ba5',
    paid: '#3b82f6',
    preparing: '#f59e0b',
    ready: '#10b981',
    collected: '#8b5cf6',
    cancelled: '#ef4444',
};

export default function VendorDashboard() {
    const navigate = useNavigate();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // active | all
    const { addToast } = useToast();

    // React Query Hooks
    const { data: orders = [], isLoading: isOrdersLoading, refetch: fetchOrders } = useStoreOrders(store?.id, filter);
    const updateOrderStatusMutation = useUpdateOrderStatus();

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (store && isSupabaseConfigured()) {
            // Subscribe to realtime order updates
            const subscription = supabase
                .channel('store-orders')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `store_id=eq.${store.id}`
                }, () => {
                    fetchOrders();
                    playNotificationSound();
                })
                .subscribe();

            return () => subscription.unsubscribe();
        }
    }, [store, filter, fetchOrders]);

    async function checkAuth() {
        try {
            if (!isSupabaseConfigured()) {
                // Demo mode mock data
                setStore({ id: '1', name: 'Burger Bliss (Demo)', description: 'Demo Store' });
                setLoading(false);
                return;
            }

            const session = await AuthService.getSession();
            if (!session) {
                navigate('/vendor/login');
                return;
            }

            const storeData = await StoreService.getStoreByUserId(session.user.id);
            if (!storeData) {
                console.warn('Auth check failed: Store not found for user', session.user.id);
                addToast('No store found for this account.', 'error');
                navigate('/');
                return;
            }

            setStore(storeData);
        } catch (error) {
            console.error('Auth check failed with specific error:', error);
            addToast(`Auth error: ${error.message || 'Unknown error'}`, 'error');
            navigate('/vendor/login');
        } finally {
            setLoading(false);
        }
    }

    async function updateOrderStatus(orderId, newStatus) {
        if (!isSupabaseConfigured()) {
            addToast('Demo mode: status update simulated', 'info');
            return;
        }

        updateOrderStatusMutation.mutate(
            { orderId, status: newStatus },
            {
                onSuccess: () => {
                    addToast(`Order marked as ${newStatus}`, 'success');
                },
                onError: (error) => {
                    console.error('Error updating status:', error);
                    addToast('Failed to update status', 'error');
                }
            }
        );
    }

    async function handleLogout() {
        if (isSupabaseConfigured()) {
            await AuthService.signOut();
        }
        navigate('/vendor/login');
    }

    function playNotificationSound() {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVang8bllHAU2jdXy0Ho0Bitu/fDckUoLEV61/O+jWRMLRp3i8rltIAU1idLy1YU1BiJwwu/gl0gNDlSn4PK8aCAFNYzU8tN+MwYpasPv4ppIDg5Tp9/yu2kgBTWL1PLTfzMGKWrD7+KbSA4OU6ff8rtoIAU0i9Ty038zBilqw+/im0gODlKn3/K7aSAFNIvU8tN/MwYpasLv45tIDg5Sp9/yu2kgBTSL1PLTfzMGKWu/7+OaRg4MU6fe8rxoH');
        audio.play().catch(() => { });
    }

    async function handleConnectStripe() {
        if (!isSupabaseConfigured()) {
            addToast('Demo mode: Onboarding simulated', 'info');
            return;
        }

        try {
            setLoading(true);
            const { url } = await StripeService.createOnboardingLink({
                storeId: store.id,
                returnUrl: window.location.origin + '/vendor/dashboard',
                refreshUrl: window.location.origin + '/vendor/dashboard',
            });

            if (url) {
                window.location.href = url;
            } else {
                throw new Error('Failed to generate onboarding link');
            }
        } catch (error) {
            console.error('Onboarding failed:', error);
            addToast('Failed to start onboarding. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            {/* Header */}
            <header style={{ padding: '20px 0', borderBottom: '1px solid var(--stroke)', marginBottom: '40px' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>{store?.name}</h1>
                        <p className="text-muted" style={{ fontSize: '14px' }}>Vendor Dashboard</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => navigate('/vendor/products')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>Manage Products</button>
                    </div>
                </div>
            </header>

            <div className="container">
                {/* Onboarding Banner */}
                {store && !store.stripe_onboarding_complete && (
                    <div className="card" style={{ 
                        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
                        color: 'white', 
                        marginBottom: '32px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '24px'
                    }}>
                        <div>
                            <h2 style={{ marginBottom: '8px', color: 'white' }}>Connect your bank account</h2>
                            <p style={{ opacity: 0.9 }}>To receive payouts and accept live orders, you need to set up your account with Stripe.</p>
                        </div>
                        <button 
                            onClick={handleConnectStripe} 
                            className="btn" 
                            style={{ background: 'white', color: '#6366f1', fontWeight: '700', padding: '12px 24px' }}
                        >
                            Start Getting Paid
                        </button>
                    </div>
                )}
                {/* Filter Tabs */}
                <div style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
                    <button
                        onClick={() => setFilter('active')}
                        className={filter === 'active' ? 'btn btn-primary' : 'btn btn-ghost'}
                    >
                        Active Orders
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={filter === 'all' ? 'btn btn-primary' : 'btn btn-ghost'}
                    >
                        All Orders
                    </button>
                </div>

                {/* Orders Grid */}
                {orders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                        <h3>No orders yet</h3>
                        <p className="text-muted">New orders will appear here</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {orders.map((order) => (
                            <div key={order.id} className="card" style={{ borderLeft: `4px solid ${STATUS_COLORS[order.status] || '#ccc'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ marginBottom: '4px' }}>Order #{order.id.slice(0, 8)}</h3>
                                        <p className="text-muted" style={{ fontSize: '14px' }}>
                                            {new Date(order.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '20px', fontWeight: '700', color: STATUS_COLORS[order.status] }}>
                                            {order.status.replace('_', ' ').toUpperCase()}
                                        </p>
                                        <p style={{ fontSize: '14px' }}>📱 {order.customer_phone}</p>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                                    {(order.order_items || []).map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span>{item.quantity}× {item.product_snapshot?.name || 'Item'}</span>
                                            <span>R{(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--stroke)', fontWeight: '700' }}>
                                        <span>Total</span>
                                        <span className="text-accent">R{order.total?.toFixed(2) || order.total_amount?.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {order.status === 'preparing' && (
                                        <button onClick={() => updateOrderStatus(order.id, 'ready')} className="btn btn-primary">
                                            ✅ Mark as Ready
                                        </button>
                                    )}
                                    {order.status === 'ready' && (
                                        <button onClick={() => updateOrderStatus(order.id, 'collected')} className="btn btn-primary">
                                            🎉 Mark as Collected
                                        </button>
                                    )}
                                    {order.status === 'pending' && (
                                        <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="btn btn-primary">
                                            👨‍🍳 Start Preparing
                                        </button>
                                    )}
                                    {(order.status === 'preparing' || order.status === 'ready' || order.status === 'pending') && (
                                        <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="btn btn-ghost" style={{ color: '#ef4444' }}>
                                            ❌ Cancel Order
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
