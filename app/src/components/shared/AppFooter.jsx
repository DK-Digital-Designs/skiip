import React from 'react';
import { APP_VERSION_LABEL } from '../../lib/version';

const footerLinks = [
    { label: 'Who we are', href: 'https://www.skiip.co.uk' },
    { label: 'Cookies', href: 'https://www.skiip.co.uk/cookies' },
    { label: 'Privacy', href: 'https://www.skiip.co.uk/privacy' },
    { label: 'Terms and Conditions', href: 'https://www.skiip.co.uk/terms' },
    { label: 'Help', href: 'https://www.skiip.co.uk/help' },
];

export default function AppFooter() {
    return (
        <footer className="app-footer">
            <div className="container app-footer__inner">
                <nav className="app-footer__links" aria-label="Footer links">
                    {footerLinks.map((link) => (
                        <a key={link.href} href={link.href}>
                            {link.label}
                        </a>
                    ))}
                </nav>
                <p className="text-muted" style={{ fontSize: '13px' }}>Copyright 2026 Skiip Technologies. All rights reserved.</p>
                <p className="text-muted" style={{ fontSize: '13px' }}>{APP_VERSION_LABEL}</p>
            </div>
        </footer>
    );
}
