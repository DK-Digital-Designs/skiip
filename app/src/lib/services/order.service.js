import { supabase } from '../supabase';

export const OrderService = {
    /**
     * Create a new server-authoritative order
     */
    async createOrder({ items, customer_email, customer_phone, notes, tip_amount = 0, whatsapp_opt_in = false }) {
        if (!supabase) throw new Error('Supabase not configured');

        const payload = {
            items: items.map((item) => ({
                product_id: item.id,
                quantity: item.quantity,
            })),
            customer_email,
            customer_phone,
            notes,
            tip_amount,
            whatsapp_opt_in,
        };

        const { data, error } = await supabase.functions.invoke('order-create', {
            body: payload,
        });

        if (error) throw error;
        if (!data?.order) throw new Error('Order creation returned no order');
        return data.order;
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

        const { data, error } = await supabase.functions.invoke('order-transition', {
            body: {
                orderId,
                status,
            },
        });

        if (error) throw error;
        return data?.order;
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
