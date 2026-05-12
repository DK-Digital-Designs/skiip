import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import SkiipLogo from '../ui/SkiipLogo';
import Icon from '../ui/Icon';

function getRoleDetails(role) {
    switch (role) {
        case 'admin':
            return { label: 'Admin Portal', color: '#f59e0b', route: '/admin/dashboard' };
        case 'seller':
            return { label: 'Vendor Portal', color: '#22d3ee', route: '/vendor/dashboard' };
        default:
            return null;
    }
}

export default function GlobalHeader() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const roleDetails = profile ? getRoleDetails(profile.role) : null;
    const initials = profile?.full_name?.charAt(0).toUpperCase()
        || user?.email?.charAt(0).toUpperCase()
        || '?';

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    async function handleSignOut() {
        await signOut();
        setDropdownOpen(false);
        navigate('/');
    }

    return (
        <header className="app-header">
            <div className="container app-header__inner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <SkiipLogo />
                    <nav className="top-nav" aria-label="Primary navigation">
                        <Link to="/order">Browse Vendors</Link>
                        {user && <Link to="/order/profile">My Orders</Link>}
                    </nav>
                </div>

                <div ref={dropdownRef} style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative' }}>
                    {user && profile ? (
                        <>
                            {roleDetails && (
                                <Link
                                    to={roleDetails.route}
                                    className="chip"
                                    style={{ color: roleDetails.color, borderColor: `${roleDetails.color}55` }}
                                >
                                    {roleDetails.label}
                                </Link>
                            )}
                            <button
                                id="account-menu-btn"
                                type="button"
                                className="btn btn-accent icon-button"
                                onClick={() => setDropdownOpen((value) => !value)}
                                aria-label="Account menu"
                            >
                                {initials}
                            </button>
                            {dropdownOpen && (
                                <div
                                    id="account-dropdown"
                                    className="card"
                                    style={{
                                        position: 'absolute',
                                        top: '52px',
                                        right: 0,
                                        width: '236px',
                                        padding: '10px',
                                        zIndex: 10,
                                    }}
                                >
                                    <div style={{ padding: '10px 10px 14px', borderBottom: '1px solid var(--stroke)', marginBottom: '8px' }}>
                                        <p style={{ fontWeight: 900, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {profile.full_name || 'My Account'}
                                        </p>
                                        <p className="text-muted" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {user.email}
                                        </p>
                                    </div>
                                    <Link to="/order/profile" onClick={() => setDropdownOpen(false)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '6px' }}>
                                        <Icon name="receipt" size={16} />
                                        My Orders
                                    </Link>
                                    {roleDetails && (
                                        <Link to={roleDetails.route} onClick={() => setDropdownOpen(false)} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', marginBottom: '6px' }}>
                                            <Icon name="settings" size={16} />
                                            {roleDetails.label}
                                        </Link>
                                    )}
                                    <button type="button" onClick={handleSignOut} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--red)' }}>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-ghost">Sign In</Link>
                            <Link to="/signup" className="btn btn-purple">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
