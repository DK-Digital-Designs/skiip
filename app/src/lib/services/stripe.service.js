import { supabase } from '../supabase';

export const StripeService = {
    /**
     * Create a Stripe Checkout Session via Supabase Edge Function
     * @param {object} params
     * @param {string} params.orderId
     * @param {array} params.items
     * @param {string} params.returnUrl
     */
    async createCheckoutSession({ orderId, items, returnUrl }) {
        if (!supabase) throw new Error('Supabase not configured');

        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
            body: {
                orderDetails: {
                    order_id: orderId,
                    items: items
                },
                returnUrl: returnUrl
            }
        });

        if (error) {
            console.error('Stripe Checkout Error:', error);
            throw new Error(error.message || 'Failed to initialize payment');
        }

        return data; // { sessionId, url }
    }
};
