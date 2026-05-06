import { supabase } from '../supabase';
import { getFunctionAuthHeaders } from './function-auth';
import { createCheckoutFunctionError } from './function-error';

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
            throw await createCheckoutFunctionError(error);
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
    },

    /**
     * Reconcile a vendor's Stripe Connect account status against live Stripe state.
     * @param {object} params
     * @param {string} params.storeId
     */
    async reconcileConnectStatus({ storeId }) {
        if (!supabase) throw new Error('Supabase not configured');
        const headers = await getFunctionAuthHeaders();

        const { data, error } = await supabase.functions.invoke('stripe-connect-status', {
            headers,
            body: {
                store_id: storeId,
            }
        });

        if (error) {
            console.error('Stripe Connect Status Error:', error);
            throw new Error(error.message || 'Failed to refresh Stripe Connect status');
        }

        return data; // { store }
    }
};
