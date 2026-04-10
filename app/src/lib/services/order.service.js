import { supabase } from '../supabase';

export const OrderService = {
    /**
     * Create a new order
     * @param {object} orderData 
     * @param {string} orderData.store_id
     * @param {array} orderData.items
     * @param {number} orderData.total
     * @param {string} orderData.customer_email
     * @param {string} orderData.customer_phone
     * @param {string} orderData.notes
     * @param {boolean} orderData.whatsapp_opt_in
     */
    async createOrder({ store_id, items, total, customer_email, customer_phone, notes, user_id, whatsapp_opt_in = false }) {
        if (!supabase) throw new Error('Supabase not configured');

        // Use RPC for atomic transaction of order + order_items
        const { data, error } = await supabase.rpc('create_order_v1', {
            p_store_id: store_id,
            p_items: items,
            p_total: total,
            p_customer_email: customer_email,
            p_customer_phone: customer_phone,
            p_notes: notes,
            p_user_id: user_id || null, // Allow null for guest checkout
            p_whatsapp_opt_in: whatsapp_opt_in
        });

        if (error) throw error;
        return data;
    },

    /**
     * Get orders for the current user
     */
    async getMyOrders() {
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('orders')
            .select('*, stores(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Get orders for a specific store (Seller view)
     * @param {string} storeId 
     * @param {string} filter 'active' | 'all'
     */
    async getStoreOrders(storeId, filter = 'active') {
        if (!supabase) return [];

        let query = supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('store_id', storeId)
            .order('created_at', { ascending: false });

        if (filter === 'active') {
            query = query.in('status', ['pending', 'paid', 'processing', 'preparing', 'ready']);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    /**
     * Update order status
     * @param {string} orderId 
     * @param {string} status 
     */
    async updateOrderStatus(orderId, status) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase
            .from('orders')
            .update({ status })
            .eq('id', orderId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Get order by ID
     * @param {string} id 
     */
    async getOrderById(id) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('orders')
            .select('*, stores(name, pickup_location), order_items(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    }
};
