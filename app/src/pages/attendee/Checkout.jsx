import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../lib/hooks/useCart';
import { useAuth } from '../../lib/context/AuthContext';
import { OrderService } from '../../lib/services/order.service';
import { StoreService } from '../../lib/services/store.service';
import { isSupabaseConfigured } from '../../lib/supabase';
import { StripeService } from '../../lib/services/stripe.service';
import { useToast } from '../../components/ui/Toast';

export default function Checkout() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading } = useAuth();
    const { items, getCartTotal, vendorId, clearCart } = useCart();
    const { addToast } = useToast();

    // Missing state variables
    const [vendor, setVendor] = useState(null);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const [tipAmount, setTipAmount] = useState(0);
    const [customTip, setCustomTip] = useState('');
    const [selectedTipPercent, setSelectedTipPercent] = useState(0);

    const subtotal = getCartTotal();
    const total = subtotal + tipAmount;

    useEffect(() => {
        // Pre-fill from profile if available (priority) or user object
        if (profile) {
            if (profile.email && !email) setEmail(profile.email);
            if (profile.phone && !phone) setPhone(profile.phone);
        } else if (user) {
            if (user.email && !email) setEmail(user.email);
        }

        if (vendorId) {
            fetchVendor();
        }
    }, [user, profile, authLoading, vendorId]);

    const handleTipSelect = (percent) => {
        setSelectedTipPercent(percent);
        const amount = subtotal * (percent / 100);
        setTipAmount(amount);
        setCustomTip('');
    };

    const handleCustomTipChange = (e) => {
        const val = e.target.value;
        setCustomTip(val);
        setSelectedTipPercent(null);
        const amount = parseFloat(val) || 0;
        setTipAmount(amount);
    };

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

            // 1. Validation
            if (!email || !phone) {
                addToast('Please provide both an email and a phone number.', 'error');
                setProcessing(false);
                return;
            }

            // 2. Pre-check Vendor Payment Readiness
            if (vendor && !vendor.stripe_onboarding_complete) {
                addToast('This vendor is not yet set up to receive payments. Their bank account is still being connected.', 'error');
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

            // 3. Process Payment via Stripe
            addToast('Redirecting to secure payment...', 'info');

            const session = await StripeService.createCheckoutSession({
                orderId: order.id,
                items: items,
                tip_amount: tipAmount,
                returnUrl: window.location.origin + '/order/track'
            });

            if (session?.url) {
                // Redirect to Stripe Checkout
                window.location.href = session.url;
            } else {
                throw new Error('Failed to generate payment link');
            }
        } catch (error) {
            console.error('Checkout error:', error);
            
            // Specific error handling for vendor status from Edge Function
            if (error.message?.includes('VENDOR_NOT_READY')) {
                addToast('Oops! This vendor is still setting up their bank account on SKIIP. Please try again later.', 'error');
            } else {
                addToast('We had trouble starting the payment. Please check back soon.', 'error');
            }
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
                            <span>£{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    
                    {tipAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '12px' }}>
                            <span>Tip</span>
                            <span>£{tipAmount.toFixed(2)}</span>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--stroke)', fontSize: '20px', fontWeight: '700' }}>
                        <span>Total</span>
                        <span className="text-accent">£{total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Tip Selection */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ marginBottom: '8px' }}>Add a Tip</h3>
                    <p className="text-muted" style={{ fontSize: '14px', marginBottom: '16px' }}>100% of tips go to the vendor staff</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
                        {[0, 5, 10, 15].map((percent) => (
                            <button
                                key={percent}
                                type="button"
                                onClick={() => handleTipSelect(percent)}
                                className={selectedTipPercent === percent ? 'btn btn-primary' : 'btn btn-ghost'}
                                style={{ padding: '10px' }}
                            >
                                {percent === 0 ? 'None' : `${percent}%`}
                            </button>
                        ))}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }}>£</span>
                        <input
                            type="number"
                            step="0.01"
                            value={customTip}
                            onChange={handleCustomTipChange}
                            placeholder="Custom amount"
                            style={{ width: '100%', padding: '12px 12px 12px 28px', borderRadius: '8px', border: '1px solid var(--stroke)', background: 'var(--card)' }}
                        />
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
                            placeholder="+44 XX XXX XXXX"
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
                        {processing ? 'Processing...' : `Pay £${total.toFixed(2)}`}
                    </button>
                </form>

                <p className="text-muted" style={{ textAlign: 'center', marginTop: '24px', fontSize: '13px' }}>
                    🔒 Powered by Stripe. Your payment information is secure.
                </p>
            </div>
        </div>
    );
}
