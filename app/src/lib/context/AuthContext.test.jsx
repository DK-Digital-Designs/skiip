import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import { markPasswordRecoveryRequest } from '../auth-callback';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
    isSupabaseConfigured: vi.fn(() => true),
    supabase: {
        auth: {
            exchangeCodeForSession: vi.fn(),
            getSession: vi.fn(),
            onAuthStateChange: vi.fn(),
        },
        from: vi.fn(),
    },
}));

vi.mock('../services/auth.service', () => ({
    AuthService: {
        signIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
    },
}));

function AuthStateProbe() {
    const { loading, passwordRecoverySession } = useAuth();
    if (loading) return <p>loading</p>;
    return <p>{passwordRecoverySession ? 'recovery-active' : 'ordinary-session'}</p>;
}

describe('AuthProvider recovery callbacks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.history.replaceState(null, '', '/');

        const profileQuery = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { role: 'buyer' }, error: null }),
        };
        supabase.from.mockReturnValue(profileQuery);
        supabase.auth.getSession.mockResolvedValue({ data: { session: null } });
        supabase.auth.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe: vi.fn() } },
        });
    });

    it('opens password reset when a PKCE recovery code returns on the login route', async () => {
        window.history.replaceState(null, '', '/?code=recovery-code#/login');
        supabase.auth.exchangeCodeForSession.mockResolvedValue({
            data: {
                session: { user: { id: 'buyer-user' } },
                redirectType: 'PASSWORD_RECOVERY',
            },
            error: null,
        });

        render(
            <AuthProvider>
                <AuthStateProbe />
            </AuthProvider>
        );

        expect(await screen.findByText('recovery-active')).toBeInTheDocument();
        expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('recovery-code');
        expect(window.location.search).toBe('');
        expect(window.location.hash).toBe('#/reset-password');
    });

    it('uses recent reset-request intent when exchange output omits recovery metadata', async () => {
        markPasswordRecoveryRequest();
        window.history.replaceState(null, '', '/?code=recovery-code#/login');
        supabase.auth.exchangeCodeForSession.mockResolvedValue({
            data: {
                session: { user: { id: 'buyer-user' } },
                redirectType: null,
            },
            error: null,
        });

        render(
            <AuthProvider>
                <AuthStateProbe />
            </AuthProvider>
        );

        expect(await screen.findByText('recovery-active')).toBeInTheDocument();
        expect(window.location.hash).toBe('#/reset-password');
    });
});
