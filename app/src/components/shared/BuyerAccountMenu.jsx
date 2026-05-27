import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import Icon from '../ui/Icon';

function getPortal(profile) {
    if (profile?.role === 'admin') return { label: 'Admin Portal', to: '/admin/dashboard' };
    if (profile?.role === 'seller') return { label: 'Vendor Portal', to: '/vendor/dashboard' };
    return null;
}

export default function BuyerAccountMenu() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const portal = getPortal(profile);
    const initials = profile?.full_name?.charAt(0).toUpperCase()
        || user?.email?.charAt(0).toUpperCase()
        || '';

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleSignOut() {
        await signOut();
        setOpen(false);
        navigate('/order');
    }

    if (!user) {
        return (
            <Link to="/login" className="btn btn-accent icon-button" aria-label="Sign in">
                <Icon name="user" size={18} />
            </Link>
        );
    }

    return (
        <div ref={menuRef} style={{ position: 'relative' }}>
            <button
                type="button"
                className="btn btn-accent icon-button"
                aria-label="Account menu"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
            >
                {initials || <Icon name="user" size={18} />}
            </button>

            {open && (
                <section
                    className="card"
                    style={{
                        position: 'absolute',
                        top: '52px',
                        right: 0,
                        width: '244px',
                        padding: '10px',
                        zIndex: 30,
                    }}
                >
                    <div style={{ padding: '10px 10px 14px', borderBottom: '1px solid var(--stroke)', marginBottom: '8px' }}>
                        <p style={{ fontWeight: 900, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {profile?.full_name || 'My Account'}
                        </p>
                        <p className="text-muted" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user.email}
                        </p>
                    </div>

                    <Link to="/order/profile" onClick={() => setOpen(false)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '6px' }}>
                        <Icon name="receipt" size={16} />
                        My Orders
                    </Link>
                    {portal && (
                        <Link to={portal.to} onClick={() => setOpen(false)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '6px' }}>
                            <Icon name="settings" size={16} />
                            {portal.label}
                        </Link>
                    )}
                    {profile?.role !== 'admin' && (
                        <Link to="/report-issue" onClick={() => setOpen(false)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '6px' }}>
                            <Icon name="bell" size={16} />
                            Report an issue
                        </Link>
                    )}
                    <button type="button" onClick={handleSignOut} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--red)' }}>
                        Sign Out
                    </button>
                </section>
            )}
        </div>
    );
}
