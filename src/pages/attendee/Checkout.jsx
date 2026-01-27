import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function Checkout() {
    const navigate = useNavigate();
    const [phone, setPhone] = useState('');
    const [processing, setProcessing] = useState(false);

    // Get cart from sessionStorage
    const cartData = JSON.parse(sessionStorage.getItem('cart') || '{}');
    const { vendor, items = [] } = cartData;

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    async function handleCheckout(e) {
        e.preventDefault();
        setProcessing(true);

        try {
            // Create order in database
            const { data: order, error } = await supabase
                .from('orders')
                .insert([{
                    vendor_id: cartData.vendorId,
                    customer_phone: phone,
                    items: items,
                    total_amount: total,
                    status: 'pending_payment'
                }])
                .select()
                .single();

            if (error) throw error;

            // In real implementation, integrate Stripe here
            // For MVP, we'll simulate payment success
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Update order status to paid
            await supabase
                .from('orders')
                .update({ status: 'preparing' })
                .eq('id', order.id);

            // Clear cart
            sessionStorage.removeItem('cart');

            // Navigate to order tracker
            navigate(`/order/track/${order.id}`);
        } catch (error) {
            console.error('Error creating order:', error);
            alert('Failed to create order. Please try again.');
        } finally {
            setProcessing(false);
        }
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
                        <label>WhatsApp Number</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+27 XX XXX XXXX"
                            required
                            style={{ marginBottom: '12px' }}
                        />
                        <p className="text-muted" style={{ fontSize: '13px' }}>We'll send your order updates to this number via WhatsApp</p>
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
