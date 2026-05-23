const FALLBACK_TAG_RULES = [
    { tag: 'Burgers', terms: ['burger', 'fries', 'wagyu'] },
    { tag: 'Chicken', terms: ['chicken', 'wing', 'peri'] },
    { tag: 'Tacos', terms: ['taco', 'nacho', 'salsa'] },
    { tag: 'Bar', terms: ['bar', 'beer', 'cocktail', 'drink', 'mocktail'] },
    { tag: 'Sweet', terms: ['sweet', 'dessert', 'ice cream', 'waffle'] },
    { tag: 'Budget', terms: ['cheap', 'budget', 'value'] },
];

const VENDOR_CATEGORIES = ['Food', 'Drinks', 'Dessert', 'Coffee', 'Other'];

export function normalizeVendorCategory(category) {
    const cleaned = String(category || '').trim();
    return VENDOR_CATEGORIES.includes(cleaned) ? cleaned : '';
}

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

function normalizeVendorSource(vendor) {
    return vendor && typeof vendor === 'object' ? vendor : {};
}

export function getVendorTags(vendor = {}) {
    const source = normalizeVendorSource(vendor);
    const category = normalizeVendorCategory(source.category);
    const explicitTags = normalizeVendorTags(source.tags);
    if (explicitTags.length > 0) return normalizeVendorTags([category, ...explicitTags]);

    const haystack = `${source.name || ''} ${source.description || ''}`.toLowerCase();
    const inferred = FALLBACK_TAG_RULES
        .filter((rule) => rule.terms.some((term) => haystack.includes(term)))
        .map((rule) => rule.tag);

    return inferred.length > 0 ? normalizeVendorTags([category, ...inferred]) : [category || 'Food'];
}

export function getVendorPaymentStatus(vendor = {}) {
    const source = normalizeVendorSource(vendor);
    return source.stripe_connect_status
        || (source.stripe_onboarding_complete ? 'ready' : source.stripe_account_id ? 'onboarding' : 'not_started');
}

export function isVendorReadyForOrders(vendor = {}) {
    return getVendorPaymentStatus(vendor) === 'ready';
}

export function getOrderableVendors(vendors = []) {
    return (Array.isArray(vendors) ? vendors : []).filter((vendor) => isVendorReadyForOrders(vendor));
}

export function getVendorPaymentLabel(vendor = {}) {
    const status = getVendorPaymentStatus(vendor);
    if (status === 'ready') return 'Ready to order';
    if (status === 'pending_verification') return 'Payments being verified';
    if (status === 'restricted') return 'Payment setup paused';
    return 'Setting up payments';
}
