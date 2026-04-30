import { supabase } from '../supabase';
import { getFunctionAuthHeaders } from './function-auth';

export const OrderService = {
    /**
     * Create a new server-authoritative order
     */
    async createOrder({
        items,
        customer_email,
        customer_phone,
        notes,
        tip_amount = 0,
        whatsapp_opt_in = false,
        scheduled_collection_at = null,
        scheduled_collection_timezone = 'Europe/London',
    }) {
        if (!supabase) throw new Error('Supabase not configured');
        const headers = await getFunctionAuthHeaders();

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
            scheduled_collection_at,
            scheduled_collection_timezone,
        };

        const { data, error } = await supabase.functions.invoke('order-create', {
            headers,
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
            .eq('store_id', storeId);

        if (filter === 'scheduled') {
            query = query
                .not('scheduled_collection_at', 'is', null)
                .in('status', ['pending', 'paid', 'processing', 'preparing', 'ready'])
                .order('scheduled_collection_at', { ascending: true });
        } else if (filter === 'active') {
            query = query.in('status', ['pending', 'paid', 'processing', 'preparing', 'ready']);
            query = query.order('created_at', { ascending: false });
        } else {
            query = query.order('created_at', { ascending: false });
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
        const headers = await getFunctionAuthHeaders();

        const { data, error } = await supabase.functions.invoke('order-transition', {
            headers,
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
