import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../../lib/context/AuthContext';

vi.mock('../../lib/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

afterEach(() => {
    vi.clearAllMocks();
});

function renderProtectedRoute(authValue, requiredRoles) {
    useAuth.mockReturnValue(authValue);

    render(
        <MemoryRouter initialEntries={['/vendor/dashboard']}>
            <Routes>
                <Route
                    path="/vendor/dashboard"
                    element={
                        <ProtectedRoute roles={requiredRoles}>
                            <div>Vendor Dashboard</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/admin/dashboard" element={<div>Admin Dashboard</div>} />
                <Route path="/login" element={<div>Login</div>} />
                <Route path="/" element={<div>Home</div>} />
            </Routes>
        </MemoryRouter>
    );
}

describe('ProtectedRoute', () => {
    it('redirects admin users away from seller-only routes to the admin dashboard', () => {
        renderProtectedRoute(
            {
                loading: false,
                user: { id: 'admin-user' },
                profile: { role: 'admin' },
            },
            ['seller'],
        );

        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
        expect(screen.queryByText('Vendor Dashboard')).not.toBeInTheDocument();
    });

    it('allows seller users into seller-only routes', () => {
        renderProtectedRoute(
            {
                loading: false,
                user: { id: 'seller-user' },
                profile: { role: 'seller' },
            },
            ['seller'],
        );

        expect(screen.getByText('Vendor Dashboard')).toBeInTheDocument();
    });

    it('sends unauthenticated users to login', () => {
        renderProtectedRoute(
            {
                loading: false,
                user: null,
                profile: null,
            },
            ['seller'],
        );

        expect(screen.getByText('Login')).toBeInTheDocument();
    });
});
