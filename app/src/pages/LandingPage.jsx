import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';

export default function LandingPage() {
    return (
        <main className="app-page">
            <div className="container two-column" style={{ alignItems: 'center', minHeight: 'calc(100vh - 170px)' }}>
                <section>
                    <p className="page-kicker">Festival food without the queue</p>
                    <h1 className="page-title" style={{ marginTop: '12px' }}>
                        Skip the lines, enjoy the vibes.
                    </h1>
                    <p className="page-subtitle" style={{ marginTop: '18px' }}>
                        Browse vendors, pay securely, and track your pickup from your phone while the event keeps moving.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '30px' }}>
                        <Link to="/order" className="btn btn-primary">
                            <Icon name="bag" size={18} />
                            Start Ordering
                        </Link>
                        <Link to="/login" className="btn btn-ghost">
                            Sign In
                        </Link>
                    </div>
                </section>
                <section className="hero-panel" aria-label="SKIIP event preview">
                    <div className="hero-panel__content">
                        <span className="chip chip--cyan" style={{ width: 'fit-content', color: '#fff', background: 'rgba(34,211,238,0.22)' }}>
                            Live now
                        </span>
                        <h2>Order ahead at Summer Beats</h2>
                        <p>Find the right stall, pay in seconds, and collect when your order is ready.</p>
                    </div>
                </section>
            </div>
        </main>
    );
}
