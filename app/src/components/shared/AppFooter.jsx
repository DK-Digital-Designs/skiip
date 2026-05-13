import React from 'react';
import { APP_VERSION_LABEL } from '../../lib/version';

export default function AppFooter() {
    return (
        <footer style={{ padding: '24px 0 96px' }}>
            <div className="container" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <p className="text-muted" style={{ fontSize: '13px' }}>Copyright 2026 Skiip Technologies. All rights reserved.</p>
                <p className="text-muted" style={{ fontSize: '13px' }}>{APP_VERSION_LABEL}</p>
            </div>
        </footer>
    );
}
