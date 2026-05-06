import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../lib/services/auth.service';
import { useToast } from '../../components/ui/Toast';

export default function UnifiedSignup() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (event) => {
        setFormData({ ...formData, [event.target.name]: event.target.value });
    };

    async function handleSignup(event) {
        event.preventDefault();
        setLoading(true);

        try {
            await AuthService.signUp(formData.email, formData.password, formData.fullName, 'buyer');
            addToast('Account created. You can start ordering.', 'success');
            navigate('/order');
        } catch (error) {
            addToast(error.message || 'Signup failed. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ maxWidth: '400px', width: '100%' }}>
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
                                    placeholder="Password"
                                    required
                                    minLength={6}
                                    style={{ paddingRight: '40px', width: '100%' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
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
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {showPassword ? 'Hide' : 'Show'}
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
