import React from 'react';
import { Link } from 'react-router-dom';
import { APP_VERSION_LABEL } from '../../lib/version';

const footerLinks = [
    { label: 'Who we are', href: 'https://business.skiip.co.uk/experience' },
    { label: 'Cookies', href: 'https://business.skiip.co.uk/cookies' },
    { label: 'Privacy', href: 'https://business.skiip.co.uk/privacy' },
    { label: 'Terms and Conditions', href: 'https://business.skiip.co.uk/terms' },
    { label: 'Issue with your order', to: '/report-issue' },
];

export default function AppFooter() {
    return (
        <footer className="app-footer">
            <div className="container app-footer__inner">
                <nav className="app-footer__links" aria-label="Footer links">
                    {footerLinks.map((link) => (
                        link.to
                            ? <Link key={link.to} to={link.to}>{link.label}</Link>
                            : <a key={link.href} href={link.href}>{link.label}</a>
                    ))}
                </nav>
                <p className="text-muted" style={{ fontSize: '13px' }}>Copyright 2026 Skiip Technologies. All rights reserved.</p>
                <p className="text-muted" style={{ fontSize: '13px' }}>{APP_VERSION_LABEL}</p>
            </div>
        </footer>
    );
}
