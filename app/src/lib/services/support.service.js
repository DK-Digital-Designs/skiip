import { supabase } from '../supabase';
import { getFunctionAuthHeaders } from './function-auth';
import { readFunctionErrorPayload } from './function-error';

async function throwSupportError(error, fallback) {
    const payload = await readFunctionErrorPayload(error);
    throw new Error(payload?.error || error?.message || fallback);
}

export const SupportService = {
    async submitRequest(payload) {
        if (!supabase) throw new Error('Supabase not configured');
        const headers = await getFunctionAuthHeaders();
        const { data, error } = await supabase.functions.invoke('support-request', {
            headers,
            body: payload,
        });

        if (error) await throwSupportError(error, 'Unable to submit your request.');
        return data?.request;
    },

    async getAdminRequests() {
        if (!supabase) return [];
        const headers = await getFunctionAuthHeaders();
        const { data, error } = await supabase.functions.invoke('admin-support-request', {
            headers,
            body: { action: 'list' },
        });

        if (error) await throwSupportError(error, 'Unable to load issues.');
        return data?.requests || [];
    },

    async updateAdminRequest(requestId, { status, priority, internalNotes }) {
        if (!supabase) throw new Error('Supabase not configured');
        const headers = await getFunctionAuthHeaders();
        const { data, error } = await supabase.functions.invoke('admin-support-request', {
            headers,
            body: { action: 'update', requestId, status, priority, internalNotes },
        });

        if (error) await throwSupportError(error, 'Unable to update issue.');
        return data?.request;
    },
};
