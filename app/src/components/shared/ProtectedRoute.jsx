import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/context/AuthContext';

/**
 * ProtectedRoute component to guard routes based on authentication and roles
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {string[]} [props.roles] - Optional roles required to access the route
 */
export default function ProtectedRoute({ children, roles }) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            </div>
        );
    }

    if (!user) {
        // All unauthenticated users go to the unified login page
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && roles.length > 0) {
        if (!profile || !roles.includes(profile.role)) {
            // Not authorized for this role
            return <Navigate to="/" replace />;
        }
    }

    return children;
}
