import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';

const ADMIN_NAV_ITEMS = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: 'home' },
    { to: '/admin/orders', label: 'Orders', icon: 'receipt' },
    { to: '/admin/issues', label: 'Issues', icon: 'bell' },
    { to: '/admin/vendors', label: 'Vendors', icon: 'bag' },
    { to: '/admin/events', label: 'Event Setup', icon: 'calendar' },
    { to: '/admin/settings', label: 'Settings', icon: 'settings' },
];

export default function AdminShell({ title, subtitle, actions, children }) {
    return (
        <main className="admin-page">
            <nav className="admin-nav" aria-label="Admin sections">
                <div className="container admin-nav__inner">
                    {ADMIN_NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end
                            className={({ isActive }) => isActive ? 'admin-nav__link admin-nav__link--active' : 'admin-nav__link'}
                        >
                            <Icon name={item.icon} size={19} />
                            {item.label}
                        </NavLink>
                    ))}
                </div>
            </nav>
            <div className="container admin-page__body">
                <header className="admin-page__heading">
                    <div>
                        <h1>{title}</h1>
                        {subtitle && <p>{subtitle}</p>}
                    </div>
                    {actions && <div className="admin-page__actions">{actions}</div>}
                </header>
                {children}
            </div>
        </main>
    );
}
