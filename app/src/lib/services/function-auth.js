import { supabase } from '../supabase';

export async function getFunctionAuthHeaders() {
    if (!supabase) throw new Error('Supabase not configured');

    const {
        data: { session },
        error,
    } = await supabase.auth.getSession();

    if (error) {
        throw error;
    }

    const accessToken = session?.access_token;
    if (!accessToken) {
        throw new Error('Your session has expired. Please sign in again.');
    }

    return {
        Authorization: `Bearer ${accessToken}`,
    };
}
