import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from './auth.service';
import { supabase } from '../supabase';

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
        vi.clearAllMocks();
    });

    it('requests a password reset back to the hash-routed update screen', async () => {
        supabase.auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

        await AuthService.requestPasswordReset('buyer@example.com');

        expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith('buyer@example.com', {
            redirectTo: `${window.location.origin}/#/reset-password`,
        });
    });

    it('updates the password through the authenticated recovery session', async () => {
        supabase.auth.updateUser.mockResolvedValue({ data: { user: { id: 'buyer' } }, error: null });

        await AuthService.updatePassword('new-password');

        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'new-password' });
    });
});
