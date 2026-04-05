import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';

// Only seller and admin accounts get a visible portal pill
function getRoleDetails(role) {
    switch (role) {
        case 'admin':  return { label: 'Admin Portal',  icon: '👑', color: '#f59e0b', route: '/admin/dashboard' };
        case 'seller': return { label: 'Vendor Portal', icon: '🏪', color: '#6366f1', route: '/vendor/dashboard' };
        default:       return null; // buyers get no pill — their portal IS the main site
    }
}

export default function GlobalHeader() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const roleDetails = profile ? getRoleDetails(profile.role) : null;

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
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

    const initials = profile?.full_name?.charAt(0).toUpperCase()
        || user?.email?.charAt(0).toUpperCase()
        || '?';

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            background: 'rgba(10, 10, 10, 0.85)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--stroke)',
            padding: '12px 0',
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

                {/* Logo + Nav */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <Link to="/" style={{
                        fontSize: '20px', fontWeight: '800', color: 'var(--text)',
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="var(--accent)" />
                        </svg>
                        SKIIP
                    </Link>

                    <nav style={{ display: 'flex', gap: '16px' }}>
                        <Link to="/order" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }}
                            onMouseEnter={e => e.target.style.color = 'var(--text)'}
                            onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
                        >
                            Explore Menu
                        </Link>
                    </nav>
                </div>

                {/* Right Side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }} ref={dropdownRef}>
                    {user && profile ? (
                        <>
                            {/* Role Portal Pill — only for non-buyer roles */}
                            {roleDetails && (
                                <Link to={roleDetails.route} style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    background: 'rgba(255,255,255,0.05)', padding: '6px 14px',
                                    borderRadius: '100px', textDecoration: 'none',
                                    border: `1px solid ${roleDetails.color}44`,
                                    transition: 'background 0.2s'
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                >
                                    <span style={{ fontSize: '13px' }}>{roleDetails.icon}</span>
                                    <span style={{ color: roleDetails.color, fontSize: '13px', fontWeight: '700' }}>
                                        {roleDetails.label}
                                    </span>
                                </Link>
                            )}

                            {/* Avatar Button */}
                            <button
                                id="account-menu-btn"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    background: 'var(--accent)', border: 'none',
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    color: 'white', fontSize: '14px', fontWeight: '700',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                    justifyContent: 'center', padding: 0, flexShrink: 0,
                                    transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                                aria-label="Account menu"
                            >
                                {initials}
                            </button>

                            {/* Dropdown */}
                            {dropdownOpen && (
                                <div id="account-dropdown" style={{
                                    position: 'absolute', top: '48px', right: 0,
                                    background: '#1a1a1a', border: '1px solid var(--stroke)',
                                    borderRadius: '12px', width: '220px',
                                    boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
                                    overflow: 'hidden', animation: 'fadeIn 0.15s ease'
                                }}>
                                    {/* User Info */}
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--stroke)' }}>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {profile.full_name || 'My Account'}
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {user.email}
                                        </p>
                                    </div>

                                    {/* Menu Items */}
                                    <div style={{ padding: '8px' }}>
                                        <Link to="/order/profile" onClick={() => setDropdownOpen(false)}
                                            style={{ display: 'block', padding: '10px 12px', color: 'var(--text)', textDecoration: 'none', fontSize: '14px', borderRadius: '6px', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            My Orders
                                        </Link>

                                        {/* Portal links for sellers/admins */}
                                        {roleDetails && (
                                            <Link to={roleDetails.route} onClick={() => setDropdownOpen(false)}
                                                style={{ display: 'block', padding: '10px 12px', color: 'var(--text)', textDecoration: 'none', fontSize: '14px', borderRadius: '6px', transition: 'background 0.15s' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                {roleDetails.label}
                                            </Link>
                                        )}

                                        <div style={{ height: '1px', background: 'var(--stroke)', margin: '4px 0' }} />

                                        <button onClick={handleSignOut}
                                            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 12px', color: '#ef4444', fontSize: '14px', cursor: 'pointer', borderRadius: '6px', transition: 'background 0.15s' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <Link to="/login" className="btn btn-ghost" style={{ padding: '7px 18px', fontSize: '14px' }}>
                                Sign In
                            </Link>
                            <Link to="/signup" className="btn btn-primary" style={{ padding: '7px 18px', fontSize: '14px' }}>
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
