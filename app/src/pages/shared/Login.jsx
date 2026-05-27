import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';
import SkiipLogo from '../../components/ui/SkiipLogo';
import Icon from '../../components/ui/Icon';
import { SESSION_EXPIRED_REASON } from '../../lib/session-timeout';

function getDashboardRoute(role) {
    switch (role) {
        case 'admin': return '/admin/dashboard';
        case 'seller': return '/vendor/dashboard';
        default: return '/order';
    }
}

export default function UnifiedLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn, user, profile } = useAuth();
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const from = location.state?.from
        ? `${location.state.from.pathname}${location.state.from.search || ''}`
        : null;
    const sessionExpired = new URLSearchParams(location.search).get('reason') === SESSION_EXPIRED_REASON;

    useEffect(() => {
        if (user && profile) {
            navigate(from || getDashboardRoute(profile.role), { replace: true });
        }
    }, [user, profile, navigate, from]);

    async function handleLogin(event) {
        event.preventDefault();
        setLoading(true);
        try {
            const { user: authUser } = await signIn(email, password);
            let role = 'buyer';
            try {
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', authUser.id)
                    .single();
                if (profileData?.role) role = profileData.role;
            } catch {
                role = 'buyer';
            }

            addToast('Welcome back.', 'success');
            navigate(from || getDashboardRoute(role), { replace: true });
        } catch (error) {
            addToast(error.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="app-page" style={{ display: 'grid', placeItems: 'center', padding: '32px 16px' }}>
            <div style={{ maxWidth: '430px', width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
                    <SkiipLogo />
                </div>

                <div className="card" style={{ padding: '32px' }}>
                    <h1 style={{ fontSize: '30px', fontWeight: 950, marginBottom: '8px', color: 'var(--ink)' }}>Sign In</h1>
                    <p className="text-muted" style={{ marginBottom: '30px' }}>
                        Access your orders, or manage your store.
                    </p>
                    {sessionExpired && (
                        <p className="chip chip--accent" style={{ marginBottom: '22px', width: '100%' }}>
                            Your session expired. Please sign in again.
                        </p>
                    )}

                    <form onSubmit={handleLogin} style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label htmlFor="login-email">Email Address</label>
                            <input
                                id="login-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label htmlFor="login-password">Password</label>
                                <Link to="/forgot-password" className="text-accent" style={{ fontSize: '14px' }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Password"
                                    required
                                    style={{ paddingRight: '46px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--text-muted)',
                                        cursor: 'pointer',
                                        display: 'grid',
                                        placeItems: 'center',
                                    }}
                                >
                                    <Icon name={showPassword ? 'close' : 'user'} size={18} />
                                </button>
                            </div>
                        </div>

                        <button type="submit" id="login-submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <p className="text-center text-muted" style={{ fontSize: '14px' }}>
                            New to Skiip? <Link to="/signup" className="text-accent">Create an account</Link>
                        </p>
                    </form>
                </div>
            </div>
        </main>
    );
}
