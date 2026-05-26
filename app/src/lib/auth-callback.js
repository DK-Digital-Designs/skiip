const AUTH_ERROR_KEYS = ['error', 'error_code', 'error_description'];
const PASSWORD_RECOVERY_REQUEST_KEY = 'skiip-password-recovery-request';
const PASSWORD_RECOVERY_REQUEST_TTL_MS = 60 * 60 * 1000;

function readCallbackValue(url, key) {
    const queryValue = url.searchParams.get(key);
    if (queryValue) return queryValue;

    if (!url.hash || url.hash.startsWith('#/')) return null;

    return new URLSearchParams(url.hash.slice(1)).get(key);
}

export function getPasswordRecoveryErrorRoute(href) {
    const url = new URL(href);

    if (readCallbackValue(url, 'error_code') !== 'otp_expired') {
        return null;
    }

    AUTH_ERROR_KEYS.forEach((key) => url.searchParams.delete(key));
    url.hash = '/reset-password?reason=expired';
    return url.toString();
}

export function getPkceCallbackCode(href) {
    return new URL(href).searchParams.get('code');
}

export function clearPkceCallbackCode() {
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    window.history.replaceState(window.history.state, '', url.toString());
}

export function markPasswordRecoveryRequest() {
    window.localStorage.setItem(PASSWORD_RECOVERY_REQUEST_KEY, String(Date.now()));
}

export function clearPendingPasswordRecoveryRequest() {
    window.localStorage.removeItem(PASSWORD_RECOVERY_REQUEST_KEY);
}

export function hasPendingPasswordRecoveryRequest() {
    const requestedAt = Number(window.localStorage.getItem(PASSWORD_RECOVERY_REQUEST_KEY));
    const requestAge = Date.now() - requestedAt;

    if (!Number.isFinite(requestedAt) || requestedAt <= 0 || requestAge < 0 || requestAge > PASSWORD_RECOVERY_REQUEST_TTL_MS) {
        clearPendingPasswordRecoveryRequest();
        return false;
    }

    return true;
}

export function routePasswordRecoveryErrorCallback() {
    const resetRoute = getPasswordRecoveryErrorRoute(window.location.href);
    if (!resetRoute) return false;

    clearPendingPasswordRecoveryRequest();
    window.history.replaceState(window.history.state, '', resetRoute);
    return true;
}

export function routeActivePasswordRecoverySession() {
    if (window.location.hash.startsWith('#/reset-password')) return;

    window.location.hash = '/reset-password';
}
