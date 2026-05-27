import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { OrderService } from '../../lib/services/order.service';
import { StripeService } from '../../lib/services/stripe.service';
import { useToast } from '../../components/ui/Toast';
import BottomNav from '../../components/ui/BottomNav';
import HoldToConfirmButton from '../../components/ui/HoldToConfirmButton';
import BackButton from '../../components/ui/BackButton';
import {
    canCancelUnpaidOrder,
    canContinuePendingPayment,
    getBuyerOrderStatusLabel,
} from '../../lib/orders';
import { formatCurrency, formatOrderCode, getInitials } from '../../lib/ui-format';

export default function BuyerProfile() {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionBusy, setActionBusy] = useState(null);
    const [orderFilter, setOrderFilter] = useState('active');
    const [sortMode, setSortMode] = useState('newest');
    const { addToast } = useToast();

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }

        async function fetchHistory() {
            if (!isSupabaseConfigured()) {
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('orders')
                    .select('*, stores(name, logo_url)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(10);

                if (!error && data) setOrders(data);
            } catch (err) {
                console.error('Error fetching history:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchHistory();
    }, [authLoading, user, navigate]);

    const filteredOrders = useMemo(() => {
        const sorted = [...orders].sort((a, b) => {
            const aTime = new Date(a.created_at || 0).getTime();
            const bTime = new Date(b.created_at || 0).getTime();
            return sortMode === 'oldest' ? aTime - bTime : bTime - aTime;
        });

        if (orderFilter === 'all') return sorted;
        if (orderFilter === 'payment') return sorted.filter((order) => canContinuePendingPayment(order));
        if (orderFilter === 'complete') {
            return sorted.filter((order) => ['collected', 'cancelled', 'refunded'].includes(order.status));
        }
        return sorted.filter((order) => !['collected', 'cancelled', 'refunded'].includes(order.status));
    }, [orders, orderFilter, sortMode]);

    const filterOptions = [
        { id: 'active', label: 'Active' },
        { id: 'payment', label: 'Needs payment' },
        { id: 'complete', label: 'Complete' },
        { id: 'all', label: 'All' },
    ];

    async function handleContinuePayment(event, order) {
        event.stopPropagation();

        if (!isSupabaseConfigured()) {
            addToast('Demo mode: payment recovery simulated.', 'info');
            return;
        }

        setActionBusy(`${order.id}:payment`);
        try {
            const session = await StripeService.createCheckoutSession({
                orderId: order.id,
                returnUrl: window.location.origin + '/#/order/track',
            });

            if (session?.url) {
                window.location.href = session.url;
                return;
            }

            throw new Error('Failed to generate payment link');
        } catch (error) {
            console.error('Continue payment failed:', error);
            addToast(error.buyerMessage || 'Could not restart payment. Please try again.', 'error');
        } finally {
            setActionBusy(null);
        }
    }

    async function handleCancelOrder(order) {
        if (!isSupabaseConfigured()) {
            setOrders((current) => current.map((item) => (
                item.id === order.id ? { ...item, status: 'cancelled' } : item
            )));
            addToast('Demo mode: order cancelled.', 'info');
            return;
        }

        setActionBusy(`${order.id}:cancel`);
        try {
            const updatedOrder = await OrderService.updateOrderStatus(order.id, 'cancelled');
            setOrders((current) => current.map((item) => (
                item.id === order.id
                    ? { ...item, ...(updatedOrder || {}), status: updatedOrder?.status || 'cancelled' }
                    : item
            )));
            addToast('Order cancelled.', 'success');
        } catch (error) {
            console.error('Cancel order failed:', error);
            addToast('Could not cancel this order. Refresh and try again.', 'error');
        } finally {
            setActionBusy(null);
        }
    }

    if (authLoading) {
        return (
            <main className="app-page app-page--buyer">
                <div className="surface empty-state">
                    <div className="spinner" />
                    <p>Loading profile</p>
                </div>
            </main>
        );
    }
    if (!user) return null;

    return (
        <main className="app-page app-page--buyer">
            <div className="container" style={{ display: 'grid', gap: '22px' }}>
                <section style={{ display: 'grid', gap: '14px' }}>
                    <BackButton to="/order" label="Back to vendors" style={{ width: 'fit-content' }} />
                    <div>
                        <p className="page-kicker">Account</p>
                        <h1 className="page-title" style={{ fontSize: 'clamp(30px, 4vw, 42px)' }}>My Orders</h1>
                    </div>
                </section>

                <section className="card">
                    <div className="flex gap-16 items-center">
                        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '24px', fontWeight: 950 }}>
                            {getInitials(profile?.full_name || user.email)}
                        </div>
                        <div>
                            <h2 style={{ color: 'var(--ink)', fontSize: '22px' }}>{profile?.full_name || 'Guest User'}</h2>
                            <p className="text-muted">{user.email}</p>
                        </div>
                    </div>
                </section>

                <section className="surface" style={{ display: 'grid', gap: '14px', padding: '16px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {filterOptions.map((option) => (
                            <button
                                key={option.id}
                                type="button"
                                className={orderFilter === option.id ? 'btn btn-purple' : 'btn btn-ghost'}
                                onClick={() => setOrderFilter(option.id)}
                                style={{ minHeight: '34px', padding: '8px 12px', fontSize: '12px' }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <p className="text-muted" style={{ fontSize: '13px' }}>
                            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} shown
                        </p>
                        <select aria-label="Sort orders" value={sortMode} onChange={(event) => setSortMode(event.target.value)} style={{ maxWidth: '180px' }}>
                            <option value="newest">Newest first</option>
                            <option value="oldest">Oldest first</option>
                        </select>
                    </div>
                </section>

                {loading ? (
                    <div className="surface empty-state">
                        <div className="spinner" />
                        <p>Loading history</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="surface empty-state">
                        <h3>No orders yet</h3>
                        <p>Your recent SKIIP orders will appear here.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '14px' }}>
                        {filteredOrders.length === 0 && (
                            <div className="surface empty-state">
                                <h3>No orders in this view</h3>
                                <p>Try another filter to see more of your order history.</p>
                            </div>
                        )}
                        {filteredOrders.map((order) => {
                            const canContinuePayment = canContinuePendingPayment(order);
                            const canCancelOrder = canCancelUnpaidOrder(order);
                            const paymentBusy = actionBusy === `${order.id}:payment`;
                            const cancelBusy = actionBusy === `${order.id}:cancel`;
                            const statusLabel = getBuyerOrderStatusLabel(order);

                            return (
                                <article
                                    key={order.id}
                                    className="card"
                                    onClick={() => navigate(`/order/track/${order.id}`)}
                                    style={{ cursor: 'pointer', display: 'grid', gap: '14px' }}
                                >
                                    <div className="flex justify-between items-center gap-16" style={{ flexWrap: 'wrap' }}>
                                        <div className="flex gap-16 items-center">
                                            {order.stores?.logo_url ? (
                                                <img src={order.stores.logo_url} alt={order.stores.name} style={{ width: '56px', height: '56px', borderRadius: '18px', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '56px', height: '56px', borderRadius: '18px', background: 'var(--surface-muted)', display: 'grid', placeItems: 'center', color: 'var(--ink)', fontWeight: 950 }}>
                                                    {getInitials(order.stores?.name || 'SKIIP')}
                                                </div>
                                            )}
                                            <div>
                                                <h3 style={{ color: 'var(--ink)', fontSize: '19px' }}>{order.stores?.name || 'Unknown Store'}</h3>
                                                <p className="text-muted" style={{ fontSize: '13px' }}>
                                                    {new Date(order.created_at).toLocaleDateString()} - {formatOrderCode(order)}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <h4 style={{ color: 'var(--ink)', fontSize: '20px' }}>{formatCurrency(order.total)}</h4>
                                            <span className={order.status === 'collected' ? 'chip chip--green' : 'chip chip--accent'}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} onClick={(event) => event.stopPropagation()}>
                                        {(canContinuePayment || canCancelOrder) && (
                                            <>
                                            {canContinuePayment && (
                                                <button type="button" className="btn btn-primary" disabled={Boolean(actionBusy)} onClick={(event) => handleContinuePayment(event, order)}>
                                                    {paymentBusy ? 'Opening payment...' : 'Continue payment'}
                                                </button>
                                            )}
                                            {canCancelOrder && (
                                                <HoldToConfirmButton disabled={Boolean(actionBusy)} onConfirm={() => handleCancelOrder(order)}>
                                                    {cancelBusy ? 'Cancelling...' : 'Cancel'}
                                                </HoldToConfirmButton>
                                            )}
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={() => navigate(`/report-issue?order_id=${order.id}`)}
                                        >
                                            Report an issue
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
            <BottomNav />
        </main>
    );
}
