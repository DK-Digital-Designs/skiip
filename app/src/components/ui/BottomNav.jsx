import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { useCart } from '../../lib/hooks/useCart';

const items = [
    { id: 'home', to: '/order', label: 'Home', icon: 'home', match: (path) => path === '/order' },
    { id: 'orders', to: '/order/profile', label: 'Orders', icon: 'receipt', match: (path) => path.startsWith('/order/profile') || path.startsWith('/order/track') },
    { id: 'cart', to: '/order/checkout', label: 'Cart', icon: 'cart', match: (path) => path.startsWith('/order/checkout') },
    { id: 'account', to: '/login', label: 'Account', icon: 'user', match: (path) => path.startsWith('/login') || path.startsWith('/signup') },
];

export default function BottomNav() {
    const { pathname } = useLocation();
    const itemCount = useCart((state) => state.getItemCount());
    const cartCountLabel = itemCount > 99 ? '99+' : String(itemCount);

    return (
        <nav className="mobile-bottom-nav" aria-label="Buyer navigation">
            {items.map((item) => (
                <Link key={item.to} to={item.to} aria-current={item.match(pathname) ? 'page' : undefined}>
                    <span className="mobile-bottom-nav__icon">
                        <Icon name={item.icon} size={19} />
                        {item.id === 'cart' && itemCount > 0 && (
                            <span className="mobile-bottom-nav__badge" aria-label={`${itemCount} cart items`}>
                                {cartCountLabel}
                            </span>
                        )}
                    </span>
                    <span>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}
