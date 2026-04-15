import { supabase } from '../supabase';
import { getFunctionAuthHeaders } from './function-auth';

export const StripeService = {
    /**
     * Create a Stripe Checkout Session via Supabase Edge Function
     * @param {object} params
     * @param {string} params.orderId
     * @param {string} params.returnUrl
     */
    async createCheckoutSession({ orderId, returnUrl }) {
        if (!supabase) throw new Error('Supabase not configured');
        const headers = await getFunctionAuthHeaders();

        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
            headers,
            body: {
                orderDetails: {
                    order_id: orderId
                },
                returnUrl: returnUrl
            }
        });

        if (error) {
            console.error('Stripe Checkout Error:', error);
            
            // If it's a 403 or has specific details, throw a more useful error
            if (error.context?.status === 403 || error.status === 403) {
                // If we can get the JSON response (VENDOR_NOT_READY etc.)
                throw new Error('VENDOR_NOT_READY');
            }
            
            throw new Error(error.message || 'Failed to initialize payment');
        }

        return data; // { sessionId, url }
    },

    /**
     * Create a Stripe Onboarding Link for a vendor
     * @param {object} params
     * @param {string} params.storeId
     * @param {string} params.returnUrl
     * @param {string} params.refreshUrl
     */
    async createOnboardingLink({ storeId, returnUrl, refreshUrl }) {
        if (!supabase) throw new Error('Supabase not configured');
        const headers = await getFunctionAuthHeaders();

        const { data, error } = await supabase.functions.invoke('stripe-onboarding-link', {
            headers,
            body: {
                store_id: storeId,
                return_url: returnUrl,
                refresh_url: refreshUrl
            }
        });

        if (error) {
            console.error('Stripe Onboarding Error:', error);
            throw new Error(error.message || 'Failed to generate onboarding link');
        }

        return data; // { url }
    }
};
