import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon';

const items = [
    { to: '/order', label: 'Home', icon: 'home', match: (path) => path === '/order' },
    { to: '/order/profile', label: 'Orders', icon: 'receipt', match: (path) => path.startsWith('/order/profile') || path.startsWith('/order/track') },
    { to: '/order/checkout', label: 'Cart', icon: 'cart', match: (path) => path.startsWith('/order/checkout') },
    { to: '/login', label: 'Account', icon: 'user', match: (path) => path.startsWith('/login') || path.startsWith('/signup') },
];

export default function BottomNav() {
    const { pathname } = useLocation();

    return (
        <nav className="mobile-bottom-nav" aria-label="Buyer navigation">
            {items.map((item) => (
                <Link key={item.to} to={item.to} aria-current={item.match(pathname) ? 'page' : undefined}>
                    <Icon name={item.icon} size={19} />
                    <span>{item.label}</span>
                </Link>
            ))}
        </nav>
    );
}
