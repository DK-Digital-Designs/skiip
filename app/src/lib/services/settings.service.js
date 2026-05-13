import { supabase } from '../supabase';
import { DEFAULT_LAUNCH_EVENT, normalizeLaunchEvent } from '../launch-event';

const LAUNCH_EVENT_KEY = 'launch_event';

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
};
