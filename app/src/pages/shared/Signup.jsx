import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../lib/services/auth.service';
import { useToast } from '../../components/ui/Toast';
import SkiipLogo from '../../components/ui/SkiipLogo';
import { trackSkiipEvent } from '../../lib/analytics';

export default function UnifiedSignup() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    function handleChange(event) {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    }

    async function handleSignup(event) {
        event.preventDefault();
        setLoading(true);
        trackSkiipEvent('signup_started', { role: 'buyer' });

        try {
            await AuthService.signUp(formData.email, formData.password, formData.fullName, 'buyer');
            trackSkiipEvent('signup_completed', { role: 'buyer' });
            addToast('Account created. You can start ordering.', 'success');
            navigate('/order');
        } catch (error) {
            trackSkiipEvent('signup_failed', { role: 'buyer' });
            addToast(error.message || 'Signup failed. Please try again.', 'error');
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
                    <h1 style={{ fontSize: '30px', fontWeight: 950, marginBottom: '8px', color: 'var(--ink)' }}>Create Account</h1>
                    <p className="text-muted" style={{ marginBottom: '30px' }}>
                        Join Skiip for faster orders and order history.
                    </p>

                    <form onSubmit={handleSignup} style={{ display: 'grid', gap: '20px' }}>
                        <div>
                            <label htmlFor="signup-name">Full Name</label>
                            <input
                                id="signup-name"
                                type="text"
                                name="fullName"
                                autoComplete="name"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Your name"
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
                                    placeholder="Password"
                                    required
                                    minLength={6}
                                    style={{ paddingRight: '70px' }}
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
                                        color: 'var(--accent)',
                                        cursor: 'pointer',
                                        fontWeight: 850,
                                    }}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>
                        </div>

                        <button id="signup-submit" type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </button>

                        <p className="text-center text-muted" style={{ fontSize: '14px' }}>
                            Already have an account? <Link to="/login" className="text-accent">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </main>
    );
}
