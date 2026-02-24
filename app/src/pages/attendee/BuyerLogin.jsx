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
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
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
