import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '20px'
        }}>
            <h1 style={{
                fontSize: '120px',
                fontWeight: '900',
                margin: '0',
                background: 'linear-gradient(to right, var(--accent), #f59e0b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: '1'
            }}>404</h1>
            <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>Oops! Page not found</h2>
            <p className="text-muted" style={{ maxWidth: '400px', marginBottom: '32px' }}>
                The page you're looking for doesn't exist or has been moved.
                Let's get you back on track.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={() => navigate(-1)} className="btn btn-ghost">Go Back</button>
                <button onClick={() => navigate('/')} className="btn btn-primary">Go Home</button>
            </div>
        </div>
    );
}
