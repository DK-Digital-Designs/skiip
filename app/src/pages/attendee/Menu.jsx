import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { useStore, useStoreMenu } from '../../lib/hooks/useMenu';
import { useCart } from '../../lib/hooks/useCart';
import LoadingSkeleton from '../../components/ui/LoadingSkeleton';
import AttendeeHeader from '../../components/shared/AttendeeHeader';
import BottomNav from '../../components/ui/BottomNav';
import QuantityControl from '../../components/ui/QuantityControl';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Icon from '../../components/ui/Icon';
import { formatCurrency, getInitials, getVendorImage } from '../../lib/ui-format';
import { trackSkiipEvent } from '../../lib/analytics';

const MOCK_MENU = {
    '1': [
        { id: '1', name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, cheese', price: 8.5, category: 'Burgers', store_id: '1' },
        { id: '2', name: 'BBQ Bacon Burger', description: 'Beef patty, bacon, BBQ sauce, onion rings', price: 9.5, category: 'Burgers', store_id: '1' },
        { id: '3', name: 'Loaded Fries', description: 'Fries with cheese, bacon, sour cream', price: 5.5, category: 'Sides', store_id: '1' },
        { id: '4', name: 'Cola', description: 'Ice-cold soft drink', price: 2.5, category: 'Drinks', store_id: '1' },
    ],
    '2': [
        { id: '5', name: 'Chicken Tacos', description: 'Three soft tacos with salsa verde', price: 10.5, category: 'Tacos', store_id: '2' },
        { id: '6', name: 'Loaded Nachos', description: 'Cheese, jalapenos, salsa, and sour cream', price: 8.5, category: 'Sides', store_id: '2' },
    ],
    '3': [
        { id: '8', name: 'Craft Beer', description: 'Local IPA on tap', price: 6.5, category: 'Beer', store_id: '3' },
        { id: '9', name: 'Mojito', description: 'Mint, lime, rum, soda', price: 8.5, category: 'Cocktails', store_id: '3' },
    ],
};

const MOCK_VENDORS = {
    '1': { id: '1', name: 'Burger Bliss', description: 'Gourmet burgers and loaded fries', pickup_location: 'Food Court A, Stall 3' },
    '2': { id: '2', name: 'Taco Town', description: 'Street tacos, nachos, and fresh salsa', pickup_location: 'Food Court B, Stall 1' },
    '3': { id: '3', name: 'Drinks & Co', description: 'Cocktails, mocktails, and cold soft drinks', pickup_location: 'Bar Area 2' },
};

function MenuImage({ item }) {
    const image = item.images?.[0] || item.product_snapshot?.image;

    return (
        <span className="menu-row__image">
            {image ? <img src={image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : getInitials(item.name)}
        </span>
    );
}

function getMenuItemAnalyticsLabel(item) {
    return `${item.id || 'unknown'}:${item.name || 'Unknown item'}`;
}

function MenuItemDetailsDialog({ item, quantity, onAdd, onRemove, onClose }) {
    const closeButtonRef = React.useRef(null);

    React.useEffect(() => {
        if (!item) return undefined;

        closeButtonRef.current?.focus();

        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [item, onClose]);

    if (!item) return null;

    const soldOut = item.inventory_quantity === 0;

    return (
        <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
            <section
                className="dialog menu-item-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="menu-item-details-title"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <button
                    ref={closeButtonRef}
                    type="button"
                    className="menu-item-dialog__close"
                    onClick={onClose}
                    aria-label="Close item details"
                >
                    <Icon name="close" size={18} />
                </button>
                <MenuImage item={item} />
                <p className="page-kicker">{item.category || 'Menu item'}</p>
                <h2 id="menu-item-details-title" style={{ color: 'var(--ink)', fontSize: '26px', marginTop: '6px' }}>
                    {item.name}
                </h2>
                {item.description && (
                    <p className="text-muted" style={{ marginTop: '10px' }}>
                        {item.description}
                    </p>
                )}
                <p className="text-accent" style={{ fontWeight: 900, fontSize: '22px', marginTop: '16px' }}>
                    {formatCurrency(item.price)}
                </p>
                <div style={{ marginTop: '22px' }}>
                    {soldOut ? (
                        <span className="chip" style={{ color: 'var(--red)' }}>Sold out</span>
                    ) : quantity > 0 ? (
                        <QuantityControl
                            value={quantity}
                            onIncrement={() => onAdd(item)}
                            onDecrement={() => onRemove(item.id)}
                            label={`${item.name} details quantity`}
                        />
                    ) : (
                        <button
                            type="button"
                            onClick={() => onAdd(item)}
                            className="btn btn-primary"
                            aria-label={`Add ${item.name} to cart from details`}
                        >
                            <Icon name="plus" size={17} />
                            Add to cart
                        </button>
                    )}
                </div>
            </section>
        </div>
    );
}

export default function Menu() {
    const { vendorId } = useParams();
    const navigate = useNavigate();
    const { data: qStore, isLoading: isStoreLoading } = useStore(isSupabaseConfigured() ? vendorId : null);
    const { data: qMenu = [], isLoading: isMenuLoading } = useStoreMenu(isSupabaseConfigured() ? vendorId : null);
    const { items: cart, addItem, removeItem, clearCart, getCartTotal, getItemCount, vendorId: cartVendorId } = useCart();
    const [switchItem, setSwitchItem] = React.useState(null);
    const [detailItem, setDetailItem] = React.useState(null);
    const detailTriggerRef = React.useRef(null);

    const isDemo = !isSupabaseConfigured();
    const vendor = isDemo ? (MOCK_VENDORS[vendorId] || MOCK_VENDORS['1']) : qStore;
    const menuItems = isDemo ? (MOCK_MENU[vendorId] || MOCK_MENU['1']) : qMenu;
    const loading = isDemo ? false : (isStoreLoading || isMenuLoading);
    const vendorImage = getVendorImage(vendor);

    function getQuantity(itemId) {
        return cart.find((item) => item.id === itemId)?.quantity || 0;
    }

    function handleAddItem(item) {
        if (cartVendorId && cartVendorId !== vendorId) {
            setSwitchItem(item);
            return;
        }
        if (addItem({ ...item, store_id: vendorId })) {
            trackSkiipEvent('menu_item_added', { item: getMenuItemAnalyticsLabel(item) });
        }
    }

    function confirmVendorSwitch() {
        if (!switchItem) return;
        clearCart();
        if (addItem({ ...switchItem, store_id: vendorId })) {
            trackSkiipEvent('menu_item_added', { item: getMenuItemAnalyticsLabel(switchItem) });
        }
        setSwitchItem(null);
    }

    function openItemDetails(item, trigger) {
        detailTriggerRef.current = trigger;
        setDetailItem(item);
    }

    const closeItemDetails = React.useCallback(() => {
        setDetailItem(null);
        window.requestAnimationFrame(() => detailTriggerRef.current?.focus());
    }, []);

    function handleCheckoutStart() {
        trackSkiipEvent('checkout_started', { items: getItemCount() });
        navigate('/order/checkout');
    }

    if (loading) {
        return (
            <main className="app-page app-page--buyer">
                <div className="container" style={{ display: 'grid', gap: '16px' }}>
                    <LoadingSkeleton height="190px" borderRadius="30px" />
                    {[...Array(4)].map((_, index) => (
                        <LoadingSkeleton key={index} height="116px" borderRadius="22px" />
                    ))}
                </div>
            </main>
        );
    }

    return (
        <main className="app-page app-page--buyer">
            <AttendeeHeader backTo="/order" backLabel="Back to vendors" />
            <div className="container" style={{ display: 'grid', gap: '26px', paddingTop: '28px' }}>
                {vendor && (
                    <section className="surface" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 132px', gap: '20px', alignItems: 'center', padding: '22px', borderRadius: '30px' }}>
                        <div>
                            <p className="page-kicker">Now ordering</p>
                            <h1 className="page-title" style={{ fontSize: 'clamp(30px, 6vw, 44px)', marginTop: '6px' }}>
                                {vendor.name}
                            </h1>
                            {vendor.description && <p className="page-subtitle" style={{ marginTop: '8px' }}>{vendor.description}</p>}
                            {vendor.pickup_location && (
                                <span className="chip chip--cyan" style={{ marginTop: '14px' }}>
                                    <Icon name="map" size={15} />
                                    {vendor.pickup_location}
                                </span>
                            )}
                        </div>
                        <div className="vendor-card__media" style={{ width: 132, minHeight: 132 }}>
                            {vendorImage ? <img src={vendorImage} alt={vendor.name} /> : <span className="vendor-card__initials">{getInitials(vendor.name)}</span>}
                        </div>
                    </section>
                )}

                {isDemo && (
                    <div className="chip chip--accent" style={{ width: 'fit-content' }}>
                        Demo mode: using sample menu data
                    </div>
                )}

                <section style={{ display: 'grid', gap: '16px' }}>
                    <div>
                        <p className="page-kicker">Menu</p>
                        <h2 style={{ color: 'var(--ink)', fontSize: '28px', lineHeight: 1.1 }}>Pick your order</h2>
                    </div>
                    {menuItems.length === 0 ? (
                        <div className="surface empty-state">
                            <h3>No menu items available</h3>
                            <p>This vendor has not published their menu yet.</p>
                        </div>
                    ) : (
                        <div className="menu-list">
                            {menuItems.map((item) => {
                                const quantity = getQuantity(item.id);
                                const soldOut = item.inventory_quantity === 0;

                                return (
                                    <article key={item.id} className="menu-row">
                                        <button
                                            type="button"
                                            className="menu-row__details"
                                            onClick={(event) => openItemDetails(item, event.currentTarget)}
                                            aria-label={`View details for ${item.name}`}
                                            aria-haspopup="dialog"
                                        >
                                            <MenuImage item={item} />
                                            <span>
                                                <span style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <span style={{ color: 'var(--ink)', fontSize: '19px', fontWeight: 700, lineHeight: 1.15 }}>{item.name}</span>
                                                    {soldOut && <span className="chip" style={{ color: 'var(--red)' }}>Sold out</span>}
                                                </span>
                                                {item.description && <span className="text-muted menu-row__description">{item.description}</span>}
                                                <span className="text-accent menu-row__price">
                                                    {formatCurrency(item.price)}
                                                </span>
                                            </span>
                                        </button>
                                        {quantity > 0 ? (
                                            <QuantityControl
                                                value={quantity}
                                                onIncrement={() => handleAddItem(item)}
                                                onDecrement={() => removeItem(item.id)}
                                                label={`${item.name} quantity`}
                                            />
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => handleAddItem(item)}
                                                className="btn btn-primary"
                                                aria-label={soldOut ? `${item.name} is out of stock` : `Add ${item.name} to cart`}
                                                disabled={soldOut}
                                            >
                                                <Icon name="plus" size={17} />
                                                {soldOut ? 'Out of Stock' : 'Add'}
                                            </button>
                                        )}
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>

            {cart.length > 0 && (
                <div className="sticky-action-bar">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center' }}>
                        <div>
                            <p className="text-muted" style={{ fontSize: '13px', fontWeight: 800 }}>Cart ({getItemCount()} items)</p>
                            <p style={{ color: 'var(--ink)', fontSize: '22px', fontWeight: 950 }}>{formatCurrency(getCartTotal())}</p>
                        </div>
                        <button type="button" onClick={handleCheckoutStart} className="btn btn-primary">
                            Checkout
                            <Icon name="cart" size={17} />
                        </button>
                    </div>
                </div>
            )}
            <BottomNav />
            <MenuItemDetailsDialog
                item={detailItem}
                quantity={detailItem ? getQuantity(detailItem.id) : 0}
                onAdd={handleAddItem}
                onRemove={removeItem}
                onClose={closeItemDetails}
            />
            <ConfirmDialog
                open={Boolean(switchItem)}
                title="Switch vendor?"
                description="Your cart can only hold items from one vendor at a time. Switching will clear the current cart."
                confirmLabel="Switch vendor"
                tone="default"
                onConfirm={confirmVendorSwitch}
                onCancel={() => setSwitchItem(null)}
            />
        </main>
    );
}
