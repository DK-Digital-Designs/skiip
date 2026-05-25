import { supabase } from '../supabase';
import { DEFAULT_LAUNCH_EVENT, normalizeLaunchEvent } from '../launch-event';
import { getFunctionAuthHeaders } from './function-auth';

const LAUNCH_EVENT_KEY = 'launch_event';
const DEFAULT_PAYMENT_CONTROL_RESPONSE = {
    controls: {
        enabled: true,
        reason: null,
        updatedAt: null,
        updatedBy: null,
    },
    masterEnabled: false,
    checkoutEnabled: false,
};

function normalizePaymentControlResponse(value) {
    return {
        controls: {
            enabled: value?.controls?.enabled !== false,
            reason: value?.controls?.reason || null,
            updatedAt: value?.controls?.updatedAt || null,
            updatedBy: value?.controls?.updatedBy || null,
        },
        masterEnabled: value?.masterEnabled === true,
        checkoutEnabled: value?.checkoutEnabled === true,
    };
}

export const SettingsService = {
    async getLaunchEvent() {
        if (!supabase) return DEFAULT_LAUNCH_EVENT;

        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', LAUNCH_EVENT_KEY)
            .maybeSingle();

        if (error) {
            console.warn('Launch event settings unavailable:', error.message);
            return DEFAULT_LAUNCH_EVENT;
        }

        return normalizeLaunchEvent(data?.value);
    },

    async saveLaunchEvent(value) {
        if (!supabase) return normalizeLaunchEvent(value);

        const normalized = normalizeLaunchEvent(value);
        const { data, error } = await supabase
            .from('app_settings')
            .upsert({ key: LAUNCH_EVENT_KEY, value: normalized }, { onConflict: 'key' })
            .select('value')
            .single();

        if (error) throw error;
        return normalizeLaunchEvent(data?.value);
    },

    async getPaymentControls() {
        if (!supabase) return DEFAULT_PAYMENT_CONTROL_RESPONSE;
        const headers = await getFunctionAuthHeaders();

        const { data, error } = await supabase.functions.invoke('payment-control', {
            headers,
            body: { action: 'get' },
        });

        if (error) throw error;
        return normalizePaymentControlResponse(data);
    },

    async savePaymentControls({ enabled, reason }) {
        if (!supabase) return DEFAULT_PAYMENT_CONTROL_RESPONSE;
        const headers = await getFunctionAuthHeaders();

        const { data, error } = await supabase.functions.invoke('payment-control', {
            headers,
            body: { action: 'set', enabled, reason },
        });

        if (error) throw error;
        return normalizePaymentControlResponse(data);
    },
};
