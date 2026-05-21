import { track } from '@vercel/analytics';

const ATTRIBUTION_KEY = 'skiip-analytics-attribution';
const TRACKED_EVENTS_KEY = 'skiip-analytics-tracked-events';
const MAX_EVENT_PROPERTIES = 2;
const MAX_VALUE_LENGTH = 120;
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function hasBrowserStorage() {
    return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function cleanString(value) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, '_')
        .slice(0, MAX_VALUE_LENGTH);
}

function cleanPropertyValue(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    if (typeof value === 'boolean') return value;
    const cleaned = cleanString(value);
    return cleaned || undefined;
}

function readStoredJson(key, fallback) {
    if (!hasBrowserStorage()) return fallback;
    try {
        const value = window.sessionStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
}

function writeStoredJson(key, value) {
    if (!hasBrowserStorage()) return;
    try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Analytics should never block a user flow.
    }
}

function getHashSearchParams() {
    if (typeof window === 'undefined') return new URLSearchParams();
    const hash = window.location.hash || '';
    const queryStart = hash.indexOf('?');
    return queryStart >= 0 ? new URLSearchParams(hash.slice(queryStart + 1)) : new URLSearchParams();
}

function getCurrentAttributionParams() {
    if (typeof window === 'undefined') return {};

    const pageParams = new URLSearchParams(window.location.search);
    const hashParams = getHashSearchParams();
    const attribution = {};

    for (const key of UTM_KEYS) {
        const value = pageParams.get(key) || hashParams.get(key);
        if (value) attribution[key] = cleanString(value);
    }

    return attribution;
}

export function captureAnalyticsAttribution() {
    const params = getCurrentAttributionParams();
    const hasCampaignParams = Object.keys(params).length > 0;

    if (!hasCampaignParams) return getAnalyticsAttribution();

    const attribution = {
        ...params,
        captured_at: new Date().toISOString(),
    };

    writeStoredJson(ATTRIBUTION_KEY, attribution);
    return attribution;
}

export function getAnalyticsAttribution() {
    return readStoredJson(ATTRIBUTION_KEY, {});
}

export function getCampaignLabel() {
    const attribution = getAnalyticsAttribution();
    const parts = [
        attribution.utm_source,
        attribution.utm_medium,
        attribution.utm_campaign,
        attribution.utm_content,
    ].filter(Boolean);

    return parts.length ? cleanString(parts.join('/')) : 'direct';
}

export function trackSkiipEvent(name, properties = {}) {
    const eventProperties = {};
    const entries = Object.entries(properties);
    const campaign = getCampaignLabel();
    const allowedEntries = entries.slice(0, campaign ? MAX_EVENT_PROPERTIES - 1 : MAX_EVENT_PROPERTIES);

    for (const [key, value] of allowedEntries) {
        const cleanValue = cleanPropertyValue(value);
        if (cleanValue !== undefined) eventProperties[key] = cleanValue;
    }

    if (campaign && Object.keys(eventProperties).length < MAX_EVENT_PROPERTIES) {
        eventProperties.campaign = campaign;
    }

    track(name, eventProperties);
}

export function trackSkiipEventOnce(uniqueKey, name, properties = {}) {
    const trackedEvents = readStoredJson(TRACKED_EVENTS_KEY, []);
    if (trackedEvents.includes(uniqueKey)) return;

    writeStoredJson(TRACKED_EVENTS_KEY, [...trackedEvents.slice(-79), uniqueKey]);
    trackSkiipEvent(name, properties);
}
