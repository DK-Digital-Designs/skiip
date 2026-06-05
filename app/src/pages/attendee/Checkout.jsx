import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../lib/hooks/useCart';
import { useAuth } from '../../lib/context/AuthContext';
import { OrderService } from '../../lib/services/order.service';
import { StoreService } from '../../lib/services/store.service';
import { isSupabaseConfigured } from '../../lib/supabase';
import { StripeService } from '../../lib/services/stripe.service';
import { GENERIC_CHECKOUT_ERROR_MESSAGE } from '../../lib/services/function-error';
import { useToast } from '../../components/ui/Toast';
import BottomNav from '../../components/ui/BottomNav';
import QuantityControl from '../../components/ui/QuantityControl';
import Icon from '../../components/ui/Icon';
import OrderItemSummary from '../../components/orders/OrderItemSummary';
import { formatCurrency } from '../../lib/ui-format';
import {
    getCartLineDisplayName,
    hasConfiguredCartLines,
    hasNonUuidSelectedOptionIds,
    normalizeCartLine,
} from '../../lib/cart/cartLineIdentity';
import { canCheckoutConfiguredProductModifiers } from '../../lib/features/productModifiers';
import {
    toScheduledCollectionPayload,
} from '../../lib/scheduledCollection';
import { trackSkiipEvent } from '../../lib/analytics';
import { calculateOrderSummary } from '../../lib/orders';
import { normalizeOperationalPhone } from '../../lib/phone';

export default function Checkout() {
    const navigate = useNavigate();
    const { user, profile, loading: authLoading } = useAuth();
    const { items, addItem, removeItem, removeLineItem, vendorId } = useCart();
    const { addToast } = useToast();

    const [vendor, setVendor] = useState(null);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);
    const [tipAmount, setTipAmount] = useState(0);
    const [customTip, setCustomTip] = useState('');
    const [selectedTipPercent, setSelectedTipPercent] = useState(0);

    const { subtotal, tip, serviceFee, total } = calculateOrderSummary(items, tipAmount);
    const cartItemCount = items.reduce((count, item) => count + item.quantity, 0);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login', { state: { from: { pathname: '/order/checkout' } }, replace: true });
            return;
        }

        if (profile) {
            if (profile.email && !email) setEmail(profile.email);
            if (profile.phone && !phone) setPhone(profile.phone);
        } else if (user?.email && !email) {
            setEmail(user.email);
        }

        if (vendorId) {
            fetchVendor();
        }
    }, [user, profile, authLoading, vendorId, navigate]);

    function handleTipSelect(percent) {
        setSelectedTipPercent(percent);
        setTipAmount(subtotal * (percent / 100));
        setCustomTip('');
    }

    function handleCustomTipChange(event) {
        const value = event.target.value;
        setCustomTip(value);
        setSelectedTipPercent(null);
        setTipAmount(parseFloat(value) || 0);
    }

    async function fetchVendor() {
        if (!isSupabaseConfigured()) return;
        try {
            const data = await StoreService.getStoreById(vendorId);
            setVendor(data);
        } catch (error) {
            console.error('Error fetching vendor:', error);
        }
    }

    async function handleCheckout(event) {
        event.preventDefault();
        setProcessing(true);
        trackSkiipEvent('payment_started', { items: cartItemCount });

        function stopCheckout(reason, message, type = 'error') {
            trackSkiipEvent('checkout_failed', { reason });
            addToast(message, type);
            setProcessing(false);
        }

        try {
            if (hasConfiguredCartLines(items) && !canCheckoutConfiguredProductModifiers()) {
                stopCheckout('configured_checkout_not_enabled', 'Checkout for configured products is not enabled yet.');
                return;
            }

            if (hasConfiguredCartLines(items) && hasNonUuidSelectedOptionIds(items)) {
                stopCheckout('configured_checkout_mock_options', 'This cart contains preview modifier choices. Remove and re-add those items before checkout.');
                return;
            }

            if (!isSupabaseConfigured()) {
                stopCheckout('demo_mode', 'Demo mode: Connect Supabase to place real orders.', 'info');
                return;
            }

            if (!user) {
                stopCheckout('signed_out', 'Please sign in before placing an order.');
                navigate('/login', { state: { from: { pathname: '/order/checkout' } } });
                return;
            }

            const trimmedEmail = email.trim();
            const customerPhone = normalizeOperationalPhone(phone);

            if (!trimmedEmail) {
                stopCheckout('missing_email', 'Please provide an email address.');
                return;
            }

            if (!customerPhone) {
                stopCheckout('invalid_phone', 'Please provide a valid phone number for order support.');
                return;
            }

            let scheduledPayload;
            try {
                scheduledPayload = toScheduledCollectionPayload('');
            } catch (error) {
                stopCheckout('invalid_collection_time', error.message || 'Choose a valid scheduled collection time.');
                return;
            }

            const vendorStripeStatus = vendor?.stripe_connect_status
                || (vendor?.stripe_onboarding_complete ? 'ready' : 'onboarding');
            if (vendor && vendorStripeStatus !== 'ready') {
                stopCheckout('vendor_not_ready', 'This vendor is not yet set up to receive payments.');
                return;
            }

            const order = await OrderService.createOrder({
                items,
                customer_email: trimmedEmail || user?.email,
                customer_phone: customerPhone,
                whatsapp_opt_in: false,
                notes,
                tip_amount: tip,
                ...scheduledPayload,
            });
            trackSkiipEvent('order_created', { items: cartItemCount });

            addToast('Redirecting to secure payment...', 'info');

            const session = await StripeService.createCheckoutSession({
                orderId: order.id,
                returnUrl: window.location.origin + '/#/order/track',
            });

            if (session?.url) {
                trackSkiipEvent('payment_redirected', { items: cartItemCount });
                window.location.href = session.url;
                return;
            }

            throw new Error('Failed to generate payment link');
        } catch (error) {
            console.error('Checkout error:', error);
            trackSkiipEvent('checkout_failed', { reason: 'payment_error' });
            addToast(error.buyerMessage || GENERIC_CHECKOUT_ERROR_MESSAGE, 'error');
        } finally {
            setProcessing(false);
        }
    }

    if (authLoading) {
        return (
            <main className="app-page">
                <div className="narrow-container surface empty-state">
                    <div className="spinner" />
                    <p>Loading checkout</p>
                </div>
            </main>
        );
    }

    if (!user) return null;

    if (!items.length) {
        return (
            <main className="app-page app-page--buyer">
                <div className="narrow-container surface empty-state">
                    <h2>Your cart is empty</h2>
                    <button type="button" onClick={() => navigate('/order')} className="btn btn-primary">
                        Browse Vendors
                    </button>
                </div>
                <BottomNav />
            </main>
        );
    }

    return (
        <main className="app-page app-page--buyer">
            <div className="container" style={{ display: 'grid', gap: '22px' }}>
                <button type="button" onClick={() => navigate(-1)} className="btn btn-ghost" style={{ width: 'fit-content' }}>
                    Back
                </button>
                <div>
                    <p className="page-kicker">Checkout</p>
                    <h1 className="page-title">Review and pay</h1>
                    <p className="page-subtitle" style={{ marginTop: '10px' }}>
                        Confirm your order details before secure payment.
                    </p>
                </div>

                <form onSubmit={handleCheckout} className="two-column">
                    <div style={{ display: 'grid', gap: '18px' }}>
                        <section className="card">
                            <h2 style={{ color: 'var(--ink)', marginBottom: '14px' }}>Contact details</h2>
                            <label htmlFor="checkout-email">Email</label>
                            <input
                                id="checkout-email"
                                type="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="name@example.com"
                                required
                                style={{ marginBottom: '16px' }}
                            />

                            <label htmlFor="checkout-phone">Phone number</label>
                            <input
                                id="checkout-phone"
                                type="tel"
                                value={phone}
                                onChange={(event) => setPhone(event.target.value)}
                                placeholder="07700 900123"
                                required
                                style={{ marginBottom: '16px' }}
                            />

                            <div style={{
                                marginBottom: '16px',
                                padding: '14px 16px',
                                border: '1px solid rgba(239,68,68,0.5)',
                                borderRadius: '14px',
                                background: 'rgba(239,68,68,0.08)',
                            }}>
                                <strong style={{ display: 'block', color: 'var(--red)', marginBottom: '4px' }}>
                                    Confirmation
                                </strong>
                                <p style={{ color: 'var(--ink)', fontSize: '14px', lineHeight: 1.5 }}>
                                    By proceeding, you confirm that you have notified the vendor of any allergies or dietary requirements in the notes section.
                                </p>
                            </div>

                            <label htmlFor="checkout-notes">Notes</label>
                            <textarea
                                id="checkout-notes"
                                value={notes}
                                onChange={(event) => setNotes(event.target.value)}
                                placeholder="Allergies, pickup notes, or instructions"
                                style={{ minHeight: '88px' }}
                            />
                            <p className="text-muted" style={{ fontSize: '13px', lineHeight: 1.5, marginTop: '10px' }}>
                                To enjoy your food at its best, we kindly ask that you collect your order within 20 minutes of being notified that it is ready.
                            </p>
                            <p className="text-muted" style={{ fontSize: '13px', lineHeight: 1.5, marginTop: '6px' }}>
                                After 20 minutes, the vendor is unable to guarantee the temperature or quality of the food, and refund requests related to delayed collection cannot be accommodated. Thank you for your understanding and cooperation.
                            </p>
                        </section>
                    </div>

                    <aside className="card" style={{ position: 'sticky', top: '94px' }}>
                        <h2 style={{ color: 'var(--ink)', marginBottom: '6px' }}>Order summary</h2>
                        {vendor && <p className="text-accent" style={{ fontWeight: 800, marginBottom: '16px' }}>{vendor.name}</p>}
                        <div style={{ display: 'grid', gap: '14px', marginBottom: '18px' }}>
                            {items.map((item) => {
                                const line = normalizeCartLine(item);
                                const lineName = getCartLineDisplayName(line);
                                const lineId = line.lineId || line.id;

                                return (
                                    <div key={lineId} style={{ display: 'grid', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid var(--stroke)' }}>
                                        <OrderItemSummary item={line} />
                                        <QuantityControl
                                            value={line.quantity}
                                            onIncrement={() => addItem(line)}
                                            onDecrement={() => removeItem(lineId)}
                                            label={`${lineName} checkout quantity`}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-ghost"
                                            onClick={() => removeLineItem(lineId)}
                                            aria-label={`Remove ${lineName} from cart`}
                                            style={{ width: 'fit-content', minHeight: '36px', color: 'var(--red)' }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <section style={{ marginBottom: '18px' }}>
                            <h3 style={{ color: 'var(--ink)', fontSize: '16px', marginBottom: '8px' }}>Add a tip</h3>
                            <p className="text-muted" style={{ fontSize: '13px', marginBottom: '12px' }}>100% of tips go to the vendor staff.</p>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
                                {[0, 5, 10, 15].map((percent) => (
                                    <button
                                        key={percent}
                                        type="button"
                                        onClick={() => handleTipSelect(percent)}
                                        className={selectedTipPercent === percent ? 'btn btn-primary' : 'btn btn-ghost'}
                                        style={{ minHeight: '38px', padding: '8px' }}
                                    >
                                        {percent === 0 ? 'None' : `${percent}%`}
                                    </button>
                                ))}
                            </div>
                            <input
                                type="number"
                                step="0.01"
                                value={customTip}
                                onChange={handleCustomTipChange}
                                placeholder="Custom tip"
                            />
                        </section>

                        <div style={{ display: 'grid', gap: '10px', marginBottom: '18px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span className="text-muted">Subtotal</span>
                                <strong>{formatCurrency(subtotal)}</strong>
                            </div>
                            {tip > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-muted">Tip</span>
                                    <strong>{formatCurrency(tip)}</strong>
                                </div>
                            )}
                            {serviceFee > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span className="text-muted">Service Fee</span>
                                    <strong>{formatCurrency(serviceFee)}</strong>
                                </div>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--stroke)', paddingTop: '14px', fontSize: '20px' }}>
                                <strong>Total</strong>
                                <strong className="text-accent">{formatCurrency(total)}</strong>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%', minHeight: '52px' }} disabled={processing}>
                            <Icon name="cart" size={18} />
                            {processing ? 'Processing...' : `Pay ${formatCurrency(total)}`}
                        </button>
                        <p className="text-muted" style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px' }}>
                            Secure payment powered by Stripe.
                        </p>
                    </aside>
                </form>
            </div>
            <BottomNav />
        </main>
    );
}
