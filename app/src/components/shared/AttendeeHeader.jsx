import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { AuthService } from '../../lib/services/auth.service';
import SkiipLogo from '../ui/SkiipLogo';

export default function AttendeeHeader({ backTo, backLabel = 'Back' }) {
    const { user } = useAuth();
    const navigate = useNavigate();

    async function handleSignOut() {
        await AuthService.signOut();
        navigate('/');
    }

    return (
        <header className="app-header" style={{ marginBottom: 0 }}>
            <div className="container app-header__inner">
                {backTo ? (
                    <Link to={backTo} className="btn btn-ghost" style={{ minHeight: '38px' }}>
                        {backLabel}
                    </Link>
                ) : (
                    <SkiipLogo />
                )}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {user ? (
                        <>
                            <Link to="/order/profile" className="btn btn-ghost" style={{ minHeight: '38px' }}>
                                My Orders
                            </Link>
                            <button type="button" onClick={handleSignOut} className="btn btn-ghost" style={{ minHeight: '38px' }}>
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-purple" style={{ minHeight: '38px' }}>
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
