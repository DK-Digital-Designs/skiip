import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            textAlign: 'center',
            background: 'var(--bg)'
        }}>
            <div className="card" style={{ maxWidth: '500px' }}>
                <h2 style={{ marginBottom: '16px', color: '#ef4444' }}>Something went wrong</h2>
                <p className="text-muted" style={{ marginBottom: '24px' }}>
                    We've encountered an unexpected error. Don't worry, your data is safe.
                </p>
                <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '24px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontFamily: 'monospace',
                    overflow: 'auto',
                    maxHeight: '150px'
                }}>
                    {error.message}
                </div>
                <button
                    onClick={resetErrorBoundary}
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                >
                    Reload Application
                </button>
            </div>
        </div>
    );
}

export default function ErrorBoundary({ children }) {
    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => {
                window.location.href = '/';
            }}
            onError={(error, errorInfo) => {
                console.error("Uncaught error:", error, errorInfo);
                // Clear storage to prevent permanent crash loops caused by bad data
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                } catch (e) {
                    console.error("Could not clear storage", e);
                }
                
                // Report to Sentry if available
                if (window.Sentry) {
                    window.Sentry.captureException(error, { extra: errorInfo });
                }
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
}
