import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

const MOCK_MENU = {
    '1': [
        { id: '1', name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, cheese', price: 85.00, category: 'Burgers' },
        { id: '2', name: 'BBQ Bacon Burger', description: 'Beef patty, bacon, BBQ sauce, onion rings', price: 95.00, category: 'Burgers' },
        { id: '3', name: 'Loaded Fries', description: 'Fries with cheese, bacon, sour cream', price: 55.00, category: 'Sides' },
        { id: '4', name: 'Cola', description: 'Ice-cold soft drink', price: 25.00, category: 'Drinks' },
    ],
    '2': [
        { id: '5', name: 'Margherita Pizza', description: 'Tomato, mozzarella, basil', price: 110.00, category: 'Pizza' },
        { id: '6', name: 'Pepperoni Pizza', description: 'Pepperoni, cheese, tomato sauce', price: 125.00, category: 'Pizza' },
        { id: '7', name: 'Veggie Supreme', description: 'Mixed vegetables, cheese, olives', price: 120.00, category: 'Pizza' },
    ],
    '3': [
        { id: '8', name: 'Craft Beer', description: 'Local IPA on tap', price: 65.00, category: 'Beer' },
        { id: '9', name: 'Mojito', description: 'Mint, lime, rum, soda', price: 85.00, category: 'Cocktails' },
        { id: '10', name: 'Soft Drink', description: 'Various flavors', price: 25.00, category: 'Soft Drinks' },
    ],
};

const MOCK_VENDORS = {
    '1': { id: '1', name: 'Burger Bliss', description: 'Gourmet burgers and loaded fries', pickup_location: 'Food Court A, Stall 3' },
    '2': { id: '2', name: 'Pizza Paradise', description: 'Wood-fired artisan pizzas', pickup_location: 'Food Court B, Stall 1' },
    '3': { id: '3', name: 'Drinks & Co', description: 'Craft cocktails and refreshments', pickup_location: 'Bar Area 2' },
};

export default function Menu() {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const [vendor, setVendor] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isSupabaseConfigured()) {
            // Demo mode
            setVendor(MOCK_VENDORS[vendorId] || MOCK_VENDORS['1']);
            setMenuItems(MOCK_MENU[vendorId] || MOCK_MENU['1']);
            setLoading(false);
            return;
        }
        fetchVendorAndMenu();
    }, [vendorId]);

    async function fetchVendorAndMenu() {
        try {
            const { data: vendorData } = await supabase
                .from('vendors')
                .select('*')
                .eq('id', vendorId)
                .single();

            setVendor(vendorData);

            const { data: itemsData } = await supabase
                .from('menu_items')
                .select('*')
                .eq('vendor_id', vendorId)
                .eq('is_available', true)
                .order('category', { ascending: true });

            setMenuItems(itemsData || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }

    function addToCart(item) {
        const existing = cart.find(i => i.id === item.id);
        if (existing) {
            setCart(cart.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
        } else {
            setCart([...cart, { ...item, quantity: 1 }]);
        }
    }

    function removeFromCart(itemId) {
        const existing = cart.find(i => i.id === itemId);
        if (existing && existing.quantity > 1) {
            setCart(cart.map(i => i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i));
        } else {
            setCart(cart.filter(i => i.id !== itemId));
        }
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    function proceedToCheckout() {
        sessionStorage.setItem('cart', JSON.stringify({ vendorId, vendor, items: cart }));
        navigate('/order/checkout');
    }

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', paddingBottom: '120px' }}>
            <header style={{ padding: '20px 0', borderBottom: '1px solid var(--stroke)', marginBottom: '40px' }}>
                <div className="container">
                    <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: '16px', cursor: 'pointer', fontWeight: '600' }}>
                        ← Back to vendors
                    </button>
                </div>
            </header>

            <div className="container">
                {!isSupabaseConfigured() && (
                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
                        <p style={{ color: '#f59e0b', margin: 0 }}>
                            ⚠️ <strong>Demo Mode:</strong> Using mock menu data. Connect Supabase to see live data.
                        </p>
                    </div>
                )}

                {vendor && (
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '40px', fontWeight: '800', marginBottom: '8px' }}>{vendor.name}</h1>
                        {vendor.description && <p className="text-muted">{vendor.description}</p>}
                        {vendor.pickup_location && <p className="text-accent" style={{ marginTop: '8px' }}>📍 {vendor.pickup_location}</p>}
                    </div>
                )}

                <h2 style={{ marginBottom: '24px' }}>Menu</h2>
                {menuItems.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                        <p className="text-muted">No menu items available</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '16px' }}>
                        {menuItems.map((item) => (
                            <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ marginBottom: '4px' }}>{item.name}</h3>
                                    {item.description && <p className="text-muted" style={{ fontSize: '14px', marginBottom: '8px' }}>{item.description}</p>}
                                    <p className="text-accent" style={{ fontWeight: '700', fontSize: '18px' }}>R{item.price.toFixed(2)}</p>
                                </div>
                                <button onClick={() => addToCart(item)} className="btn btn-primary">
                                    Add to Cart
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {cart.length > 0 && (
                <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--card)', borderTop: '1px solid var(--stroke)', padding: '20px 0' }}>
                    <div className="container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <div>
                                <p className="text-muted" style={{ fontSize: '14px' }}>Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)} items)</p>
                                <p style={{ fontSize: '24px', fontWeight: '800' }}>R{cartTotal.toFixed(2)}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                                {cart.map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px' }}>
                                        <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}>
                                            −
                                        </button>
                                        <span style={{ minWidth: '30px', textAlign: 'center', fontSize: '14px' }}>{item.quantity}× {item.name}</span>
                                        <button onClick={() => addToCart(item)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: '18px', padding: '0 4px' }}>
                                            +
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button onClick={proceedToCheckout} className="btn btn-primary" style={{ width: '100%' }}>
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
