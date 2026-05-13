const FALLBACK_TAG_RULES = [
    { tag: 'Burgers', terms: ['burger', 'fries', 'wagyu'] },
    { tag: 'Chicken', terms: ['chicken', 'wing', 'peri'] },
    { tag: 'Tacos', terms: ['taco', 'nacho', 'salsa'] },
    { tag: 'Bar', terms: ['bar', 'beer', 'cocktail', 'drink', 'mocktail'] },
    { tag: 'Sweet', terms: ['sweet', 'dessert', 'ice cream', 'waffle'] },
    { tag: 'Budget', terms: ['cheap', 'budget', 'value'] },
];

export function normalizeVendorTags(tags) {
    const values = Array.isArray(tags)
        ? tags
        : String(tags || '')
            .split(',')
            .map((tag) => tag.trim());

    return [...new Set(values
        .map((tag) => String(tag || '').trim())
        .filter(Boolean)
        .map((tag) => tag.slice(0, 24)))]
        .slice(0, 8);
}

export function getVendorTags(vendor = {}) {
    const explicitTags = normalizeVendorTags(vendor.tags);
    if (explicitTags.length > 0) return explicitTags;

    const haystack = `${vendor.name || ''} ${vendor.description || ''}`.toLowerCase();
    const inferred = FALLBACK_TAG_RULES
        .filter((rule) => rule.terms.some((term) => haystack.includes(term)))
        .map((rule) => rule.tag);

    return inferred.length > 0 ? inferred : ['Food'];
}

export function getVendorPaymentStatus(vendor = {}) {
    return vendor.stripe_connect_status
        || (vendor.stripe_onboarding_complete ? 'ready' : vendor.stripe_account_id ? 'onboarding' : 'not_started');
}

export function isVendorReadyForOrders(vendor = {}) {
    return getVendorPaymentStatus(vendor) === 'ready';
}

export function getVendorPaymentLabel(vendor = {}) {
    const status = getVendorPaymentStatus(vendor);
    if (status === 'ready') return 'Ready to order';
    if (status === 'pending_verification') return 'Payments being verified';
    if (status === 'restricted') return 'Payment setup paused';
    return 'Setting up payments';
}
