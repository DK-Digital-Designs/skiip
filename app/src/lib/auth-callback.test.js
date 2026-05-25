import { describe, expect, it } from 'vitest';
import { getPasswordRecoveryErrorRoute, routeActivePasswordRecoverySession } from './auth-callback';

describe('password recovery callback routing', () => {
    it('moves expired Supabase callbacks out of the hash-router 404 path', () => {
        const callbackUrl =
            'https://skiip.vercel.app/?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired&sb=';

        expect(getPasswordRecoveryErrorRoute(callbackUrl)).toBe(
            'https://skiip.vercel.app/#/reset-password?reason=expired'
        );
    });

    it('ignores ordinary application routes', () => {
        expect(getPasswordRecoveryErrorRoute('https://skiip.vercel.app/#/login')).toBeNull();
    });

    it('opens the password form after Supabase establishes a recovery session', () => {
        window.history.replaceState(null, '', '/');

        routeActivePasswordRecoverySession();

        expect(window.location.hash).toBe('#/reset-password');
    });
});
