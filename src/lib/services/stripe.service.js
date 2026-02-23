import { loadStripe } from '@stripe/stripe-js';

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
            // This expects a backend endpoint that interacts with the Stripe API
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const session = await response.json();

            const stripe = await stripePromise;
            const { error } = await stripe.redirectToCheckout({
                sessionId: session.id,
            });

            if (error) throw error;
        } catch (err) {
            console.error('Stripe Error:', err);
            throw err;
        }
    }
};
