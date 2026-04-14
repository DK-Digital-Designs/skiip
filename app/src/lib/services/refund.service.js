import { supabase } from '../supabase';

export const RefundService = {
    async refundOrder(orderId, reason) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.functions.invoke('stripe-refund', {
            body: {
                orderId,
                reason,
            },
        });

        if (error) throw error;
        return data;
    },
};
