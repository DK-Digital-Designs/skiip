import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthService } from '../../lib/services/auth.service';
import { useToast } from '../../components/ui/Toast';

export default function UnifiedSignup() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [done, setDone] = useState(false); // confirmation state

    const from = location.state?.from?.pathname || '/order';

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    async function handleSignup(e) {
        e.preventDefault();
        setLoading(true);
        try {
            // All public signups create a 'buyer' role — vendors are provisioned by admins
            await AuthService.signUp(formData.email, formData.password, formData.fullName, 'buyer');
            setDone(true);
        } catch (error) {
            addToast(error.message || 'Signup failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px', textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📬</div>
                    <h2 style={{ marginBottom: '12px' }}>Check your inbox</h2>
                    <p className="text-muted" style={{ marginBottom: '24px' }}>
                        We sent a verification link to <strong>{formData.email}</strong>. Click it to activate your account.
                    </p>
                    <Link to="/login" className="btn btn-primary" style={{ width: '100%', display: 'block' }}>
                        Back to Sign In
                    </Link>
                </div>
            </div>
        );
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
                    <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Create Account</h1>
                    <p className="text-muted" style={{ marginBottom: '32px' }}>
                        Join Skiip for faster orders and order history.
                    </p>

                    <form onSubmit={handleSignup} className="flex flex-col gap-24">
                        <div>
                            <label htmlFor="signup-name">Full Name</label>
                            <input
                                id="signup-name"
                                type="text"
                                name="fullName"
                                autoComplete="name"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Your Name"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="signup-email">Email Address</label>
                            <input
                                id="signup-email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="signup-password">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
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
                            id="signup-submit"
                            type="submit"
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>

                        <p className="text-center text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
                            Already have an account? <Link to="/login" className="text-accent">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
