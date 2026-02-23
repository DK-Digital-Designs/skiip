import React from 'react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
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
                            {this.state.error && this.state.error.toString()}
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="btn btn-primary"
                            style={{ width: '100%' }}
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
