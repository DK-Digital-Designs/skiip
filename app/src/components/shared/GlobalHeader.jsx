import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';

export default function GlobalHeader() {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Helper to get role display
    const getRoleDetails = (role) => {
        switch (role) {
            case 'admin': return { label: 'Admin', icon: '👑', color: '#f59e0b', route: '/admin/dashboard' };
            case 'seller': return { label: 'Vendor', icon: '🏪', color: '#6366f1', route: '/vendor/dashboard' };
            case 'buyer': 
            default: return { label: 'Buyer', icon: '👋', color: '#10b981', route: '/order/profile' };
        }
    };

    const roleDetails = profile ? getRoleDetails(profile.role) : null;

    async function handleSignOut() {
        await signOut();
        setDropdownOpen(false);
        navigate('/');
    }

    return (
        <header style={{
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            background: 'rgba(10, 10, 10, 0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--stroke)',
            padding: '12px 0',
        }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
                {/* Logo & Main Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                    <Link to="/" style={{ 
                        fontSize: '20px', 
                        fontWeight: '800', 
                        color: 'var(--text)', 
                        textDecoration: 'none', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px' 
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="var(--accent)" />
                        </svg>
                        SKIIP
                    </Link>
                    
                    <nav style={{ display: 'flex', gap: '16px' }}>
                        <Link to="/order" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>
                            Explore Menu
                        </Link>
                    </nav>
                </div>

                {/* User State & Account Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
                    {user && profile ? (
                        <>
                            {/* Role Tag (Clickable to Dashboard) */}
                            <Link to={roleDetails.route} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(255,255,255,0.05)',
                                padding: '6px 12px',
                                borderRadius: '100px',
                                textDecoration: 'none',
                                border: `1px solid ${roleDetails.color}33`,
                                transition: 'all 0.2s'
                            }}>
                                <span>{roleDetails.icon}</span>
                                <span style={{ color: roleDetails.color, fontSize: '13px', fontWeight: '700' }}>
                                    {roleDetails.label} Portal
                                </span>
                            </Link>

                            {/* User Avatar / Dropdown Toggle */}
                            <button 
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    background: 'var(--stroke)',
                                    border: 'none',
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: 0
                                }}
                            >
                                {profile.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '48px',
                                    right: 0,
                                    background: '#1a1a1a',
                                    border: '1px solid var(--stroke)',
                                    borderRadius: '8px',
                                    width: '200px',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--stroke)' }}>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '700' }} className="truncate">
                                            {profile.full_name || 'My Account'}
                                        </p>
                                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }} className="truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                    <div style={{ padding: '8px' }}>
                                        <Link 
                                            to={roleDetails.route} 
                                            onClick={() => setDropdownOpen(false)}
                                            style={{ display: 'block', padding: '8px', color: 'var(--text)', textDecoration: 'none', fontSize: '14px', borderRadius: '4px' }}
                                        >
                                            My Dashboard
                                        </Link>
                                        <button 
                                            onClick={handleSignOut}
                                            style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '8px', color: '#ef4444', fontSize: '14px', cursor: 'pointer', borderRadius: '4px' }}
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Link to="/order/login" className="btn btn-ghost" style={{ padding: '6px 16px', fontSize: '14px' }}>
                                Sign In
                            </Link>
                            <Link to="/order/signup" className="btn btn-primary" style={{ padding: '6px 16px', fontSize: '14px' }}>
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
