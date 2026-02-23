import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../lib/services/auth.service';
import { StoreService } from '../../lib/services/store.service';
import { useToast } from '../../components/ui/Toast';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function VendorLogin() {
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
                if (email === 'vendor@skiip.com' && password === 'password') {
                    navigate('/vendor/dashboard');
                } else {
                    addToast('Invalid demo credentials. Use vendor@skiip.com / password', 'error');
                }
                setLoading(false);
                return;
            }

            await AuthService.signIn(email, password);

            // Check if user is a vendor
            const storeData = await StoreService.getMyStore();
            if (!storeData) {
                addToast('No store found for this account.', 'error');
                navigate('/');
                return;
            }

            addToast('Login successful!', 'success');
            navigate('/vendor/dashboard');
        } catch (error) {
            addToast(error.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Vendor Portal</h1>
                <p className="text-muted" style={{ marginBottom: '32px' }}>Sign in to manage your orders</p>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '16px' }}>
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vendor@example.com"
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
                            Demo Mode: Use <strong>vendor@example.com</strong> / <strong>password</strong>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
