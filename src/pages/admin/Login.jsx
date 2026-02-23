import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isSupabaseConfigured } from '../../lib/supabase';
import { AuthService } from '../../lib/services/auth.service';
import { useToast } from '../../components/ui/Toast';

export default function AdminLogin() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);

        try {
            if (!isSupabaseConfigured()) {
                // Demo login
                if (email === 'admin@skiip.com' && password === 'password') {
                    navigate('/admin/dashboard');
                } else {
                    addToast('Invalid demo credentials. Use admin@skiip.com / password', 'error');
                }
                setLoading(false);
                return;
            }

            await AuthService.signIn(email, password);
            addToast('Welcome back, Admin!', 'success');
            navigate('/admin/dashboard');
        } catch (error) {
            addToast(error.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Admin Portal</h1>
                <p className="text-muted" style={{ marginBottom: '32px' }}>Sign in to manage events and vendors</p>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '16px' }}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@skiip.com"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '24px' }}>
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

                    {!isSupabaseConfigured() && (
                        <p style={{ marginTop: '16px', fontSize: '13px', color: '#f59e0b' }}>
                            Demo Mode: Use <strong>admin@skiip.com</strong> / <strong>password</strong>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
