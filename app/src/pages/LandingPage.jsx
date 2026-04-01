import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
