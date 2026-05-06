export const GENERIC_CHECKOUT_ERROR_MESSAGE = 'We had trouble starting the payment. Please check back soon.';

const VENDOR_NOT_READY_MESSAGE = 'Oops! This vendor is still setting up their bank account on SKIIP. Please try again later.';
const PRODUCT_UNAVAILABLE_MESSAGE = 'One or more items in your cart are no longer available. Refresh your cart, adjust the items, and try again.';
const SCHEDULED_COLLECTION_MESSAGE = 'Choose a valid scheduled collection time before checking out.';
const SESSION_EXPIRED_MESSAGE = 'Your session expired. Please sign in again before checking out.';

export class CheckoutFunctionError extends Error {
    constructor(message, { code = null, status = null, payload = null, buyerMessage = GENERIC_CHECKOUT_ERROR_MESSAGE, cause = null } = {}) {
        super(message || GENERIC_CHECKOUT_ERROR_MESSAGE);
        this.name = 'CheckoutFunctionError';
        this.code = code;
        this.status = status;
        this.payload = payload;
        this.buyerMessage = buyerMessage;
        this.cause = cause;
    }
}

function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCode(payload) {
    if (!isObject(payload)) return null;

    const rawCode = payload.code || payload.error;
    if (typeof rawCode !== 'string') return null;

    const normalized = rawCode.trim().toUpperCase();
    return /^[A-Z0-9_]+$/.test(normalized) ? normalized : null;
}

async function readResponsePayload(response) {
    if (!response) return null;

    const readableResponse = typeof response.clone === 'function'
        ? response.clone()
        : response;

    if (typeof readableResponse.json === 'function') {
        try {
            return await readableResponse.json();
        } catch {
            // Fall through to text parsing below.
        }
    }

    if (typeof readableResponse.text === 'function') {
        try {
            const text = await readableResponse.text();
            return text ? JSON.parse(text) : null;
        } catch {
            return null;
        }
    }

    return null;
}

export async function readFunctionErrorPayload(error) {
    const context = error?.context;
    if (!context) return null;

    return readResponsePayload(context);
}

export function getCheckoutBuyerMessage({ code, status, payload }) {
    if (code === 'INSUFFICIENT_INVENTORY' && typeof payload?.error === 'string') {
        return payload.error;
    }

    if (code === 'PRODUCT_UNAVAILABLE') {
        return PRODUCT_UNAVAILABLE_MESSAGE;
    }

    if (code === 'VENDOR_NOT_READY') {
        return VENDOR_NOT_READY_MESSAGE;
    }

    if (status === 401) {
        return SESSION_EXPIRED_MESSAGE;
    }

    if (
        typeof payload?.error === 'string' &&
        payload.error.toLowerCase().includes('scheduled collection')
    ) {
        return SCHEDULED_COLLECTION_MESSAGE;
    }

    return GENERIC_CHECKOUT_ERROR_MESSAGE;
}

export async function createCheckoutFunctionError(error) {
    const payload = await readFunctionErrorPayload(error);
    const code = normalizeCode(payload);
    const status = error?.context?.status || error?.status || null;
    const buyerMessage = getCheckoutBuyerMessage({ code, status, payload });
    const operatorMessage = isObject(payload)
        ? payload.message || payload.error || error?.message
        : error?.message;

    return new CheckoutFunctionError(operatorMessage, {
        code,
        status,
        payload,
        buyerMessage,
        cause: error,
    });
}
