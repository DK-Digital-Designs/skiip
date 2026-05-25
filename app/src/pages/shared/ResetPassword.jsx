import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../lib/services/auth.service';
import { useAuth } from '../../lib/context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import SkiipLogo from '../../components/ui/SkiipLogo';

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPassword() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { passwordRecoverySession, clearPasswordRecoverySession } = useAuth();
    const [checkingSession, setCheckingSession] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let mounted = true;

        if (!passwordRecoverySession) {
            setHasSession(false);
            setCheckingSession(false);
            return () => {
                mounted = false;
            };
        }

        AuthService.getSession()
            .then((session) => {
                if (mounted) setHasSession(Boolean(session));
            })
            .catch(() => {
                if (mounted) setHasSession(false);
            })
            .finally(() => {
                if (mounted) setCheckingSession(false);
            });

        return () => {
            mounted = false;
        };
    }, [passwordRecoverySession]);

    async function handleSubmit(event) {
        event.preventDefault();

        if (password !== confirmPassword) {
            addToast('Passwords do not match.', 'error');
            return;
        }

        setLoading(true);
        try {
            await AuthService.updatePassword(password);
            clearPasswordRecoverySession();
            try {
                await AuthService.signOut();
            } catch {
                // Password update has succeeded; do not turn a sign-out issue into a reset failure.
            }
            addToast('Password updated. Sign in with your new password.', 'success');
            navigate('/login', { replace: true });
        } catch (error) {
            addToast(error.message || 'Could not update your password. Please request a new reset link.', 'error');
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
                        Choose New Password
                    </h1>

                    {checkingSession && <p className="text-muted">Checking your reset link...</p>}

                    {!checkingSession && !hasSession && (
                        <>
                            <p className="text-muted" style={{ marginBottom: '30px' }}>
                                This reset link is invalid or has expired. Request a new link to continue.
                            </p>
                            <Link to="/forgot-password" className="btn btn-primary" style={{ width: '100%' }}>
                                Request New Link
                            </Link>
                        </>
                    )}

                    {!checkingSession && hasSession && (
                        <>
                            <p className="text-muted" style={{ marginBottom: '30px' }}>
                                Enter a new password for your account.
                            </p>

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label htmlFor="new-password">New Password</label>
                                    <input
                                        id="new-password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        minLength={MIN_PASSWORD_LENGTH}
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirm-password">Confirm Password</label>
                                    <input
                                        id="confirm-password"
                                        type="password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(event) => setConfirmPassword(event.target.value)}
                                        minLength={MIN_PASSWORD_LENGTH}
                                        required
                                    />
                                </div>

                                <p className="text-muted" style={{ fontSize: '13px' }}>
                                    Password must be at least {MIN_PASSWORD_LENGTH} characters.
                                </p>

                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                                    {loading ? 'Updating password...' : 'Update Password'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
