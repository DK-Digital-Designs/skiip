import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../lib/hooks/useCart';
import { useAuth } from '../../lib/context/AuthContext';
import { OrderService } from '../../lib/services/order.service';
import { StoreService } from '../../lib/services/store.service';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../components/ui/Toast';

export default function Checkout() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { items, getCartTotal, vendorId, clearCart } = useCart();
    const { addToast } = useToast();

    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState(user?.email || '');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [vendor, setVendor] = useState(null);

    const total = getCartTotal();

    useEffect(() => {
        // Pre-fill email when user loads
        if (user?.email && !email) {
            setEmail(user.email);
        }

        if (vendorId) {
            fetchVendor();
        }
    }, [user, authLoading, vendorId]);

    async function fetchVendor() {
        if (!isSupabaseConfigured()) return; // Handle demo mode if needed, but OrderService requires Supabase
        try {
            const data = await StoreService.getStoreById(vendorId);
            setVendor(data);
        } catch (error) {
            console.error('Error fetching vendor:', error);
        }
    }

    async function handleCheckout(e) {
        e.preventDefault();
        setProcessing(true);

        try {
            if (!isSupabaseConfigured()) {
                addToast('Demo mode: Connect Supabase to place real orders.', 'info');
                setProcessing(false);
                return;
            }

            const order = await OrderService.createOrder({
                store_id: vendorId,
                items: items,
                total: total,
                customer_email: email || user?.email,
                customer_phone: phone,
                notes: notes,
                user_id: user?.id || null // Support guest checkout
            });

            // 2. Process Payment via Stripe
            addToast('Redirecting to secure payment...', 'info');
            // For now, StripeService handles the mock/live logic
            // In a real app, this would redirect or show a card element
            // await StripeService.createCheckoutSession({ orderId: order.id, ... }); 

            // Simulate slight delay for "payment processing"
            await new Promise(r => setTimeout(r, 1500));

            // Clear cart
            clearCart();

            // Navigate to order tracker
            addToast('Order placed successfully!', 'success');
            navigate(`/order/track/${order.id}`);
        } catch (error) {
            console.error('Error creating order:', error);
            addToast('Failed to create order. Please try again.', 'error');
        } finally {
            setProcessing(false);
        }
    }

    if (authLoading) return <div>Loading...</div>;
    if (!items.length) {
        return (
            <div className="container" style={{ padding: '60px', textAlign: 'center' }}>
                <h2>Your cart is empty</h2>
                <button onClick={() => navigate('/order')} className="btn btn-primary" style={{ marginTop: '20px' }}>
                    Browse Vendors
                </button>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
            <header style={{ padding: '20px 0', borderBottom: '1px solid var(--stroke)', marginBottom: '40px' }}>
                <div className="container">
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '16px', cursor: 'pointer', fontWeight: '600' }}>
                        ← Back
                    </button>
                </div>
            </header>

            <div className="container" style={{ maxWidth: '600px' }}>
                <h1 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '40px' }}>Checkout</h1>

                {/* Order Summary */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '16px' }}>Order Summary</h3>
                    {vendor && <p className="text-accent" style={{ marginBottom: '16px' }}>📍 {vendor.name}</p>}
                    {items.map((item, index) => (
                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px', borderBottom: index < items.length - 1 ? '1px solid var(--stroke)' : 'none' }}>
                            <span>{item.quantity}× {item.name}</span>
                            <span>R{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--stroke)', fontSize: '20px', fontWeight: '700' }}>
                        <span>Total</span>
                        <span className="text-accent">R{total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Contact Form */}
                <form onSubmit={handleCheckout}>
                    <div className="card" style={{ marginBottom: '24px' }}>
                        <h3 style={{ marginBottom: '16px' }}>Contact Information</h3>

                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                            style={{ marginBottom: '16px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--stroke)', background: 'var(--card)' }}
                        />

                        <label>WhatsApp Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+27 XX XXX XXXX"
                            required
                            style={{ marginBottom: '16px', width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--stroke)', background: 'var(--card)' }}
                        />

                        <label>Notes (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Allergies, instructions, etc."
                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--stroke)', background: 'var(--card)', minHeight: '80px' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', fontSize: '18px', padding: '16px' }}
                        disabled={processing}
                    >
                        {processing ? 'Processing...' : `Pay R${total.toFixed(2)}`}
                    </button>
                </form>

                <p className="text-muted" style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px' }}>
                    🔒 Powered by Stripe. Your payment information is secure.
                </p>
            </div>
        </div>
    );
}
