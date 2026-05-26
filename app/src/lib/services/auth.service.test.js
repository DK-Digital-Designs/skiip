import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { supabase } from '../supabase';
import { hasPendingPasswordRecoveryRequest } from '../auth-callback';

vi.mock('../supabase', () => ({
    supabase: {
        auth: {
            resetPasswordForEmail: vi.fn(),
            updateUser: vi.fn(),
        },
    },
}));

describe('AuthService password recovery', () => {
    beforeEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        window.localStorage.clear();
    });

    it('requests a password reset back to the hash-routed update screen', async () => {
        supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

        await AuthService.requestPasswordReset('buyer@example.com');

        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('buyer@example.com', {
            redirectTo: `${window.location.origin}/#/reset-password`,
        });
        expect(window.localStorage.getItem('skiip-password-recovery-request')).not.toBeNull();
        expect(hasPendingPasswordRecoveryRequest()).toBe(true);
    });

    it('updates the password through the authenticated recovery session', async () => {
        supabase.auth.updateUser.mockResolvedValue({ data: { user: { id: 'buyer' } }, error: null });

        await AuthService.updatePassword('new-password');

        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    });
});
