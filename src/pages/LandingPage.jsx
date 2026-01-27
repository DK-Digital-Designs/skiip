import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header style={{ padding: '20px 0', borderBottom: '1px solid var(--stroke)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link to="/" style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="var(--accent)" />
                        </svg>
                        SKIIP
                    </Link>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Link to="/order" className="btn btn-primary">Start Ordering</Link>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
                    <h1 style={{ fontSize: '56px', fontWeight: '800', marginBottom: '24px', lineHeight: 1.1 }}>
                        Skip the queue. <br />
                        <span className="text-accent">Order & pay ahead.</span>
                    </h1>
                    <p style={{ fontSize: '20px', color: 'var(--text-muted)', marginBottom: '40px' }}>
                        Don't miss your favorite set while waiting for a burger. Skiip lets you browse, pay, and track your order from your phone.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <Link to="/order" className="btn btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
                            Start Ordering
                        </Link>
                        <Link to="/vendor/login" className="btn btn-ghost">Vendor Portal</Link>
                        <Link to="/admin/login" className="btn btn-ghost">Admin</Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{ padding: '40px 0', borderTop: '1px solid var(--stroke)', marginTop: '80px' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <p className="text-muted">© 2026 Skiip Technologies. MVP Demo Version.</p>
                </div>
            </footer>
        </div>
    );
}
