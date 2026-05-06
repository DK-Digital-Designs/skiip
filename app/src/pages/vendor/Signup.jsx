import React from 'react';
import { Link } from 'react-router-dom';

export default function VendorSignup() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '40px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>Vendor Access</h1>
                <p className="text-muted" style={{ marginBottom: '32px' }}>
                    Vendor accounts are created by SKIIP admins for launch.
                </p>
                <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                    Sign in
                </Link>
            </div>
        </div>
    );
}
