import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../supabase';

// Replace with your public key from Stripe Dashboard
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

/**
 * Stripe Service for handling payments
 */
export const StripeService = {
    /**
     * Create a checkout session and redirect to Stripe
     * @param {Object} data Order details
     */
    async createCheckoutSession(data) {
        // Check if Stripe is configured
        if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
            console.warn('Stripe public key missing. Falling back to mock success.');
            return { success: true, mock: true };
        }

        try {
            // Get current session for user context (if any)
            const { data: authData } = await supabase.auth.getSession();
            const session = authData?.session;

            // Call Supabase Edge Function
            const response = await supabase.functions.invoke('stripe-checkout', {
                body: data,
                headers: session ? { Authorization: `Bearer ${session.access_token}` } : {},
            });

            if (response.error) {
                console.error("Edge function returned error:", response.error);
                throw new Error("Failed to create checkout session");
            }

            const { sessionId, url } = response.data;

            if (url) {
                // If the edge function returns a full redirect URL, we can just use that
                window.location.href = url;
            } else {
                // Otherwise use the Stripe SDK to redirect via sessionId
                const stripe = await stripePromise;
                const { error } = await stripe.redirectToCheckout({
                    sessionId: sessionId,
                });

                if (error) throw error;
            }

        } catch (err) {
            console.error('Stripe Error:', err);
            throw err;
        }
    }
};
