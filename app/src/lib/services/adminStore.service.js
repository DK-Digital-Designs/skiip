import { supabase } from '../supabase';
import { getFunctionAuthHeaders } from './function-auth';

async function invokeAdminStore(body) {
    if (!supabase) throw new Error('Supabase not configured');
    const headers = await getFunctionAuthHeaders();

    const { data, error } = await supabase.functions.invoke('admin-store', {
        headers,
        body,
    });

    if (error) throw error;
    return data?.store;
}

export const AdminStoreService = {
    createVendorStore({ userId, name, slug }) {
        return invokeAdminStore({
            action: 'create',
            userId,
            name,
            slug,
        });
    },

    updateStoreStatus(storeId, status) {
        return invokeAdminStore({
            action: 'update_status',
            storeId,
            status,
        });
    },

    archiveStore(storeId) {
        return invokeAdminStore({
            action: 'archive',
            storeId,
        });
    },
};
