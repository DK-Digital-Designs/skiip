import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthService } from '../../lib/services/auth.service';
import { useToast } from '../../components/ui/Toast';
import AttendeeHeader from '../../components/shared/AttendeeHeader';

export default function BuyerSignup() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });
    const [loading, setLoading] = useState(false);

    // Support redirecting back to checkout
    const from = location.state?.from?.pathname || '/order';

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    async function handleSignup(e) {
        e.preventDefault();
        setLoading(true);

        try {
            await AuthService.signUp(
                formData.email,
                formData.password,
                formData.fullName,
                'buyer'
            );

            addToast('Account created successfully!', 'success');
            navigate(from, { replace: true });
        } catch (error) {
            addToast(error.message || 'Signup failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <AttendeeHeader backTo="/order/login" backLabel="← Back to Login" />

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Create Account</h1>
                    <p className="text-muted" style={{ marginBottom: '32px' }}>Save your profile for faster checkout.</p>

                    <form onSubmit={handleSignup} className="flex flex-col gap-24">
                        <div>
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Your Name"
                                required
                            />
                        </div>

                        <div>
                            <label>Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div>
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                            {loading ? 'Creating...' : 'Sign Up'}
                        </button>

                        <p className="text-center text-muted" style={{ fontSize: '14px', marginTop: '8px' }}>
                            Already have an account? <Link to="/order/login" className="text-accent">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
