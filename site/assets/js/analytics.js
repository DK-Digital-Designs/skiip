/**
 * Skiip Analytics Stub
 * Replace with real provider (Google Analytics, Mixpanel, etc.)
 */

export const Analytics = {
    config: {
        enabled: false,
        id: 'SKIP-V1-DEBUG'
    },

    logEvent(name, params = {}) {
        if (this.config.enabled) {
            console.log(`[Analytics] ${name}`, params);
        }
    },

    pageView(page) {
        this.logEvent('page_view', { page });
    }
};
