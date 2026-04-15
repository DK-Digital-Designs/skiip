import { supabase } from '../supabase';
import { getFunctionAuthHeaders } from './function-auth';

export const RefundService = {
    async refundOrder(orderId, reason) {
        if (!supabase) throw new Error('Supabase not configured');
        const headers = await getFunctionAuthHeaders();

        const { data, error } = await supabase.functions.invoke('stripe-refund', {
            headers,
            body: {
                orderId,
                reason,
            },
        });

        if (error) throw error;
        return data;
    },
};
