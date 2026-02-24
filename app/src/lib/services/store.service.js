import { supabase } from '../supabase';

export const StoreService = {
    /**
     * Get all active stores (vendors)
     */
    async getStores() {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('status', 'active')
            .is('deleted_at', null)
            .order('name');

        if (error) throw error;
        return data;
    },

    /**
     * Get store by ID
     * @param {string} id 
     */
    async getStoreById(id) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get store for current user (Seller)
     */
    async getMyStore() {
        if (!supabase) return null;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('stores')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'not found'
        return data;
    }
};
