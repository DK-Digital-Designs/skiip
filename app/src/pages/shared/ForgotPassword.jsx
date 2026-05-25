import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthService } from '../../lib/services/auth.service';
import { useToast } from '../../components/ui/Toast';
import SkiipLogo from '../../components/ui/SkiipLogo';

export default function ForgotPassword() {
    const { addToast } = useToast();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();
        setLoading(true);

        try {
            await AuthService.requestPasswordReset(email.trim());
            setSubmitted(true);
        } catch {
            addToast('Could not send a password reset email. Please try again later.', 'error');
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
                    <h1 style={{ fontSize: '30px', fontWeight: 950, marginBottom: '8px', color: 'var(--ink)' }}>
                        Reset Password
                    </h1>

                    {submitted ? (
                        <>
                            <p className="text-muted" style={{ marginBottom: '30px' }}>
                                If an account exists for that email address, a password reset link is on its way.
                            </p>
                            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                                Back to Sign In
                            </Link>
                        </>
                    ) : (
                        <>
                            <p className="text-muted" style={{ marginBottom: '30px' }}>
                                Enter your email address and we will send a secure reset link.
                            </p>

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label htmlFor="recovery-email">Email Address</label>
                                    <input
                                        id="recovery-email"
                                        type="email"
                                        autoComplete="email"
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        placeholder="you@example.com"
                                        required
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Sending reset link...' : 'Send Reset Link'}
                                </button>

                                <p className="text-center text-muted" style={{ fontSize: '14px' }}>
                                    Remembered your password? <Link to="/login" className="text-accent">Sign in</Link>
                                </p>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
