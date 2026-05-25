import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from './ResetPassword';
import { AuthService } from '../../lib/services/auth.service';
import { useAuth } from '../../lib/context/AuthContext';

vi.mock('../../lib/context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../lib/services/auth.service', () => ({
    AuthService: {
        getSession: vi.fn(),
        updatePassword: vi.fn(),
        signOut: vi.fn(),
    },
}));

function renderResetPassword() {
    render(
        <MemoryRouter>
            <ResetPassword />
        </MemoryRouter>
    );
}

describe('ResetPassword', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not offer password updates for a normal authenticated visit', async () => {
        useAuth.mockReturnValue({
            passwordRecoverySession: false,
            clearPasswordRecoverySession: vi.fn(),
        });

        renderResetPassword();

        expect(await screen.findByText(/reset link is invalid or has expired/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /update password/i })).not.toBeInTheDocument();
        expect(AuthService.getSession).not.toHaveBeenCalled();
    });

    it('updates a password only after a recovery event has opened a session', async () => {
        const clearPasswordRecoverySession = vi.fn();
        useAuth.mockReturnValue({
            passwordRecoverySession: true,
            clearPasswordRecoverySession,
        });
        AuthService.getSession.mockResolvedValue({ user: { id: 'buyer-user' } });
        AuthService.updatePassword.mockResolvedValue({});
        AuthService.signOut.mockResolvedValue();

        renderResetPassword();

        fireEvent.change(await screen.findByLabelText('New Password'), { target: { value: 'changed-password' } });
        fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'changed-password' } });
        fireEvent.click(screen.getByRole('button', { name: /update password/i }));

        await waitFor(() => expect(AuthService.updatePassword).toHaveBeenCalledWith('changed-password'));
        expect(clearPasswordRecoverySession).toHaveBeenCalled();
        expect(AuthService.signOut).toHaveBeenCalled();
    });
});
