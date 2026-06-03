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
import { canUseMockProductModifiers, canUseRealProductModifiers } from '../../lib/features/productModifiers';
import { getMockProductModifierGroups } from '../../lib/product-modifier-fixtures';
import {
    buildConfiguredCartLine,
    getCartLineDisplayName,
    getCartLineModifierDisplay,
    getCartLineNote,
    isConfiguredCartLine,
} from '../../lib/cart/cartLineIdentity';

const MOCK_MENU = {
    '1': [
        { id: '1', name: 'Classic Burger', description: 'Beef patty, lettuce, tomato, cheese', price: 8.5, category: 'Mains', store_id: '1' },
        { id: '2', name: 'BBQ Bacon Burger', description: 'Beef patty, bacon, BBQ sauce, onion rings', price: 9.5, category: 'Mains', store_id: '1' },
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
    const hasModifiers = getModifierGroupsForProduct(item).length > 0;

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
                    ) : hasModifiers ? (
                        <button
                            type="button"
                            onClick={() => onAdd(item)}
                            className="btn btn-primary"
                            aria-label={`Configure ${item.name} from details`}
                        >
                            <Icon name="settings" size={17} />
                            Configure
                        </button>
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

function getModifierGroupsForProduct(item) {
    if (canUseRealProductModifiers()) {
        return (item?.modifierGroups || [])
            .filter((group) => group.active !== false && group.status !== 'inactive')
            .map((group) => ({
                ...group,
                options: (group.options || []).filter((option) => option.active !== false && option.status !== 'inactive'),
            }))
            .filter((group) => group.options.length > 0);
    }

    if (!canUseMockProductModifiers()) return [];
    return getMockProductModifierGroups(item);
}

function getSelectionValidity(groups, selections) {
    const invalidGroup = groups.find((group) => {
        const selectedCount = (selections[group.id] || []).length;
        const minSelect = group.required ? Math.max(Number(group.minSelect || 1), 1) : Number(group.minSelect || 0);
        const maxSelect = Number(group.maxSelect || group.options?.length || 1);

        return selectedCount < minSelect || (maxSelect > 0 && selectedCount > maxSelect);
    });

    return {
        isValid: !invalidGroup,
        invalidGroup,
    };
}

function ProductConfigurationDialog({ item, groups, onAddConfigured, onClose }) {
    const [selections, setSelections] = React.useState({});
    const [lineNote, setLineNote] = React.useState('');
    const closeButtonRef = React.useRef(null);

    // The dialog stays mounted, so clear prior choices/notes whenever the
    // configured item changes (or closes) to avoid prefilling a new line.
    React.useEffect(() => {
        setSelections({});
        setLineNote('');
    }, [item]);

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

    const selectedOptions = groups.flatMap((group) => (
        (selections[group.id] || []).map((optionId) => {
            const option = group.options.find((candidate) => candidate.id === optionId);
            return option ? { ...option, groupName: group.name } : null;
        }).filter(Boolean)
    ));
    const previewUnitPrice = selectedOptions.reduce((sum, option) => sum + Number(option.priceDelta || 0), Number(item.price || 0));
    const validity = getSelectionValidity(groups, selections);

    function toggleOption(group, option) {
        setSelections((current) => {
            const currentGroupSelections = current[group.id] || [];
            const maxSelect = Number(group.maxSelect || group.options.length || 1);
            const isSelected = currentGroupSelections.includes(option.id);
            const nextGroupSelections = maxSelect === 1
                ? (isSelected && !group.required ? [] : [option.id])
                : isSelected
                    ? currentGroupSelections.filter((id) => id !== option.id)
                    : [...currentGroupSelections, option.id].slice(0, maxSelect);

            return {
                ...current,
                [group.id]: nextGroupSelections,
            };
        });
    }

    function handleAdd() {
        if (!validity.isValid) return;
        const line = buildConfiguredCartLine(item, selectedOptions, lineNote);
        onAddConfigured(line);
    }

    return (
        <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
            <section
                className="dialog menu-item-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-config-title"
                onMouseDown={(event) => event.stopPropagation()}
                style={{ maxHeight: 'calc(100vh - 40px)', overflowY: 'auto' }}
            >
                <button
                    ref={closeButtonRef}
                    type="button"
                    className="menu-item-dialog__close"
                    onClick={onClose}
                    aria-label="Close product configuration"
                >
                    <Icon name="close" size={18} />
                </button>
                <MenuImage item={item} />
                <p className="page-kicker">{item.category || 'Menu item'}</p>
                <h2 id="product-config-title" style={{ color: 'var(--ink)', fontSize: '26px', marginTop: '6px' }}>
                    {item.name}
                </h2>
                {item.description && <p className="text-muted" style={{ marginTop: '10px' }}>{item.description}</p>}
                <p className="text-accent" style={{ fontWeight: 900, fontSize: '22px', marginTop: '16px' }}>
                    {formatCurrency(previewUnitPrice)}
                </p>

                <div style={{ display: 'grid', gap: '18px', marginTop: '22px' }}>
                    {groups.map((group) => {
                        const selectedIds = selections[group.id] || [];
                        const maxSelect = Number(group.maxSelect || group.options.length || 1);

                        return (
                            <section key={group.id} style={{ display: 'grid', gap: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center' }}>
                                    <h3 style={{ color: 'var(--ink)', fontSize: '16px' }}>{group.name}</h3>
                                    <span className={group.required ? 'chip chip--amber' : 'chip'}>
                                        {group.required ? 'Required' : 'Optional'}
                                    </span>
                                </div>
                                <div style={{ display: 'grid', gap: '8px' }}>
                                    {group.options.map((option) => {
                                        const isSelected = selectedIds.includes(option.id);
                                        const inputType = maxSelect === 1 && group.required ? 'radio' : 'checkbox';
                                        const isDisabled = !isSelected && maxSelect > 1 && selectedIds.length >= maxSelect;

                                        return (
                                            <label
                                                key={option.id}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '22px minmax(0, 1fr) auto',
                                                    gap: '10px',
                                                    alignItems: 'center',
                                                    marginBottom: 0,
                                                    padding: '10px 12px',
                                                    borderRadius: '14px',
                                                    border: `1px solid ${isSelected ? 'rgba(139, 92, 246, 0.38)' : 'var(--stroke)'}`,
                                                    background: isSelected ? 'rgba(139, 92, 246, 0.1)' : '#fff',
                                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                <input
                                                    type={inputType}
                                                    name={group.id}
                                                    checked={isSelected}
                                                    disabled={isDisabled}
                                                    onChange={() => toggleOption(group, option)}
                                                    style={{ width: '18px', margin: 0 }}
                                                />
                                                <span style={{ color: 'var(--ink)', fontWeight: 850 }}>{option.name}</span>
                                                <span className="text-muted" style={{ fontSize: '13px' }}>
                                                    {Number(option.priceDelta || 0) > 0 ? `+${formatCurrency(option.priceDelta)}` : 'Included'}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}

                    <div>
                        <label htmlFor="product-line-note">Line note</label>
                        <textarea
                            id="product-line-note"
                            value={lineNote}
                            maxLength={240}
                            onChange={(event) => setLineNote(event.target.value.slice(0, 240))}
                            placeholder="Optional prep note"
                            style={{ minHeight: '76px' }}
                        />
                    </div>

                    {!validity.isValid && validity.invalidGroup && (
                        <p className="chip chip--amber" style={{ width: 'fit-content' }}>
                            Choose an option for {validity.invalidGroup.name}
                        </p>
                    )}

                    <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={!validity.isValid}>
                        <Icon name="cart" size={17} />
                        Add to cart
                    </button>
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
    const [configItem, setConfigItem] = React.useState(null);
    const detailTriggerRef = React.useRef(null);

    const isDemo = !isSupabaseConfigured();
    const vendor = isDemo ? (MOCK_VENDORS[vendorId] || MOCK_VENDORS['1']) : qStore;
    const menuItems = isDemo ? (MOCK_MENU[vendorId] || MOCK_MENU['1']) : qMenu;
    const loading = isDemo ? false : (isStoreLoading || isMenuLoading);
    const vendorImage = getVendorImage(vendor);

    function getQuantity(itemId) {
        return cart
            .filter((item) => !isConfiguredCartLine(item) && item.id === itemId)
            .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    }

    function handleAddItem(item) {
        const modifierGroups = getModifierGroupsForProduct(item);
        if (modifierGroups.length > 0) {
            setConfigItem(item);
            setDetailItem(null);
            return;
        }

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

    function handleAddConfiguredLine(line) {
        const lineWithStore = { ...line, store_id: vendorId };
        if (cartVendorId && cartVendorId !== vendorId) {
            setSwitchItem(lineWithStore);
            setConfigItem(null);
            return;
        }
        if (addItem(lineWithStore)) {
            trackSkiipEvent('menu_item_added', { item: getMenuItemAnalyticsLabel(lineWithStore) });
        }
        setConfigItem(null);
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
                                const hasModifiers = getModifierGroupsForProduct(item).length > 0;

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
                                                    {hasModifiers && <span className="chip chip--accent">Customise</span>}
                                                </span>
                                                {item.description && <span className="text-muted menu-row__description">{item.description}</span>}
                                                <span className="text-accent menu-row__price">
                                                    {formatCurrency(item.price)}
                                                </span>
                                            </span>
                                        </button>
                                        {hasModifiers ? (
                                            <button
                                                type="button"
                                                onClick={() => handleAddItem(item)}
                                                className="btn btn-primary"
                                                aria-label={soldOut ? `${item.name} is out of stock` : `Configure ${item.name}`}
                                                disabled={soldOut}
                                            >
                                                <Icon name="settings" size={17} />
                                                {soldOut ? 'Out of Stock' : 'Configure'}
                                            </button>
                                        ) : quantity > 0 ? (
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
                    <div style={{ display: 'grid', gap: '10px' }}>
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
                        {cart.some((line) => isConfiguredCartLine(line)) && (
                            <div style={{ display: 'grid', gap: '6px', paddingTop: '8px', borderTop: '1px solid var(--stroke)' }}>
                                {cart.filter((line) => isConfiguredCartLine(line)).slice(0, 2).map((line) => (
                                    <p key={line.lineId || line.id} className="text-muted" style={{ fontSize: '12px', overflowWrap: 'anywhere' }}>
                                        <strong style={{ color: 'var(--ink)' }}>{getCartLineDisplayName(line)}:</strong>{' '}
                                        {getCartLineModifierDisplay(line).map((modifier) => modifier.optionName || modifier.option_name).filter(Boolean).join(', ')}
                                        {getCartLineNote(line) ? ` - ${getCartLineNote(line)}` : ''}
                                    </p>
                                ))}
                            </div>
                        )}
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
            <ProductConfigurationDialog
                item={configItem}
                groups={configItem ? getModifierGroupsForProduct(configItem) : []}
                onAddConfigured={handleAddConfiguredLine}
                onClose={() => setConfigItem(null)}
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
