import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';

// Role-based route mapping
function getDashboardRoute(role) {
    switch (role) {
        case 'admin':   return '/admin/dashboard';
        case 'seller':  return '/vendor/dashboard';
        default:        return '/order';
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

    // If user is already logged in (e.g., navigated back to /login), auto-redirect
    useEffect(() => {
        if (user && profile) {
            navigate(getDashboardRoute(profile.role), { replace: true });
        }
    }, [user, profile, navigate]);

    // Redirect to original intended page after login, falling back to role-based route
    const from = location.state?.from?.pathname || null;

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        try {
            const { user: authUser } = await signIn(email, password);
            
            // Fetch profile directly so we can route immediately without waiting
            // for the AuthContext async state update cycle
            let role = 'buyer'; // safe default
            try {
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('role')
                    .eq('id', authUser.id)
                    .single();
                if (profileData?.role) role = profileData.role;
            } catch {
                // If profile fetch fails, default to buyer flow
            }

            addToast('Welcome back!', 'success');
            // Use `from` if coming from a protected route, otherwise role-route
            navigate(from || getDashboardRoute(role), { replace: true });
        } catch (error) {
            addToast(error.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ maxWidth: '400px', width: '100%' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="var(--accent)" />
                        </svg>
                        <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)' }}>SKIIP</span>
                    </Link>
                </div>

                <div className="card" style={{ padding: '40px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Sign In</h1>
                    <p className="text-muted" style={{ marginBottom: '32px' }}>
                        Access your orders, or manage your store.
                    </p>

                    <form onSubmit={handleLogin} className="flex flex-col gap-24">
                        <div>
                            <label htmlFor="login-email">Email Address</label>
                            <input
                                id="login-email"
                                type="email"
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="login-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ paddingRight: '40px', width: '100%' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%',
                                        transform: 'translateY(-50%)', background: 'none',
                                        border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                                        padding: 0, display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            id="login-submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <p className="text-center text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
                            New to Skiip? <Link to="/signup" className="text-accent">Create an account</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
