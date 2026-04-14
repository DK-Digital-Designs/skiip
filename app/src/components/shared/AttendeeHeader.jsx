import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { AuthService } from '../../lib/services/auth.service';

export default function AttendeeHeader({ backTo, backLabel = '← Back' }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSignOut = async () => {
        await AuthService.signOut();
        navigate('/');
    };

    return (
        <header style={{ padding: '20px 0', borderBottom: '1px solid var(--stroke)', marginBottom: '40px' }}>
            <div className="container flex justify-between items-center">
                {backTo ? (
                    <Link to={backTo} style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text)', textDecoration: 'none' }}>
                        {backLabel}
                    </Link>
                ) : (
                    <Link to="/" className="text-accent" style={{ fontSize: '24px', fontWeight: '800', textDecoration: 'none' }}>
                        SKIIP
                    </Link>
                )}

                <div className="flex gap-16 items-center">
                    {user ? (
                        <>
                            <Link to="/order/profile" className="text-muted" style={{ fontSize: '14px', textDecoration: 'none' }}>
                                My Profile
                            </Link>
                            <button onClick={handleSignOut} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '13px' }}>
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '14px' }}>
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
