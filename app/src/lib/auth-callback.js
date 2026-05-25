const AUTH_ERROR_KEYS = ['error', 'error_code', 'error_description'];

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

export function routePasswordRecoveryErrorCallback() {
    const resetRoute = getPasswordRecoveryErrorRoute(window.location.href);
    if (!resetRoute) return false;

    window.history.replaceState(window.history.state, '', resetRoute);
    return true;
}

export function routeActivePasswordRecoverySession() {
    if (window.location.hash.startsWith('#/reset-password')) return;

    window.location.hash = '/reset-password';
}
