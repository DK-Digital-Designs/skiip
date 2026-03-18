import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthService } from '../../lib/services/auth.service';
import { useToast } from '../../components/ui/Toast';
import { isSupabaseConfigured } from '../../lib/supabase';

export default function VendorSignup() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        storeName: '',
        storeSlug: '',
        inviteCode: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            // Verify invite code from env
            const expectedCode = import.meta.env.VITE_VENDOR_INVITE_CODE;

            if (formData.inviteCode !== expectedCode && isSupabaseConfigured()) {
                throw new Error('Invalid vendor invite code.');
            }

            if (!isSupabaseConfigured()) {
                addToast('Demo form: Setup successful!', 'success');
                navigate('/vendor/login');
                setLoading(false);
                return;
            }

            // Slugify the store name if slug is empty
            const slug = formData.storeSlug || formData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

            await AuthService.signUpVendor(
                formData.email,
                formData.password,
                formData.fullName,
                formData.storeName,
                slug
            );

            addToast('Vendor account created! Please check your email for a verification link.', 'success');
            navigate('/vendor/login');

        } catch (error) {
            addToast(error.message || 'Signup failed', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Become a Vendor</h1>
                <p className="text-muted" style={{ marginBottom: '32px' }}>Apply to join Skiip as a seller.</p>

                <form onSubmit={handleSignup} className="flex flex-col gap-16">
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
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
                        <div style={{ flex: 1 }}>
                            <label>Store Name</label>
                            <input
                                type="text"
                                name="storeName"
                                value={formData.storeName}
                                onChange={handleChange}
                                placeholder="E.g. Burger Bliss"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="vendor@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label>Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
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

                    <div>
                        <label>Store Slug <span className="text-muted" style={{ fontWeight: 400 }}>(Optional)</span></label>
                        <input
                            type="text"
                            name="storeSlug"
                            value={formData.storeSlug}
                            onChange={handleChange}
                            placeholder="burger-bliss"
                            pattern="[a-z0-9-]+"
                            title="Only lowercase letters, numbers, and hyphens"
                        />
                    </div>

                    <div style={{ marginTop: '8px' }}>
                        <label>Invite Code</label>
                        <input
                            type="text"
                            name="inviteCode"
                            value={formData.inviteCode}
                            onChange={handleChange}
                            placeholder="Partner verification code"
                            required
                        />
                        <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
                            You must have a valid invite code from Skiip to register.
                        </p>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} disabled={loading}>
                        {loading ? 'Submitting Application...' : 'Apply as Vendor'}
                    </button>

                    <p className="text-center" style={{ fontSize: '14px', marginTop: '16px' }}>
                        Already a vendor? <Link to="/vendor/login" className="text-accent">Sign in here</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
