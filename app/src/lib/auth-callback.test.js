import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    clearPkceCallbackCode,
    getCanonicalProductionRoute,
    getPasswordRecoveryErrorRoute,
    getPkceCallbackCode,
    hasPendingPasswordRecoveryRequest,
    markPasswordRecoveryRequest,
    routeActivePasswordRecoverySession,
} from './auth-callback';

describe('password recovery callback routing', () => {
    beforeEach(() => {
        vi.useRealTimers();
        window.localStorage.clear();
        window.history.replaceState(null, '', '/');
    });

    afterEach(() => {
        vi.useRealTimers();
    });

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
        routeActivePasswordRecoverySession();

        expect(window.location.hash).toBe('#/reset-password');
    });

    it('reads and clears a PKCE code returned alongside a hash-router login path', () => {
        window.history.replaceState(null, '', '/?code=recovery-code#/login');

        expect(getPkceCallbackCode(window.location.href)).toBe('recovery-code');

        clearPkceCallbackCode();

        expect(window.location.href).toBe(`${window.location.origin}/#/login`);
    });

    it('moves legacy production PKCE callbacks to the canonical domain before exchange', () => {
        expect(getCanonicalProductionRoute('https://skiip.vercel.app/?code=recovery-code#/')).toBe(
            'https://www.skiip.co.uk/?code=recovery-code#/'
        );
        expect(getCanonicalProductionRoute('https://skiip.co.uk/#/forgot-password')).toBe(
            'https://www.skiip.co.uk/#/forgot-password'
        );
        expect(getCanonicalProductionRoute('https://www.skiip.co.uk/?code=recovery-code#/')).toBeNull();
    });

    it('keeps recovery request intent only for a recent reset request', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-26T12:00:00Z'));

        markPasswordRecoveryRequest();
        expect(hasPendingPasswordRecoveryRequest()).toBe(true);

        vi.advanceTimersByTime(60 * 60 * 1000 + 1);
        expect(hasPendingPasswordRecoveryRequest()).toBe(false);
    });
});
