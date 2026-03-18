import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthService } from '../../lib/services/auth.service';
import { useToast } from '../../components/ui/Toast';
import AttendeeHeader from '../../components/shared/AttendeeHeader';

export default function BuyerLogin() {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { addToast } = useToast();

    // Determine where to redirect after login
    const from = location.state?.from?.pathname || '/order';

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await AuthService.signIn(email, password);
            addToast('Welcome back!', 'success');
            navigate(from, { replace: true });
        } catch (error) {
            addToast(error.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AttendeeHeader backTo="/order" backLabel="← Return to Vendors" />

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Sign In</h1>
                    <p className="text-muted" style={{ marginBottom: '32px' }}>Access your orders and fast checkout.</p>

                    <form onSubmit={handleLogin} className="flex flex-col gap-24">
                        <div>
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{ paddingRight: '40px', width: '100%' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--muted)',
                                        cursor: 'pointer',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>

                        <p className="text-center text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
                            Don't have an account? <Link to="/order/signup" className="text-accent">Create one</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
